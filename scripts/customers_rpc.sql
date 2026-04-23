-- Customers module: helper and RPC functions
-- Run after scripts/customers_tables.sql and scripts/customers_rls.sql.

CREATE OR REPLACE FUNCTION public.customer_current_role_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(public.current_user_role_name(), '');
$function$;

CREATE OR REPLACE FUNCTION public.customer_can_create()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(public.customer_current_role_name() IN ('admin', 'manager', 'employee', 'read_only'), false);
$function$;

CREATE OR REPLACE FUNCTION public.customer_can_update()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(public.customer_current_role_name() IN ('admin', 'manager', 'employee'), false);
$function$;

CREATE OR REPLACE FUNCTION public.customer_can_delete()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT coalesce(public.customer_current_role_name() IN ('admin', 'manager'), false);
$function$;

CREATE OR REPLACE FUNCTION public.customer_resolve_branch(p_branch_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_user_branch uuid;
  v_result uuid;
BEGIN
  v_role := public.customer_current_role_name();
  v_user_branch := public.current_user_branch_id();

  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN
    RAISE EXCEPTION 'Role % cannot access customer branch scope', v_role;
  END IF;

  IF v_role = 'admin' THEN
    v_result := coalesce(p_branch_id, v_user_branch);
  ELSE
    IF v_user_branch IS NULL THEN
      RAISE EXCEPTION 'No branch associated with current user';
    END IF;

    IF p_branch_id IS NOT NULL AND p_branch_id <> v_user_branch THEN
      RAISE EXCEPTION 'Role % cannot operate branch %', v_role, p_branch_id;
    END IF;

    v_result := v_user_branch;
  END IF;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'No branch available for current operation';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.branches b
    WHERE b.id = v_result
  ) THEN
    RAISE EXCEPTION 'Branch % was not found', v_result;
  END IF;

  RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.customers_get_list(
  p_branch_id uuid DEFAULT NULL::uuid,
  p_search text DEFAULT NULL::text,
  p_include_inactive boolean DEFAULT false
)
RETURNS TABLE(
  id uuid,
  full_name text,
  nit_ci text,
  phone text,
  email text,
  branch_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_scope_branch uuid;
  v_search text;
BEGIN
  v_role := public.customer_current_role_name();

  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN
    RAISE EXCEPTION 'Role % cannot access customers', v_role;
  END IF;

  IF v_role = 'admin' AND p_branch_id IS NULL THEN
    v_scope_branch := NULL;
  ELSE
    v_scope_branch := public.customer_resolve_branch(p_branch_id);
  END IF;

  v_search := nullif(trim(coalesce(p_search, '')), '');

  RETURN QUERY
  SELECT
    c.id,
    c.full_name,
    c.nit_ci,
    c.phone,
    c.email,
    c.branch_id,
    c.is_active,
    c.created_at,
    c.updated_at
  FROM public.customers c
  WHERE (
      v_scope_branch IS NULL
      OR c.branch_id = v_scope_branch
    )
    AND (
      p_include_inactive = true
      OR c.is_active = true
    )
    AND (
      v_search IS NULL
      OR lower(c.full_name) LIKE '%' || lower(v_search) || '%'
      OR lower(c.nit_ci) LIKE '%' || lower(v_search) || '%'
      OR lower(coalesce(c.phone, '')) LIKE '%' || lower(v_search) || '%'
      OR lower(coalesce(c.email, '')) LIKE '%' || lower(v_search) || '%'
    )
  ORDER BY c.full_name ASC, c.id ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.customer_get_for_sales(
  p_branch_id uuid DEFAULT NULL::uuid,
  p_search text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  full_name text,
  nit_ci text,
  phone text,
  email text,
  branch_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    c.full_name,
    c.nit_ci,
    c.phone,
    c.email,
    c.branch_id,
    c.created_at,
    c.updated_at
  FROM public.customers_get_list(p_branch_id, p_search, false) c
  WHERE c.is_active = true
  ORDER BY c.full_name ASC, c.id ASC;
$function$;

CREATE OR REPLACE FUNCTION public.customers_create(
  p_branch_id uuid DEFAULT NULL::uuid,
  p_full_name text DEFAULT NULL::text,
  p_nit_ci text DEFAULT NULL::text,
  p_phone text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  full_name text,
  nit_ci text,
  phone text,
  email text,
  branch_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text;
  v_nit_ci text;
  v_branch_id uuid;
  v_actor uuid;
BEGIN
  IF NOT public.customer_can_create() THEN
    RAISE EXCEPTION 'Role % cannot create customers', public.customer_current_role_name();
  END IF;

  v_full_name := trim(coalesce(p_full_name, ''));
  v_nit_ci := trim(coalesce(p_nit_ci, ''));

  IF v_full_name = '' THEN
    RAISE EXCEPTION 'Customer full_name is required';
  END IF;

  IF v_nit_ci = '' THEN
    RAISE EXCEPTION 'Customer nit_ci is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE lower(trim(c.nit_ci)) = lower(v_nit_ci)
  ) THEN
    RAISE EXCEPTION 'A customer already exists with this NIT/CI';
  END IF;

  v_branch_id := public.customer_resolve_branch(p_branch_id);
  v_actor := public.current_request_user_id();

  RETURN QUERY
  INSERT INTO public.customers (
    full_name,
    nit_ci,
    phone,
    email,
    branch_id,
    is_active,
    metadata,
    created_by,
    updated_by,
    created_at,
    updated_at
  )
  VALUES (
    v_full_name,
    v_nit_ci,
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_email, '')), ''),
    v_branch_id,
    true,
    '{}'::jsonb,
    v_actor,
    v_actor,
    now(),
    now()
  )
  RETURNING
    customers.id,
    customers.full_name,
    customers.nit_ci,
    customers.phone,
    customers.email,
    customers.branch_id,
    customers.is_active,
    customers.created_at,
    customers.updated_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.customers_create_quick(
  p_branch_id uuid DEFAULT NULL::uuid,
  p_full_name text DEFAULT NULL::text,
  p_nit_ci text DEFAULT NULL::text,
  p_phone text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text
)
RETURNS TABLE(
  id uuid,
  full_name text,
  nit_ci text,
  phone text,
  email text,
  branch_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    c.full_name,
    c.nit_ci,
    c.phone,
    c.email,
    c.branch_id,
    c.created_at,
    c.updated_at
  FROM public.customers_create(p_branch_id, p_full_name, p_nit_ci, p_phone, p_email) c;
$function$;

CREATE OR REPLACE FUNCTION public.customers_update(
  p_customer_id uuid,
  p_full_name text,
  p_nit_ci text,
  p_phone text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text,
  p_is_active boolean DEFAULT NULL::boolean
)
RETURNS TABLE(
  id uuid,
  full_name text,
  nit_ci text,
  phone text,
  email text,
  branch_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer public.customers%rowtype;
  v_full_name text;
  v_nit_ci text;
  v_actor uuid;
BEGIN
  IF NOT public.customer_can_update() THEN
    RAISE EXCEPTION 'Role % cannot update customers', public.customer_current_role_name();
  END IF;

  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer id is required';
  END IF;

  v_full_name := trim(coalesce(p_full_name, ''));
  v_nit_ci := trim(coalesce(p_nit_ci, ''));

  IF v_full_name = '' THEN
    RAISE EXCEPTION 'Customer full_name is required';
  END IF;

  IF v_nit_ci = '' THEN
    RAISE EXCEPTION 'Customer nit_ci is required';
  END IF;

  SELECT *
  INTO v_customer
  FROM public.customers c
  WHERE c.id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF public.customer_current_role_name() <> 'admin' AND v_customer.branch_id <> public.current_user_branch_id() THEN
    RAISE EXCEPTION 'Cannot update customer from another branch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id <> p_customer_id
      AND lower(trim(c.nit_ci)) = lower(v_nit_ci)
  ) THEN
    RAISE EXCEPTION 'A customer already exists with this NIT/CI';
  END IF;

  v_actor := public.current_request_user_id();

  RETURN QUERY
  UPDATE public.customers c
  SET
    full_name = v_full_name,
    nit_ci = v_nit_ci,
    phone = nullif(trim(coalesce(p_phone, '')), ''),
    email = nullif(trim(coalesce(p_email, '')), ''),
    is_active = coalesce(p_is_active, c.is_active),
    updated_by = v_actor,
    updated_at = now()
  WHERE c.id = p_customer_id
  RETURNING
    c.id,
    c.full_name,
    c.nit_ci,
    c.phone,
    c.email,
    c.branch_id,
    c.is_active,
    c.created_at,
    c.updated_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.customers_delete(
  p_customer_id uuid,
  p_soft_delete boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer public.customers%rowtype;
BEGIN
  IF NOT public.customer_can_delete() THEN
    RAISE EXCEPTION 'Role % cannot delete customers', public.customer_current_role_name();
  END IF;

  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer id is required';
  END IF;

  SELECT *
  INTO v_customer
  FROM public.customers c
  WHERE c.id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF public.customer_current_role_name() <> 'admin' AND v_customer.branch_id <> public.current_user_branch_id() THEN
    RAISE EXCEPTION 'Cannot delete customer from another branch';
  END IF;

  IF p_soft_delete THEN
    UPDATE public.customers c
    SET
      is_active = false,
      updated_by = public.current_request_user_id(),
      updated_at = now()
    WHERE c.id = p_customer_id;
  ELSE
    DELETE FROM public.customers c
    WHERE c.id = p_customer_id;
  END IF;

  RETURN p_customer_id;
END;
$function$;
