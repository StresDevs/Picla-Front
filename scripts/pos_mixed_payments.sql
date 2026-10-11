-- Ejecutar en Supabase después de pos_price_changes.sql.
-- Conserva pos_create_sale y sus validaciones de precios/inventario/crédito.
BEGIN;

ALTER TABLE public.pos_sale_queue ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.pos_sale_payments (
  sale_id uuid NOT NULL REFERENCES public.pos_sales(id),
  payment_index smallint NOT NULL CHECK (payment_index IN (1, 2)),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'qr')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0 AND amount::text NOT IN ('NaN', 'Infinity', '-Infinity')),
  PRIMARY KEY (sale_id, payment_index),
  UNIQUE (sale_id, payment_method)
);
ALTER TABLE public.pos_sale_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pos_sale_payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pos_sale_payments TO authenticated;
DROP POLICY IF EXISTS pos_sale_payments_select ON public.pos_sale_payments;
CREATE POLICY pos_sale_payments_select ON public.pos_sale_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pos_sales s WHERE s.id = sale_id));

CREATE OR REPLACE FUNCTION public.pos_validate_mixed_payments(p_payments jsonb, p_total numeric)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_payment jsonb; v_amount numeric; v_sum numeric := 0; v_methods text[] := '{}';
BEGIN
  IF p_total IS NULL OR p_total <= 0 OR p_total::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION 'El total del pago mixto debe ser mayor a cero';
  END IF;
  IF jsonb_typeof(p_payments) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Se requieren dos pagos'; END IF;
  IF jsonb_array_length(p_payments) <> 2 THEN RAISE EXCEPTION 'Se requieren exactamente dos pagos'; END IF;
  FOR v_payment IN SELECT value FROM jsonb_array_elements(p_payments) LOOP
    IF coalesce(v_payment->>'method', '') NOT IN ('cash', 'card', 'qr')
       OR jsonb_typeof(v_payment->'amount') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Método o monto de pago inválido';
    END IF;
    v_amount := (v_payment->>'amount')::numeric;
    IF v_amount <= 0 OR v_amount <> round(v_amount, 2) THEN
      RAISE EXCEPTION 'Cada pago debe ser positivo y tener como máximo dos decimales';
    END IF;
    IF (v_payment->>'method') = ANY(v_methods) THEN RAISE EXCEPTION 'Selecciona métodos de pago diferentes'; END IF;
    v_methods := array_append(v_methods, v_payment->>'method');
    v_sum := v_sum + v_amount;
  END LOOP;
  IF v_sum <> p_total THEN RAISE EXCEPTION 'Los dos pagos deben sumar exactamente el total de la venta (%)', p_total; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_validate_mixed_payments(jsonb, numeric) FROM PUBLIC;

-- Se ejecuta dentro de la transacción original: dos movimientos, una venta y un descuento de stock.
-- También distribuye devoluciones/anulaciones según los pagos originales, acumulando centavos.
CREATE OR REPLACE FUNCTION public.pos_split_mixed_cash_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sale public.pos_sales;
  v_sale_id uuid;
  v_payment jsonb;
  v_second public.cash_movements;
  v_first_amount numeric;
  v_second_amount numeric;
  v_prior_total numeric;
  v_prior_first numeric;
  v_first_method text;
  v_second_method text;
  v_is_return boolean;
BEGIN
  IF NEW.reference_table = 'pos_sales' THEN v_sale_id := NEW.reference_id;
  ELSIF NEW.reference_table = 'pos_sale_returns' THEN
    SELECT r.sale_id INTO v_sale_id FROM public.pos_sale_returns r WHERE r.id = NEW.reference_id;
  ELSE RETURN NEW;
  END IF;
  SELECT * INTO v_sale FROM public.pos_sales WHERE id = v_sale_id FOR UPDATE;
  IF NOT FOUND OR v_sale.metadata->>'payment_type' IS DISTINCT FROM 'mixed' THEN RETURN NEW; END IF;
  IF v_sale.sale_mode <> 'immediate' OR v_sale.payment_currency <> 'BOB' THEN
    RAISE EXCEPTION 'El pago mixto requiere una venta al contado en bolivianos';
  END IF;
  PERFORM public.pos_validate_mixed_payments(v_sale.metadata->'payments', v_sale.total_amount);
  v_first_method := v_sale.metadata->'payments'->0->>'method';
  v_second_method := v_sale.metadata->'payments'->1->>'method';
  -- Solo las filas internas del trigger pueden saltar el reparto.
  IF pg_trigger_depth() > 1 AND NEW.metadata->>'mixed_payment_index' = '2' THEN RETURN NEW; END IF;
  v_is_return := NEW.movement_type IN ('sale_return_cash', 'sale_return_card', 'sale_return_qr');
  IF v_is_return THEN
    IF v_sale.status <> 'completed' THEN RAISE EXCEPTION 'La venta ya fue anulada'; END IF;
    SELECT coalesce(sum(m.amount), 0), coalesce(sum(m.amount) FILTER (WHERE m.payment_method = v_first_method), 0)
      INTO v_prior_total, v_prior_first
      FROM public.cash_movements m
      WHERE m.movement_type IN ('sale_return_cash', 'sale_return_card', 'sale_return_qr') AND (
        (m.reference_table = 'pos_sales' AND m.reference_id = v_sale.id) OR
        (m.reference_table = 'pos_sale_returns' AND m.reference_id IN (SELECT r.id FROM public.pos_sale_returns r WHERE r.sale_id = v_sale.id))
      );
    IF v_prior_total + NEW.amount > v_sale.total_amount THEN RAISE EXCEPTION 'La devolución excede el total pagado'; END IF;
    v_first_amount := round((v_prior_total + NEW.amount) * (v_sale.metadata->'payments'->0->>'amount')::numeric / v_sale.total_amount, 2) - v_prior_first;
    v_second_amount := NEW.amount - v_first_amount;
  ELSE
    IF NEW.movement_type NOT IN ('sale_cash', 'sale_card', 'sale_qr') OR NEW.amount <> v_sale.total_amount THEN
      RAISE EXCEPTION 'El pago mixto debe cubrir el total final de la venta';
    END IF;
    FOR v_payment IN SELECT value FROM jsonb_array_elements(v_sale.metadata->'payments') LOOP
      INSERT INTO public.pos_sale_payments(sale_id, payment_index, payment_method, amount)
      VALUES (v_sale.id, CASE WHEN v_payment->>'method' = v_first_method THEN 1 ELSE 2 END, v_payment->>'method', (v_payment->>'amount')::numeric);
    END LOOP;
    v_first_amount := (v_sale.metadata->'payments'->0->>'amount')::numeric;
    v_second_amount := (v_sale.metadata->'payments'->1->>'amount')::numeric;
  END IF;
  v_second := NEW;
  v_second.id := gen_random_uuid();
  v_second.amount := v_second_amount;
  v_second.payment_method := v_second_method;
  v_second.movement_type := public.pos_sale_cash_movement_type(v_second_method, v_is_return);
  v_second.metadata := coalesce(NEW.metadata, '{}'::jsonb) || jsonb_build_object('mixed_sale_id', v_sale.id, 'mixed_payment_index', 2);
  IF v_second_amount > 0 THEN INSERT INTO public.cash_movements SELECT (v_second).*; END IF;
  IF v_first_amount = 0 THEN RETURN NULL; END IF;
  NEW.amount := v_first_amount;
  NEW.payment_method := v_first_method;
  NEW.movement_type := public.pos_sale_cash_movement_type(v_first_method, v_is_return);
  NEW.metadata := coalesce(NEW.metadata, '{}'::jsonb) || jsonb_build_object('mixed_sale_id', v_sale.id, 'mixed_payment_index', 1);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_split_mixed_cash_movement() FROM PUBLIC;
DROP TRIGGER IF EXISTS pos_mixed_cash_split ON public.cash_movements;
CREATE TRIGGER pos_mixed_cash_split BEFORE INSERT ON public.cash_movements
  FOR EACH ROW EXECUTE FUNCTION public.pos_split_mixed_cash_movement();

-- Verifica el estado final incluso si alguien invoca la RPC antigua con metadatos mixtos.
CREATE OR REPLACE FUNCTION public.pos_check_mixed_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sale public.pos_sales;
BEGIN
  SELECT * INTO v_sale FROM public.pos_sales WHERE id = NEW.id;
  IF v_sale.metadata->>'payment_type' = 'mixed' THEN
    IF v_sale.sale_mode <> 'immediate' OR v_sale.payment_currency <> 'BOB' OR v_sale.pending_amount <> 0 THEN
      RAISE EXCEPTION 'El pago mixto debe quedar totalmente pagado en bolivianos';
    END IF;
    PERFORM public.pos_validate_mixed_payments(v_sale.metadata->'payments', v_sale.total_amount);
    IF (SELECT count(*) FROM public.pos_sale_payments p WHERE p.sale_id = v_sale.id) <> 2 OR
       (SELECT sum(p.amount) FROM public.pos_sale_payments p WHERE p.sale_id = v_sale.id) IS DISTINCT FROM v_sale.total_amount THEN
      RAISE EXCEPTION 'No se registraron los dos pagos de la venta';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_sale.metadata->'payments') entry
      WHERE NOT EXISTS (SELECT 1 FROM public.pos_sale_payments p WHERE p.sale_id = v_sale.id
        AND p.payment_method = entry->>'method' AND p.amount = (entry->>'amount')::numeric)) THEN
      RAISE EXCEPTION 'El desglose de pagos no coincide con los pagos registrados';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_check_mixed_sale() FROM PUBLIC;
DROP TRIGGER IF EXISTS pos_mixed_sale_check ON public.pos_sales;
CREATE CONSTRAINT TRIGGER pos_mixed_sale_check AFTER INSERT OR UPDATE ON public.pos_sales
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.pos_check_mixed_sale();

CREATE OR REPLACE FUNCTION public.pos_create_mixed_sale(
  p_branch_id uuid, p_customer_name text, p_payment_method text, p_payment_currency text,
  p_exchange_rate numeric, p_sale_mode text, p_advance_amount numeric, p_items jsonb,
  p_metadata jsonb, p_payments jsonb
)
RETURNS TABLE(sale_id uuid, total_amount_bob numeric, total_amount_usd numeric, cash_movement_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_sale_mode IS DISTINCT FROM 'immediate' OR p_payment_currency IS DISTINCT FROM 'BOB' OR coalesce(p_advance_amount, 0) <> 0 THEN
    RAISE EXCEPTION 'El pago mixto requiere una venta al contado en bolivianos';
  END IF;
  RETURN QUERY SELECT s.* FROM public.pos_create_sale(
    p_branch_id, p_customer_name, 'cash', 'BOB', p_exchange_rate, 'immediate', 0, p_items,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('payment_type', 'mixed', 'payments', p_payments)
  ) s;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_create_mixed_sale(uuid, text, text, text, numeric, text, numeric, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pos_create_mixed_sale(uuid, text, text, text, numeric, text, numeric, jsonb, jsonb, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.pos_enqueue_mixed_sale(
  p_branch_id uuid, p_customer_name text, p_payment_method text, p_payment_currency text,
  p_exchange_rate numeric, p_sale_mode text, p_advance_amount numeric, p_items jsonb, p_payments jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_total numeric;
BEGIN
  IF p_sale_mode IS DISTINCT FROM 'immediate' OR p_payment_currency IS DISTINCT FROM 'BOB' OR coalesce(p_advance_amount, 0) <> 0 THEN
    RAISE EXCEPTION 'El pago mixto requiere una venta al contado en bolivianos';
  END IF;
  v_id := public.pos_enqueue_sale(p_branch_id, p_customer_name, 'cash', 'BOB', p_exchange_rate, 'immediate', 0, p_items);
  SELECT q.total_amount_bob INTO v_total FROM public.pos_sale_queue q WHERE q.id = v_id;
  PERFORM public.pos_validate_mixed_payments(p_payments, v_total);
  UPDATE public.pos_sale_queue SET metadata = metadata || jsonb_build_object('payment_type', 'mixed', 'payments', p_payments)
    WHERE id = v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.pos_enqueue_mixed_sale(uuid, text, text, text, numeric, text, numeric, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pos_enqueue_mixed_sale(uuid, text, text, text, numeric, text, numeric, jsonb, jsonb) TO authenticated;

-- Añade metadatos a la aprobación sin reemplazar su lógica actual ni sus permisos.
DO $$
DECLARE v_definition text; v_updated text;
  v_integration text := 'coalesce(v_queue.metadata, ''{}''::jsonb) || jsonb_build_object(''queued_sale_id'', v_queue.id)';
BEGIN
  SELECT pg_get_functiondef('public.pos_approve_queued_sale(uuid,text)'::regprocedure) INTO v_definition;
  IF position(v_integration IN v_definition) = 0 THEN
    v_updated := replace(v_definition, 'jsonb_build_object(''queued_sale_id'', v_queue.id)',
      v_integration);
    IF v_updated = v_definition THEN RAISE EXCEPTION 'Revisar pos_approve_queued_sale: no se encontró el punto de integración de metadatos'; END IF;
    EXECUTE v_updated;
  END IF;
END;
$$;

-- Mantiene una fila por venta; las dos columnas permiten desglosar cobros sin duplicar ventas.
CREATE OR REPLACE FUNCTION public.pos_report_payment_shares(p_sale public.pos_sales)
RETURNS TABLE(method text, amount numeric, share numeric)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT p.payment_method, p.amount, p.amount / nullif(p_sale.total_amount, 0)
  FROM public.pos_sale_payments p WHERE p.sale_id = p_sale.id
  UNION ALL
  SELECT p_sale.payment_method, p_sale.total_amount, 1::numeric
  WHERE NOT EXISTS (SELECT 1 FROM public.pos_sale_payments p WHERE p.sale_id = p_sale.id);
$$;
REVOKE ALL ON FUNCTION public.pos_report_payment_shares(public.pos_sales) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_report_sales_by_day(p_branch_id uuid DEFAULT NULL, p_date_from date DEFAULT NULL, p_date_to date DEFAULT NULL, p_payment_method text DEFAULT NULL)
RETURNS TABLE(sale_date date, branch_id uuid, branch_name text, payment_method text, total_amount numeric, sale_count bigint, avg_sale numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.current_request_user_id() IS NULL OR coalesce(public.pos_current_role_name(), '') NOT IN ('admin','manager','employee','read_only') THEN
    RAISE EXCEPTION 'No tienes acceso a reportes';
  END IF;
  RETURN QUERY SELECT s.created_at::date, s.branch_id, b.name, pay.method,
    sum(pay.amount), count(DISTINCT s.id), round(avg(pay.amount), 2)
  FROM public.pos_sales s JOIN public.branches b ON b.id = s.branch_id
  CROSS JOIN LATERAL public.pos_report_payment_shares(s) pay
  WHERE s.status = 'completed'
    AND (public.pos_current_role_name() = 'admin' OR s.branch_id = public.current_user_branch_id())
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND (p_date_from IS NULL OR s.created_at::date >= p_date_from)
    AND (p_date_to IS NULL OR s.created_at::date <= p_date_to)
    AND (p_payment_method IS NULL OR pay.method = lower(trim(p_payment_method)))
  GROUP BY s.created_at::date, s.branch_id, b.name, pay.method ORDER BY s.created_at::date DESC, sum(pay.amount) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_report_profit_by_day(p_branch_id uuid DEFAULT NULL, p_date_from date DEFAULT NULL, p_date_to date DEFAULT NULL, p_payment_method text DEFAULT NULL)
RETURNS TABLE(sale_date date, branch_id uuid, branch_name text, payment_method text, total_revenue numeric, total_cost numeric, total_profit numeric, sale_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.current_request_user_id() IS NULL OR coalesce(public.pos_current_role_name(), '') NOT IN ('admin','manager','employee','read_only') THEN
    RAISE EXCEPTION 'No tienes acceso a reportes de ganancia';
  END IF;
  RETURN QUERY SELECT s.created_at::date, s.branch_id, b.name, pay.method,
    coalesce(sum(si.quantity * si.unit_price * pay.share), 0),
    coalesce(sum(si.quantity * p.cost * pay.share), 0),
    coalesce(sum(si.quantity * (si.unit_price - p.cost) * pay.share), 0), count(DISTINCT s.id)
  FROM public.pos_sales s JOIN public.pos_sale_items si ON si.sale_id = s.id
  JOIN public.parts p ON p.id = si.part_id JOIN public.branches b ON b.id = s.branch_id
  CROSS JOIN LATERAL public.pos_report_payment_shares(s) pay
  WHERE s.status = 'completed'
    AND (public.pos_current_role_name() = 'admin' OR s.branch_id = public.current_user_branch_id())
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND (p_date_from IS NULL OR s.created_at::date >= p_date_from)
    AND (p_date_to IS NULL OR s.created_at::date <= p_date_to)
    AND (p_payment_method IS NULL OR pay.method = lower(trim(p_payment_method)))
  GROUP BY s.created_at::date, s.branch_id, b.name, pay.method ORDER BY s.created_at::date DESC, b.name, pay.method;
END;
$$;
REVOKE ALL ON FUNCTION public.get_report_sales_by_day(uuid, date, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_report_profit_by_day(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_report_sales_by_day(uuid, date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_report_profit_by_day(uuid, date, date, text) TO authenticated;
-- Conteo independiente para que una venta mixta no duplique los totales del reporte.
CREATE OR REPLACE FUNCTION public.get_report_unique_sale_counts(p_branch_id uuid DEFAULT NULL, p_date_from date DEFAULT NULL, p_date_to date DEFAULT NULL, p_payment_method text DEFAULT NULL)
RETURNS TABLE(sale_date date, branch_id uuid, sale_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.current_request_user_id() IS NULL OR coalesce(public.pos_current_role_name(), '') NOT IN ('admin','manager','employee','read_only') THEN
    RAISE EXCEPTION 'No tienes acceso a reportes';
  END IF;
  RETURN QUERY SELECT s.created_at::date, s.branch_id, count(*)
  FROM public.pos_sales s WHERE s.status = 'completed'
    AND (public.pos_current_role_name() = 'admin' OR s.branch_id = public.current_user_branch_id())
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND (p_date_from IS NULL OR s.created_at::date >= p_date_from)
    AND (p_date_to IS NULL OR s.created_at::date <= p_date_to)
    AND (p_payment_method IS NULL OR EXISTS (SELECT 1 FROM public.pos_report_payment_shares(s) p WHERE p.method = lower(trim(p_payment_method))))
  GROUP BY s.created_at::date, s.branch_id;
END;
$$;
REVOKE ALL ON FUNCTION public.get_report_unique_sale_counts(uuid, date, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_report_unique_sale_counts(uuid, date, date, text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
