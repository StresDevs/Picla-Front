-- Aplicar manualmente después de pos_mixed_payments.sql. Probado sobre copia local.
BEGIN;

CREATE OR REPLACE FUNCTION public.update_product_kit(p_kit_id uuid, p_name text, p_description text, p_category text, p_items jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE k public.product_kits; i jsonb;
BEGIN
  IF public.current_request_user_id() IS NULL OR NOT public.inventory_is_admin() THEN RAISE EXCEPTION 'Solo admin puede editar kits'; END IF;
  SELECT * INTO k FROM public.product_kits WHERE id = p_kit_id AND is_active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kit no encontrado'; END IF;
  IF nullif(trim(p_name),'') IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'Nombre y productos requeridos'; END IF;
  FOR i IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.parts WHERE id=(i->>'part_id')::uuid AND branch_id=k.branch_id AND is_active)
      OR coalesce((i->>'quantity')::numeric,0)<=0 OR coalesce((i->>'kit_price')::numeric,-1)<0
      OR (i->>'quantity') IN ('NaN','Infinity','-Infinity') OR (i->>'kit_price') IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Componente inválido'; END IF;
  END LOOP;
  UPDATE public.product_kits SET name=trim(p_name), description=p_description, category=p_category, updated_by=public.current_request_user_id(), updated_at=now() WHERE id=k.id;
  DELETE FROM public.product_kit_items WHERE kit_id=k.id;
  INSERT INTO public.product_kit_items(kit_id,part_id,quantity,kit_price)
    SELECT k.id,(x->>'part_id')::uuid,(x->>'quantity')::numeric,(x->>'kit_price')::numeric FROM jsonb_array_elements(p_items) x;
END; $$;
REVOKE ALL ON FUNCTION public.update_product_kit(uuid,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_product_kit(uuid,text,text,text,jsonb) TO authenticated;

-- Mantener evidencia histórica, pero rechazar tarjeta en nuevas escrituras incluso vía API directa.
CREATE OR REPLACE FUNCTION public.reject_new_card_payment() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE n jsonb:=to_jsonb(NEW); o jsonb; card_new boolean;
BEGIN
  card_new := n->>'payment_method'='card' OR n->>'movement_type' IN ('sale_card','sale_return_card')
    OR n->'metadata'->>'payment_type'='card'
    OR n->'metadata'->>'credit_initial_payment_method'='card'
    OR jsonb_path_exists(coalesce(n->'metadata','{}'), '$.payments[*] ? (@.method == "card")');
  IF coalesce(card_new,false) THEN
    IF TG_OP='UPDATE' THEN
      o:=to_jsonb(OLD);
      IF (n->'payment_method') IS NOT DISTINCT FROM (o->'payment_method') AND (n->'movement_type') IS NOT DISTINCT FROM (o->'movement_type')
        AND (n->'metadata'->'payments') IS NOT DISTINCT FROM (o->'metadata'->'payments')
        AND (n->'metadata'->'payment_type') IS NOT DISTINCT FROM (o->'metadata'->'payment_type')
        AND (n->'metadata'->'credit_initial_payment_method') IS NOT DISTINCT FROM (o->'metadata'->'credit_initial_payment_method')
        AND (n->'amount') IS NOT DISTINCT FROM (o->'amount') AND (n->'total_amount') IS NOT DISTINCT FROM (o->'total_amount') THEN RETURN NEW; END IF;
    END IF;
    RAISE EXCEPTION 'Los pagos por tarjeta ya no están habilitados. Usa efectivo o QR.';
  END IF;
  RETURN NEW;
END; $$;
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT DISTINCT table_name FROM information_schema.columns WHERE table_schema='public' AND column_name='payment_method' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS reject_card_payment ON public.%I',t.table_name);
    EXECUTE format('CREATE TRIGGER reject_card_payment BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.reject_new_card_payment()',t.table_name);
  END LOOP;
END; $$;

CREATE TABLE IF NOT EXISTS public.pos_sale_edits (
  id uuid PRIMARY KEY, sale_id uuid NOT NULL REFERENCES public.pos_sales(id), branch_id uuid NOT NULL REFERENCES public.branches(id),
  created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), reason text NOT NULL,
  before_sale jsonb NOT NULL, before_items jsonb NOT NULL, after_items jsonb NOT NULL,
  difference numeric(12,2) NOT NULL, payments jsonb NOT NULL, confirmed boolean NOT NULL
);
ALTER TABLE public.pos_sale_edits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pos_sale_edits FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pos_sale_edits TO authenticated;
DROP POLICY IF EXISTS sale_edits_read ON public.pos_sale_edits;
CREATE POLICY sale_edits_read ON public.pos_sale_edits FOR SELECT TO authenticated USING(public.cash_can_access_branch(branch_id));

-- El guard existente de precios se mantiene para inserciones; las ediciones usan la misma validación.
CREATE OR REPLACE FUNCTION public.pos_guard_sale_edit_price() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.parts;
BEGIN
  SELECT * INTO p FROM public.parts WHERE id=NEW.part_id AND branch_id=NEW.branch_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Producto fuera de sucursal'; END IF;
  IF NEW.source_type='product' AND (NEW.unit_price IS DISTINCT FROM OLD.unit_price OR NEW.part_id IS DISTINCT FROM OLD.part_id) THEN PERFORM public.pos_validate_price_change(p,NEW.unit_price); END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS pos_sale_price_guard ON public.pos_sale_items;
CREATE TRIGGER pos_sale_price_guard BEFORE INSERT ON public.pos_sale_items FOR EACH ROW EXECUTE FUNCTION public.pos_guard_sale_price();
DROP TRIGGER IF EXISTS pos_sale_edit_price_guard ON public.pos_sale_items;
CREATE TRIGGER pos_sale_edit_price_guard BEFORE UPDATE OF unit_price ON public.pos_sale_items FOR EACH ROW EXECUTE FUNCTION public.pos_guard_sale_edit_price();

CREATE OR REPLACE FUNCTION public.pos_edit_sale(p_sale_id uuid,p_edit_id uuid,p_expected_items jsonb,p_items jsonb,p_reason text,p_payments jsonb,p_confirmed boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.pos_sales; old_items jsonb; i jsonb; old_line public.pos_sale_items; p public.parts;
  new_total numeric:=0; delta numeric; total_pay numeric:=0; session_id uuid; actor uuid; kept uuid[]:='{}'; line_id uuid;
  qty numeric; price numeric; returned numeric; payments jsonb; net_cash numeric; net_qr numeric;
BEGIN
  actor:=public.current_request_user_id();
  IF actor IS NULL OR public.pos_current_role_name() <> 'admin' THEN RAISE EXCEPTION 'Solo admin puede modificar ventas confirmadas'; END IF;
  SELECT * INTO s FROM public.pos_sales WHERE id=p_sale_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venta no encontrada'; END IF;
  PERFORM public.pos_resolve_branch(s.branch_id);
  IF EXISTS(SELECT 1 FROM public.pos_sale_edits WHERE id=p_edit_id AND sale_id=s.id AND created_by=actor) THEN RETURN jsonb_build_object('sale_id',s.id,'already_saved',true); END IF;
  IF s.status<>'completed' THEN RAISE EXCEPTION 'Solo se editan ventas vigentes'; END IF;
  IF s.sale_mode<>'immediate' OR s.pending_amount>0 OR s.metadata->>'payment_type'='credit' THEN RAISE EXCEPTION 'Esta venta tiene anticipos o crédito: requiere su flujo de liquidación antes de modificarla'; END IF;
  IF s.requires_invoice THEN RAISE EXCEPTION 'La venta tiene factura fiscal; requiere su procedimiento de ajuste fiscal'; END IF;
  IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Especifica el motivo'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'part_id',part_id,'quantity',quantity,'unit_price',unit_price) ORDER BY id),'[]') INTO old_items FROM public.pos_sale_items WHERE sale_id=s.id;
  IF old_items IS DISTINCT FROM (SELECT jsonb_agg(x ORDER BY x->>'id') FROM jsonb_array_elements(p_expected_items) x) THEN RAISE EXCEPTION 'La venta cambió. Recarga antes de editar'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'La venta necesita al menos un producto; usa anulación para retirarlos todos'; END IF;
  FOR i IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    qty:=(i->>'quantity')::numeric; price:=(i->>'unit_price')::numeric;
    IF qty IS NULL OR price IS NULL OR qty<=0 OR price<0 OR qty::text IN ('NaN','Infinity','-Infinity') OR price::text IN ('NaN','Infinity','-Infinity') OR price<>round(price,2) OR qty<>round(qty,3) THEN RAISE EXCEPTION 'Cantidad o precio inválido'; END IF;
    SELECT * INTO p FROM public.parts WHERE id=(i->>'part_id')::uuid AND branch_id=s.branch_id AND is_active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto no disponible en esta sucursal'; END IF;
    new_total:=new_total+round(qty*price,2);
  END LOOP;
  delta:=new_total-s.total_amount;
  IF jsonb_typeof(p_payments) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Desglose de pago inválido'; END IF;
  FOR i IN SELECT value FROM jsonb_array_elements(p_payments) LOOP
    IF coalesce(i->>'method','') NOT IN ('cash','qr') OR coalesce((i->>'amount')::numeric,0)<=0 OR (i->>'amount')::numeric<>round((i->>'amount')::numeric,2) OR (i->>'amount') IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Pago inválido'; END IF;
    total_pay:=total_pay+(i->>'amount')::numeric;
  END LOOP;
  IF total_pay<>abs(delta) OR (delta<>0 AND p_confirmed IS DISTINCT FROM true) OR (SELECT count(*)<>count(DISTINCT x->>'method') FROM jsonb_array_elements(p_payments) x) THEN RAISE EXCEPTION 'Confirma el cobro/devolución y su desglose exacto'; END IF;
  session_id:=public.require_open_cash_session(s.branch_id);
  PERFORM 1 FROM public.cash_sessions WHERE id=session_id AND status='open' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'La caja se cerró; recarga antes de editar'; END IF;
  INSERT INTO public.pos_sale_edits VALUES(p_edit_id,s.id,s.branch_id,actor,now(),trim(p_reason),to_jsonb(s),old_items,p_items,delta,p_payments,p_confirmed);
  -- Reponer primero las cantidades anteriores permite reemplazos sin descuentos de stock duplicados.
  FOR old_line IN SELECT * FROM public.pos_sale_items WHERE sale_id=s.id ORDER BY part_id,id FOR UPDATE LOOP
    SELECT coalesce(sum(ri.quantity),0) INTO returned FROM public.pos_sale_return_items ri JOIN public.pos_sale_returns r ON r.id=ri.return_id WHERE ri.sale_item_id=old_line.id AND r.status='completed';
    IF returned>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x WHERE x->>'id'=old_line.id::text AND (x->>'part_id')::uuid=old_line.part_id AND (x->>'quantity')::numeric>=returned AND (x->>'unit_price')::numeric=old_line.unit_price) THEN RAISE EXCEPTION 'Conserva la cantidad y precio de unidades ya devueltas; modifica las unidades restantes en una línea nueva'; END IF;
    PERFORM public.apply_inventory_delta(old_line.part_id,s.branch_id,old_line.quantity-returned,'Edición de venta','devolucion_venta','pos_sale_edits',p_edit_id);
  END LOOP;
  FOR i IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    line_id:=nullif(i->>'id','')::uuid;
    IF line_id=ANY(kept) THEN RAISE EXCEPTION 'Línea duplicada'; END IF;
    SELECT * INTO old_line FROM public.pos_sale_items WHERE id=line_id AND sale_id=s.id;
    IF line_id IS NOT NULL AND NOT FOUND THEN RAISE EXCEPTION 'Línea fuera de esta venta'; END IF;
    qty:=(i->>'quantity')::numeric; price:=(i->>'unit_price')::numeric;
    SELECT * INTO p FROM public.parts WHERE id=(i->>'part_id')::uuid;
    returned:=0;
    IF line_id IS NOT NULL THEN
      SELECT coalesce(sum(ri.quantity),0) INTO returned FROM public.pos_sale_return_items ri JOIN public.pos_sale_returns r ON r.id=ri.return_id WHERE ri.sale_item_id=line_id AND r.status='completed';
      UPDATE public.pos_sale_items SET part_id=p.id,part_code=p.code,part_name=p.name,quantity=qty,unit_price=price,line_total=round(qty*price,2),line_discount=0,delivered_quantity=CASE WHEN old_line.delivery_status='delivered' THEN qty ELSE least(old_line.delivered_quantity,qty) END WHERE id=line_id;
    ELSE
      INSERT INTO public.pos_sale_items(sale_id,branch_id,part_id,part_code,part_name,quantity,unit_price,line_total,delivered_quantity,delivery_status,source_type,source_kit_id)
        VALUES(s.id,s.branch_id,p.id,p.code,p.name,qty,price,round(qty*price,2),qty,'delivered',coalesce(i->>'source_type','product'),i->>'source_kit_id') RETURNING id INTO line_id;
    END IF;
    kept:=array_append(kept,line_id);
    PERFORM public.apply_inventory_delta(p.id,s.branch_id,-(qty-returned),'Edición de venta','venta','pos_sale_edits',p_edit_id);
  END LOOP;
  DELETE FROM public.pos_sale_items WHERE sale_id=s.id AND NOT(id=ANY(kept));
  FOR i IN SELECT value FROM jsonb_array_elements(p_payments) LOOP
    INSERT INTO public.cash_movements(cash_session_id,branch_id,movement_type,amount,description,payment_method,reference_table,reference_id,created_by,updated_by,metadata)
      VALUES(session_id,s.branch_id,public.pos_sale_cash_movement_type(i->>'method',delta<0),(i->>'amount')::numeric,CASE WHEN delta<0 THEN 'Devolución por edición de venta' ELSE 'Cobro por edición de venta' END,i->>'method','pos_sale_edits',p_edit_id,actor,actor,jsonb_build_object('sale_id',s.id,'confirmed',p_confirmed));
  END LOOP;
  SELECT coalesce(sum(CASE WHEN m.movement_type LIKE 'sale_return_%' THEN -m.amount ELSE m.amount END) FILTER(WHERE m.payment_method='cash'),0),
    coalesce(sum(CASE WHEN m.movement_type LIKE 'sale_return_%' THEN -m.amount ELSE m.amount END) FILTER(WHERE m.payment_method='qr'),0)
    INTO net_cash,net_qr FROM public.cash_movements m WHERE (m.reference_table='pos_sales' AND m.reference_id=s.id) OR (m.reference_table='pos_sale_edits' AND m.reference_id IN(SELECT id FROM public.pos_sale_edits WHERE sale_id=s.id));
  payments:=jsonb_build_array(jsonb_build_object('method','cash','amount',net_cash),jsonb_build_object('method','qr','amount',net_qr));
  UPDATE public.pos_sales SET subtotal_amount=new_total,discount_amount=0,total_amount=new_total,advance_amount=new_total,metadata=metadata || jsonb_build_object('payment_type','adjusted','payments',payments,'last_edit_id',p_edit_id,'original_payment_type',coalesce(metadata->>'original_payment_type',metadata->>'payment_type',payment_method)) WHERE id=s.id;
  RETURN jsonb_build_object('sale_id',s.id,'total',new_total,'difference',delta);
END; $$;
REVOKE ALL ON FUNCTION public.pos_edit_sale(uuid,uuid,jsonb,jsonb,text,jsonb,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pos_edit_sale(uuid,uuid,jsonb,jsonb,text,jsonb,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.pos_report_payment_shares(p_sale public.pos_sales)
RETURNS TABLE(method text,amount numeric,share numeric) LANGUAGE sql STABLE SET search_path=public AS $$
  SELECT x->>'method',(x->>'amount')::numeric,(x->>'amount')::numeric/nullif(p_sale.total_amount,0)
  FROM jsonb_array_elements(CASE WHEN p_sale.metadata->>'payment_type'='adjusted' THEN p_sale.metadata->'payments' ELSE '[]'::jsonb END) x
  UNION ALL
  SELECT p.payment_method,p.amount,p.amount/nullif(p_sale.total_amount,0) FROM public.pos_sale_payments p WHERE p.sale_id=p_sale.id AND p_sale.metadata->>'payment_type' IS DISTINCT FROM 'adjusted'
  UNION ALL
  SELECT p_sale.payment_method,p_sale.total_amount,1::numeric WHERE p_sale.metadata->>'payment_type' IS DISTINCT FROM 'adjusted' AND NOT EXISTS(SELECT 1 FROM public.pos_sale_payments p WHERE p.sale_id=p_sale.id);
$$;
-- Repartir devoluciones posteriores según el saldo real por método tras editar.
CREATE OR REPLACE FUNCTION public.pos_split_adjusted_refund() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target_sale uuid; s public.pos_sales; cash_balance numeric; qr_balance numeric; cash_amount numeric; qr_amount numeric;
BEGIN
  IF NEW.movement_type NOT IN ('sale_return_cash','sale_return_qr') OR pg_trigger_depth()>1 THEN RETURN NEW; END IF;
  IF NEW.reference_table='pos_sales' THEN target_sale:=NEW.reference_id;
  ELSIF NEW.reference_table='pos_sale_returns' THEN SELECT r.sale_id INTO target_sale FROM public.pos_sale_returns r WHERE r.id=NEW.reference_id;
  ELSE RETURN NEW; END IF;
  SELECT * INTO s FROM public.pos_sales WHERE id=target_sale FOR UPDATE;
  IF NOT FOUND OR s.metadata->>'payment_type' IS DISTINCT FROM 'adjusted' THEN RETURN NEW; END IF;
  SELECT coalesce(sum(CASE WHEN m.movement_type LIKE 'sale_return_%' THEN -m.amount ELSE m.amount END) FILTER(WHERE m.payment_method='cash'),0),
    coalesce(sum(CASE WHEN m.movement_type LIKE 'sale_return_%' THEN -m.amount ELSE m.amount END) FILTER(WHERE m.payment_method='qr'),0)
    INTO cash_balance,qr_balance FROM public.cash_movements m WHERE
      (m.reference_table='pos_sales' AND m.reference_id=s.id) OR
      (m.reference_table='pos_sale_edits' AND m.reference_id IN(SELECT e.id FROM public.pos_sale_edits e WHERE e.sale_id=s.id)) OR
      (m.reference_table='pos_sale_returns' AND m.reference_id IN(SELECT r.id FROM public.pos_sale_returns r WHERE r.sale_id=s.id));
  IF NEW.amount>cash_balance+qr_balance THEN RAISE EXCEPTION 'La devolución supera el saldo cobrado'; END IF;
  cash_amount:=round(NEW.amount*greatest(cash_balance,0)/nullif(greatest(cash_balance,0)+greatest(qr_balance,0),0),2);
  qr_amount:=NEW.amount-cash_amount;
  IF cash_amount=0 THEN NEW.payment_method:='qr'; NEW.movement_type:='sale_return_qr'; RETURN NEW; END IF;
  NEW.amount:=cash_amount; NEW.payment_method:='cash'; NEW.movement_type:='sale_return_cash';
  IF qr_amount>0 THEN
    INSERT INTO public.cash_movements(cash_session_id,branch_id,movement_type,amount,description,payment_method,reference_table,reference_id,created_by,updated_by,metadata)
    VALUES(NEW.cash_session_id,NEW.branch_id,'sale_return_qr',qr_amount,NEW.description,'qr',NEW.reference_table,NEW.reference_id,NEW.created_by,NEW.updated_by,NEW.metadata);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS pos_adjusted_refund_split ON public.cash_movements;
CREATE TRIGGER pos_adjusted_refund_split BEFORE INSERT ON public.cash_movements FOR EACH ROW EXECUTE FUNCTION public.pos_split_adjusted_refund();
COMMIT;
