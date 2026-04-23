-- Customers module: tables and indexes
-- Run first.

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  branch_id uuid NOT NULL,
  full_name text NOT NULL,
  nit_ci text NOT NULL,
  phone text NULL,
  email text NULL,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_full_name_required CHECK (length(trim(full_name)) > 0),
  CONSTRAINT customers_nit_ci_required CHECK (length(trim(nit_ci)) > 0)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_branch_id_fkey'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_created_by_fkey'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customers_updated_by_fkey'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_branch_name
  ON public.customers USING btree (branch_id, full_name);

CREATE INDEX IF NOT EXISTS idx_customers_created_at
  ON public.customers USING btree (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_unique_nit_ci_normalized
  ON public.customers USING btree (lower(trim(nit_ci)));

CREATE INDEX IF NOT EXISTS idx_customers_email_normalized
  ON public.customers USING btree (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

DROP TRIGGER IF EXISTS trg_customers_set_updated_at ON public.customers;
CREATE TRIGGER trg_customers_set_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_audit_customers ON public.customers;
CREATE TRIGGER trg_audit_customers
AFTER INSERT OR DELETE OR UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
