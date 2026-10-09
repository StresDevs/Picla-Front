-- Ejecutar una vez en Supabase antes de usar el permiso de precios del POS.
-- No cambia las funciones existentes de venta, caja, cotizaciones ni roles.
BEGIN;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS pos_price_changes_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.pos_sale_queue
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.pos_set_price_changes_enabled(p_enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_admin();
  IF p_enabled IS NULL THEN
    RAISE EXCEPTION 'El permiso de cambios de precios es obligatorio';
  END IF;
  UPDATE public.app_settings
  SET pos_price_changes_enabled = p_enabled,
      updated_by = public.current_request_user_id(), updated_at = now()
  WHERE settings_key = 'default';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Guarda primero la configuración general de la empresa';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_set_price_changes_enabled(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pos_set_price_changes_enabled(boolean) TO authenticated;

-- Consulta aparte para conservar la firma de pos_get_catalog en instalaciones existentes.
CREATE OR REPLACE FUNCTION public.pos_get_price_limits(p_branch_id uuid DEFAULT NULL)
RETURNS TABLE(part_id uuid, quotation_min_price numeric, quotation_max_price numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_branch_id uuid;
BEGIN
  IF public.current_request_user_id() IS NULL OR
     coalesce(public.pos_current_role_name(), '') NOT IN ('admin', 'manager', 'employee', 'read_only') THEN
    RAISE EXCEPTION 'No tienes acceso al POS';
  END IF;
  v_branch_id := public.pos_resolve_branch(p_branch_id);
  RETURN QUERY SELECT p.id, p.quotation_min_price, p.quotation_max_price
    FROM public.parts p WHERE p.branch_id = v_branch_id AND coalesce(p.is_active, true);
END;
$$;
REVOKE ALL ON FUNCTION public.pos_get_price_limits(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pos_get_price_limits(uuid) TO authenticated;

-- Solo se invoca desde triggers; el servidor usa los precios actuales del catálogo.
CREATE OR REPLACE FUNCTION public.pos_validate_price_change(p_part public.parts, p_price numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enabled boolean;
  v_min numeric;
  v_max numeric;
BEGIN
  IF p_price IS NULL OR p_price::text IN ('NaN', 'Infinity', '-Infinity') OR p_price < 0 THEN
    RAISE EXCEPTION 'Precio inválido para %', p_part.code;
  END IF;
  IF p_price = p_part.price THEN RETURN; END IF;
  SELECT s.pos_price_changes_enabled INTO v_enabled
    FROM public.app_settings s WHERE s.settings_key = 'default' FOR SHARE;
  IF NOT coalesce(v_enabled, false) THEN
    RAISE EXCEPTION 'Un administrador debe habilitar los cambios de precios en el POS';
  END IF;
  v_min := coalesce(p_part.quotation_min_price, round(p_part.price * 0.90, 2));
  v_max := coalesce(p_part.quotation_max_price, round(p_part.price * 1.20, 2));
  IF p_price < v_min OR p_price > v_max THEN
    RAISE EXCEPTION 'El precio de % debe estar entre % y %', p_part.code, v_min, v_max;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_validate_price_change(public.parts, numeric) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.pos_guard_queue_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_part public.parts;
  v_queue public.pos_sale_queue;
  v_change jsonb;
BEGIN
  -- Los componentes de kits mantienen su flujo de precios existente.
  IF NEW.source_type <> 'product' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.unit_price IS DISTINCT FROM OLD.unit_price THEN
      RAISE EXCEPTION 'El precio solo puede cambiar antes de enviar la venta a cola';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO v_queue FROM public.pos_sale_queue WHERE id = NEW.queue_id FOR UPDATE;
  IF v_queue.status <> 'queued' THEN
    RAISE EXCEPTION 'La venta en cola ya fue procesada';
  END IF;
  SELECT * INTO v_part FROM public.parts WHERE id = NEW.part_id AND branch_id = v_queue.branch_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado en la sucursal'; END IF;
  PERFORM public.pos_validate_price_change(v_part, NEW.unit_price);
  v_change := jsonb_build_object(
    'part_id', NEW.part_id, 'part_name', v_part.name,
    'original_price', v_part.price, 'final_price', NEW.unit_price,
    'quantity', NEW.quantity, 'changed_by', public.current_request_user_id(),
    'changed_at', now());
  UPDATE public.pos_sale_queue SET metadata = metadata || jsonb_build_object(
    'ui_module', 'pos/sales', 'price_changes',
    coalesce(metadata->'price_changes', '[]'::jsonb) ||
      CASE WHEN NEW.unit_price <> v_part.price THEN jsonb_build_array(v_change) ELSE '[]'::jsonb END)
  WHERE id = NEW.queue_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_guard_queue_price() FROM PUBLIC;
DROP TRIGGER IF EXISTS pos_queue_price_guard ON public.pos_sale_queue_items;
CREATE TRIGGER pos_queue_price_guard BEFORE INSERT OR UPDATE OF unit_price
  ON public.pos_sale_queue_items FOR EACH ROW EXECUTE FUNCTION public.pos_guard_queue_price();

CREATE OR REPLACE FUNCTION public.pos_guard_sale_price()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sale public.pos_sales;
  v_queue public.pos_sale_queue;
  v_part public.parts;
  v_change jsonb;
  v_changes jsonb;
BEGIN
  SELECT * INTO v_sale FROM public.pos_sales WHERE id = NEW.sale_id;
  IF v_sale.metadata->>'queued_sale_id' IS NOT NULL THEN
    SELECT * INTO v_queue FROM public.pos_sale_queue
      WHERE id = (v_sale.metadata->>'queued_sale_id')::uuid AND branch_id = v_sale.branch_id;
  END IF;
  -- Cotizaciones y otros módulos conservan sus reglas actuales.
  IF coalesce(v_sale.metadata->>'ui_module', '') <> 'pos/sales'
     AND coalesce(v_queue.metadata->>'ui_module', '') <> 'pos/sales' THEN RETURN NEW; END IF;
  IF NEW.source_type <> 'product' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.unit_price IS DISTINCT FROM OLD.unit_price THEN
      RAISE EXCEPTION 'El precio no puede cambiar después de confirmar la venta';
    END IF;
    RETURN NEW;
  END IF;
  SELECT * INTO v_part FROM public.parts WHERE id = NEW.part_id AND branch_id = NEW.branch_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Producto no encontrado en la sucursal'; END IF;
  PERFORM public.pos_validate_price_change(v_part, NEW.unit_price);
  IF NOT EXISTS (SELECT 1 FROM public.pos_sale_items WHERE sale_id = NEW.sale_id) THEN
    v_changes := '[]'::jsonb;
  ELSE
    v_changes := coalesce(v_sale.metadata->'price_changes', '[]'::jsonb);
  END IF;
  -- En cola se conserva el precio original y el autor al momento de solicitar la venta.
  SELECT entry INTO v_change FROM jsonb_array_elements(
    coalesce(v_queue.metadata->'price_changes', '[]'::jsonb)) entry
    WHERE entry->>'part_id' = NEW.part_id::text LIMIT 1;
  IF v_change IS NULL AND NEW.unit_price <> v_part.price THEN
    v_change := jsonb_build_object(
      'part_id', NEW.part_id, 'part_name', v_part.name,
      'original_price', v_part.price, 'final_price', NEW.unit_price,
      'quantity', NEW.quantity, 'changed_by', public.current_request_user_id(),
      'changed_at', now());
  END IF;
  IF v_change IS NOT NULL THEN v_changes := v_changes || jsonb_build_array(v_change); END IF;
  UPDATE public.pos_sales SET metadata = metadata || jsonb_build_object('price_changes', v_changes)
    || CASE WHEN v_queue.id IS NOT NULL THEN jsonb_build_object('price_discounts', (
      SELECT string_agg(
        (entry->>'part_name') || ': Bs ' || (entry->>'original_price') || ' → Bs ' || (entry->>'final_price'), '; ')
      FROM jsonb_array_elements(v_changes) entry
    )) ELSE '{}'::jsonb END
    WHERE id = NEW.sale_id;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_guard_sale_price() FROM PUBLIC;
DROP TRIGGER IF EXISTS pos_sale_price_guard ON public.pos_sale_items;
CREATE TRIGGER pos_sale_price_guard BEFORE INSERT OR UPDATE OF unit_price
  ON public.pos_sale_items FOR EACH ROW EXECUTE FUNCTION public.pos_guard_sale_price();

COMMIT;
