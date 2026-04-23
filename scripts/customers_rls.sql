-- Customers module: row-level security
-- Run after scripts/customers_tables.sql.

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customers_select_policy ON public.customers;
CREATE POLICY customers_select_policy
ON public.customers
FOR SELECT
TO authenticated
USING (
  (
    public.current_user_role_name() = 'admin'
  )
  OR (
    public.current_user_role_name() = ANY (ARRAY['manager'::text, 'employee'::text, 'read_only'::text])
    AND branch_id = public.current_user_branch_id()
  )
);

DROP POLICY IF EXISTS customers_insert_policy ON public.customers;
CREATE POLICY customers_insert_policy
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_user_role_name() = ANY (ARRAY['admin'::text, 'manager'::text, 'employee'::text, 'read_only'::text])
  AND (
    public.current_user_role_name() = 'admin'
    OR branch_id = public.current_user_branch_id()
  )
);

DROP POLICY IF EXISTS customers_update_policy ON public.customers;
CREATE POLICY customers_update_policy
ON public.customers
FOR UPDATE
TO authenticated
USING (
  public.current_user_role_name() = ANY (ARRAY['admin'::text, 'manager'::text, 'employee'::text])
  AND (
    public.current_user_role_name() = 'admin'
    OR branch_id = public.current_user_branch_id()
  )
)
WITH CHECK (
  public.current_user_role_name() = ANY (ARRAY['admin'::text, 'manager'::text, 'employee'::text])
  AND (
    public.current_user_role_name() = 'admin'
    OR branch_id = public.current_user_branch_id()
  )
);

DROP POLICY IF EXISTS customers_delete_policy ON public.customers;
CREATE POLICY customers_delete_policy
ON public.customers
FOR DELETE
TO authenticated
USING (
  public.current_user_role_name() = ANY (ARRAY['admin'::text, 'manager'::text])
  AND (
    public.current_user_role_name() = 'admin'
    OR branch_id = public.current_user_branch_id()
  )
);

DROP POLICY IF EXISTS customers_service_role_policy ON public.customers;
CREATE POLICY customers_service_role_policy
ON public.customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
