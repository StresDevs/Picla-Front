-- Quotations history schema and logging
-- Run this script after scripts/quotations.sql.

CREATE TABLE IF NOT EXISTS public.quotation_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  quotation_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  event_type text NOT NULL,
  actor_user_id uuid NULL,
  payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  notes text NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT quotation_history_pkey PRIMARY KEY (id),
  CONSTRAINT quotation_history_event_type_check CHECK (
    event_type = ANY (ARRAY['created'::text, 'cancelled'::text, 'converted'::text, 'expired'::text, 'updated'::text])
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotation_history_quotation_id_fkey'
  ) THEN
    ALTER TABLE public.quotation_history
      ADD CONSTRAINT quotation_history_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotation_history_branch_id_fkey'
  ) THEN
    ALTER TABLE public.quotation_history
      ADD CONSTRAINT quotation_history_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'quotation_history_actor_user_id_fkey'
  ) THEN
    ALTER TABLE public.quotation_history
      ADD CONSTRAINT quotation_history_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quotation_history_quotation_created_at
  ON public.quotation_history USING btree (quotation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotation_history_branch_created_at
  ON public.quotation_history USING btree (branch_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_audit_quotation_history ON public.quotation_history;
CREATE TRIGGER trg_audit_quotation_history
AFTER INSERT OR DELETE OR UPDATE ON public.quotation_history
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

ALTER TABLE public.quotation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotation_history_select_policy ON public.quotation_history;
CREATE POLICY quotation_history_select_policy
ON public.quotation_history
FOR SELECT
TO authenticated
USING (
  (public.current_user_role_name() = 'admin')
  OR (
    public.current_user_role_name() = ANY (ARRAY['manager'::text, 'employee'::text, 'read_only'::text])
    AND branch_id = public.current_user_branch_id()
  )
);

DROP POLICY IF EXISTS quotation_history_service_role_policy ON public.quotation_history;
CREATE POLICY quotation_history_service_role_policy
ON public.quotation_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

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
DECLARE
  v_event_type text;
BEGIN
  IF p_quotation_id IS NULL OR p_branch_id IS NULL THEN
    RETURN;
  END IF;

  v_event_type := lower(trim(coalesce(p_event_type, '')));

  IF v_event_type NOT IN ('created', 'cancelled', 'converted', 'expired', 'updated') THEN
    v_event_type := 'updated';
  END IF;

  INSERT INTO public.quotation_history (
    quotation_id,
    branch_id,
    event_type,
    actor_user_id,
    payload,
    notes,
    created_at
  )
  VALUES (
    p_quotation_id,
    p_branch_id,
    v_event_type,
    p_actor_user_id,
    coalesce(p_payload, '{}'::jsonb),
    nullif(trim(coalesce(p_notes, '')), ''),
    now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.quotation_get_history(
  p_quotation_id uuid DEFAULT NULL::uuid,
  p_branch_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid,
  quotation_id uuid,
  branch_id uuid,
  event_type text,
  actor_user_id uuid,
  actor_name text,
  payload jsonb,
  notes text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_scope_branch uuid;
BEGIN
  v_role := public.current_user_role_name();
  IF v_role NOT IN ('admin', 'manager', 'employee', 'read_only') THEN
    RAISE EXCEPTION 'Role % cannot access quotation history', v_role;
  END IF;

  IF v_role = 'admin' AND p_branch_id IS NULL THEN
    v_scope_branch := NULL;
  ELSE
    v_scope_branch := public.pos_resolve_branch(p_branch_id);
  END IF;

  RETURN QUERY
  SELECT
    h.id,
    h.quotation_id,
    h.branch_id,
    h.event_type,
    h.actor_user_id,
    u.full_name,
    h.payload,
    h.notes,
    h.created_at
  FROM public.quotation_history h
  LEFT JOIN public.users u ON u.id = h.actor_user_id
  WHERE (
      p_quotation_id IS NULL
      OR h.quotation_id = p_quotation_id
    )
    AND (
      v_scope_branch IS NULL
      OR h.branch_id = v_scope_branch
    )
  ORDER BY h.created_at DESC, h.id DESC;
END;
$function$;