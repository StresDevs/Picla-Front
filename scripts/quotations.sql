-- Quotations core schema, RLS and RPC functions
-- Run this script first.

-- 1) Tables
CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  quoted_by uuid NULL,
  status text DEFAULT 'active'::text NOT NULL,
  expires_at timestamptz NOT NULL,
  subtotal_amount numeric(12,2) DEFAULT 0 NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
  total_amount numeric(12,2) DEFAULT 0 NOT NULL,
  notes text NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  converted_sale_id uuid NULL,
  cancelled_by uuid NULL,
  cancelled_at timestamptz NULL,
  converted_by uuid NULL,
  converted_at timestamptz NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT quotations_pkey PRIMARY KEY (id),
  CONSTRAINT quotations_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'cancelled'::text, 'converted'::text])
  ),
  CONSTRAINT quotations_subtotal_amount_check CHECK (subtotal_amount >= (0)::numeric),
  CONSTRAINT quotations_discount_amount_check CHECK (discount_amount >= (0)::numeric),
  CONSTRAINT quotations_total_amount_check CHECK (total_amount >= (0)::numeric)
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quotation_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  part_id uuid NOT NULL,
  part_code text NOT NULL,
  part_name text NOT NULL,
  quantity numeric(12,3) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  line_total numeric(12,2) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT quotation_items_pkey PRIMARY KEY (id),
  CONSTRAINT quotation_items_quantity_check CHECK (quantity > (0)::numeric),
  CONSTRAINT quotation_items_unit_price_check CHECK (unit_price >= (0)::numeric),
  CONSTRAINT quotation_items_line_total_check CHECK (line_total >= (0)::numeric)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotations_branch_id_fkey'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotations_customer_id_fkey'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotations_quoted_by_fkey'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_quoted_by_fkey FOREIGN KEY (quoted_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotations_converted_sale_id_fkey'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_converted_sale_id_fkey FOREIGN KEY (converted_sale_id) REFERENCES public.pos_sales(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotations_cancelled_by_fkey'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotations_converted_by_fkey'
  ) THEN
    ALTER TABLE public.quotations
      ADD CONSTRAINT quotations_converted_by_fkey FOREIGN KEY (converted_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotation_items_quotation_id_fkey'
  ) THEN
    ALTER TABLE public.quotation_items
      ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotation_items_branch_id_fkey'
  ) THEN
    ALTER TABLE public.quotation_items
      ADD CONSTRAINT quotation_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotation_items_part_id_fkey'
  ) THEN
    ALTER TABLE public.quotation_items
      ADD CONSTRAINT quotation_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quotations_branch_created_at ON public.quotations USING btree (branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_status_expires_at ON public.quotations USING btree (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON public.quotations USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items USING btree (quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_part_id ON public.quotation_items USING btree (part_id);

-- 2) Triggers
DROP TRIGGER IF EXISTS trg_quotations_set_updated_at ON public.quotations;
CREATE TRIGGER trg_quotations_set_updated_at
BEFORE UPDATE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_quotation_items_set_updated_at ON public.quotation_items;
CREATE TRIGGER trg_quotation_items_set_updated_at
BEFORE UPDATE ON public.quotation_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_audit_quotations ON public.quotations;
CREATE TRIGGER trg_audit_quotations
AFTER INSERT OR DELETE OR UPDATE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_quotation_items ON public.quotation_items;
CREATE TRIGGER trg_audit_quotation_items
AFTER INSERT OR DELETE OR UPDATE ON public.quotation_items
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 3) RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotations_select_policy ON public.quotations;
CREATE POLICY quotations_select_policy
ON public.quotations
FOR SELECT
TO authenticated
USING (
  (public.current_user_role_name() = 'admin')
  OR (
    public.current_user_role_name() = ANY (ARRAY['manager'::text, 'employee'::text, 'read_only'::text])
    AND branch_id = public.current_user_branch_id()
  )
);

DROP POLICY IF EXISTS quotations_service_role_policy ON public.quotations;
CREATE POLICY quotations_service_role_policy
ON public.quotations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS quotation_items_select_policy ON public.quotation_items;
CREATE POLICY quotation_items_select_policy
ON public.quotation_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quotations q
    WHERE q.id = quotation_items.quotation_id
      AND (
        public.current_user_role_name() = 'admin'
        OR (
          public.current_user_role_name() = ANY (ARRAY['manager'::text, 'employee'::text, 'read_only'::text])
          AND q.branch_id = public.current_user_branch_id()
        )
      )
  )
);

DROP POLICY IF EXISTS quotation_items_service_role_policy ON public.quotation_items;
CREATE POLICY quotation_items_service_role_policy
ON public.quotation_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4) Role helpers
CREATE OR REPLACE FUNCTION public.quotation_current_role_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(public.current_user_role_name(), '');
$function$;

CREATE OR REPLACE FUNCTION public.quotation_can_create()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(public.quotation_current_role_name() IN ('admin', 'manager', 'employee', 'read_only'), false);
$function$;

CREATE OR REPLACE FUNCTION public.quotation_can_convert()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(public.quotation_current_role_name() IN ('admin', 'manager'), false);
$function$;

-- 5) Log stub (replaced by quotations_history.sql)
CREATE OR REPLACE FUNCTION public.quotation_log_event(
  p_quotation_id uuid,
  p_branch_id uuid,
  p_event_type text,
  p_actor_user_id uuid,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- no-op stub; quotations_history.sql replaces this implementation.
  RETURN;
END;
$function$;

-- 6) Quotations RPC
CREATE OR REPLACE FUNCTION public.quotation_create(
  p_branch_id uuid,
  p_customer_id uuid,
  p_expires_at date,
  p_items jsonb,
  p_notes text DEFAULT NULL::text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_branch_id uuid;
  v_quote_id uuid;
  v_customer public.customers%rowtype;
  v_item jsonb;
  v_part public.parts%rowtype;
  v_part_id uuid;
  v_qty numeric(12,3);
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_total numeric(12,2) := 0;
  v_min_quote numeric(12,2);
  v_max_quote numeric(12,2);
  v_expires_at timestamptz;
  v_actor uuid;
BEGIN
  v_role := public.quotation_current_role_name();
  IF NOT public.quotation_can_create() THEN
    RAISE EXCEPTION 'Role % cannot create quotations', v_role;
  END IF;

  v_actor := public.current_request_user_id();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'No active authenticated session';
  END IF;

  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer is required';
  END IF;

  IF p_expires_at IS NULL THEN
    RAISE EXCEPTION 'Quotation expiration date is required';
  END IF;

  IF p_expires_at < current_date THEN
    RAISE EXCEPTION 'Quotation expiration date must be today or in the future';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one quotation item is required';
  END IF;

  v_branch_id := public.pos_resolve_branch(p_branch_id);
  v_expires_at := (p_expires_at::timestamp + interval '23 hours 59 minutes 59 seconds')::timestamptz;

  SELECT *
  INTO v_customer
  FROM public.customers c
  WHERE c.id = p_customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF coalesce(v_customer.branch_id, v_branch_id) <> v_branch_id AND v_role <> 'admin' THEN
    RAISE EXCEPTION 'Customer does not belong to active branch';
  END IF;

  INSERT INTO public.quotations (
    branch_id,
    customer_id,
    quoted_by,
    status,
    expires_at,
    subtotal_amount,
    discount_amount,
    total_amount,
    notes,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    v_branch_id,
    v_customer.id,
    v_actor,
    'active',
    v_expires_at,
    0,
    0,
    0,
    nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    now()
  )
  RETURNING id INTO v_quote_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_part_id := nullif(trim(coalesce(v_item->>'part_id', '')), '')::uuid;
    v_qty := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, 0);

    IF v_part_id IS NULL THEN
      RAISE EXCEPTION 'Each quotation item must include part_id';
    END IF;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero for part %', v_part_id;
    END IF;

    IF v_unit_price <= 0 THEN
      RAISE EXCEPTION 'Unit price must be greater than zero for part %', v_part_id;
    END IF;

    SELECT *
    INTO v_part
    FROM public.parts p
    WHERE p.id = v_part_id
      AND p.branch_id = v_branch_id
      AND coalesce(p.is_active, true) = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Part % not found in branch %', v_part_id, v_branch_id;
    END IF;

    v_min_quote := coalesce(v_part.quotation_min_price, round((v_part.price * 0.90)::numeric, 2));
    v_max_quote := coalesce(v_part.quotation_max_price, round((v_part.price * 1.20)::numeric, 2));

    IF v_unit_price < v_min_quote OR v_unit_price > v_max_quote THEN
      RAISE EXCEPTION
        'Price for part % must be between % and %',
        v_part.code,
        v_min_quote,
        v_max_quote;
    END IF;

    v_line_total := round((v_qty * v_unit_price)::numeric, 2);
    v_total := v_total + v_line_total;

    INSERT INTO public.quotation_items (
      quotation_id,
      branch_id,
      part_id,
      part_code,
      part_name,
      quantity,
      unit_price,
      line_total,
      metadata,
      created_at,
      updated_at
    )
    VALUES (
      v_quote_id,
      v_branch_id,
      v_part.id,
      v_part.code,
      v_part.name,
      v_qty,
      v_unit_price,
      v_line_total,
      coalesce(v_item->'metadata', '{}'::jsonb),
      now(),
      now()
    );
  END LOOP;

  UPDATE public.quotations q
  SET
    subtotal_amount = v_total,
    discount_amount = 0,
    total_amount = v_total,
    updated_at = now()
  WHERE q.id = v_quote_id;

  PERFORM public.quotation_log_event(
    v_quote_id,
    v_branch_id,
    'created',
    v_actor,
    jsonb_build_object('total_amount', v_total),
    p_notes
  );

  RETURN v_quote_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.quotation_get_list(
  p_branch_id uuid DEFAULT NULL::uuid,
  p_status text DEFAULT NULL::text
)
RETURNS TABLE(
  quotation_id uuid,
  branch_id uuid,
  branch_name text,
  customer_id uuid,
  customer_name text,
  customer_nit_ci text,
  quoted_by uuid,
  quoted_by_name text,
  status text,
  expires_at timestamptz,
  subtotal_amount numeric,
  discount_amount numeric,
  total_amount numeric,
  converted_sale_id uuid,
  notes text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  items jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_scope_branch uuid;
  v_status text;
BEGIN
  v_role := public.quotation_current_role_name();
  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN
    RAISE EXCEPTION 'Role % cannot access quotations', v_role;
  END IF;

  IF v_role = 'admin' AND p_branch_id IS NULL THEN
    v_scope_branch := NULL;
  ELSE
    v_scope_branch := public.pos_resolve_branch(p_branch_id);
  END IF;

  v_status := lower(trim(coalesce(p_status, '')));

  RETURN QUERY
  SELECT
    q.id,
    q.branch_id,
    b.name,
    q.customer_id,
    c.full_name,
    c.nit_ci,
    q.quoted_by,
    u.full_name,
    q.status,
    q.expires_at,
    q.subtotal_amount,
    q.discount_amount,
    q.total_amount,
    q.converted_sale_id,
    q.notes,
    q.metadata,
    q.created_at,
    q.updated_at,
    coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', qi.id,
          'part_id', qi.part_id,
          'part_code', qi.part_code,
          'part_name', qi.part_name,
          'quantity', qi.quantity,
          'unit_price', qi.unit_price,
          'line_total', qi.line_total,
          'metadata', qi.metadata
        )
        ORDER BY qi.created_at ASC
      )
      FROM public.quotation_items qi
      WHERE qi.quotation_id = q.id
    ), '[]'::jsonb)
  FROM public.quotations q
  JOIN public.branches b ON b.id = q.branch_id
  JOIN public.customers c ON c.id = q.customer_id
  LEFT JOIN public.users u ON u.id = q.quoted_by
  WHERE (
      v_scope_branch IS NULL
      OR q.branch_id = v_scope_branch
    )
    AND (
      v_status = ''
      OR q.status = v_status
      OR (
        v_status = 'expired'
        AND q.status = 'active'
        AND q.expires_at < now()
      )
    )
  ORDER BY q.created_at DESC, q.id DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.quotation_cancel(
  p_quotation_id uuid,
  p_reason text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_quote public.quotations%rowtype;
  v_actor uuid;
BEGIN
  v_role := public.quotation_current_role_name();
  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN
    RAISE EXCEPTION 'Role % cannot cancel quotations', v_role;
  END IF;

  v_actor := public.current_request_user_id();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'No active authenticated session';
  END IF;

  SELECT *
  INTO v_quote
  FROM public.quotations q
  WHERE q.id = p_quotation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;

  IF v_role <> 'admin' AND v_quote.branch_id <> public.current_user_branch_id() THEN
    RAISE EXCEPTION 'Cannot cancel quotation from another branch';
  END IF;

  IF v_quote.status <> 'active' THEN
    RAISE EXCEPTION 'Only active quotations can be cancelled';
  END IF;

  IF v_quote.expires_at < now() THEN
    RAISE EXCEPTION 'Expired quotation cannot be cancelled';
  END IF;

  UPDATE public.quotations
  SET
    status = 'cancelled',
    cancelled_by = v_actor,
    cancelled_at = now(),
    updated_at = now()
  WHERE id = v_quote.id;

  PERFORM public.quotation_log_event(
    v_quote.id,
    v_quote.branch_id,
    'cancelled',
    v_actor,
    jsonb_build_object('reason', nullif(trim(coalesce(p_reason, '')), '')),
    p_reason
  );

  RETURN v_quote.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.quotation_convert_to_sale(
  p_quotation_id uuid,
  p_payment_method text,
  p_payment_currency text DEFAULT 'BOB'::text,
  p_exchange_rate numeric DEFAULT 1,
  p_sale_mode text DEFAULT 'immediate'::text,
  p_advance_amount numeric DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  quotation_id uuid,
  sale_id uuid,
  total_amount_bob numeric,
  total_amount_usd numeric,
  cash_movement_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_actor uuid;
  v_quote public.quotations%rowtype;
  v_customer public.customers%rowtype;
  v_items jsonb;
  v_sale record;
BEGIN
  v_role := public.quotation_current_role_name();
  IF NOT public.quotation_can_convert() THEN
    RAISE EXCEPTION 'Role % cannot convert quotations', v_role;
  END IF;

  v_actor := public.current_request_user_id();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'No active authenticated session';
  END IF;

  SELECT *
  INTO v_quote
  FROM public.quotations q
  WHERE q.id = p_quotation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quotation not found';
  END IF;

  IF v_role <> 'admin' AND v_quote.branch_id <> public.current_user_branch_id() THEN
    RAISE EXCEPTION 'Cannot convert quotation from another branch';
  END IF;

  IF v_quote.status <> 'active' THEN
    RAISE EXCEPTION 'Only active quotations can be converted';
  END IF;

  IF v_quote.expires_at < now() THEN
    RAISE EXCEPTION 'Expired quotation cannot be converted';
  END IF;

  SELECT *
  INTO v_customer
  FROM public.customers c
  WHERE c.id = v_quote.customer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer linked to quotation was not found';
  END IF;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'part_id', qi.part_id,
        'quantity', qi.quantity,
        'unit_price', qi.unit_price,
        'source_type', 'product',
        'source_kit_id', null
      )
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM public.quotation_items qi
  WHERE qi.quotation_id = v_quote.id;

  IF jsonb_typeof(v_items) <> 'array' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Quotation has no items to convert';
  END IF;

  SELECT *
  INTO v_sale
  FROM public.pos_create_sale(
    v_quote.branch_id,
    v_customer.full_name,
    p_payment_method,
    p_payment_currency,
    p_exchange_rate,
    p_sale_mode,
    p_advance_amount,
    v_items,
    coalesce(p_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'source_module', 'quotations/history',
        'quotation_id', v_quote.id,
        'customer_id', v_customer.id,
        'customer_name', v_customer.full_name,
        'customer_nit_ci', v_customer.nit_ci,
        'customer_is_anonymous', false
      )
  );

  UPDATE public.quotations
  SET
    status = 'converted',
    converted_sale_id = v_sale.sale_id,
    converted_by = v_actor,
    converted_at = now(),
    updated_at = now()
  WHERE id = v_quote.id;

  PERFORM public.quotation_log_event(
    v_quote.id,
    v_quote.branch_id,
    'converted',
    v_actor,
    jsonb_build_object(
      'sale_id', v_sale.sale_id,
      'payment_method', lower(trim(coalesce(p_payment_method, ''))),
      'payment_currency', upper(trim(coalesce(p_payment_currency, 'BOB')))
    ),
    null
  );

  RETURN QUERY
  SELECT
    v_quote.id,
    v_sale.sale_id,
    v_sale.total_amount_bob,
    v_sale.total_amount_usd,
    v_sale.cash_movement_id;
END;
$function$;