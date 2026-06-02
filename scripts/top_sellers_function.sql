-- ============================================================
-- pos_get_top_sellers
-- Returns the top sellers ranked by number of completed sales.
-- Admins can query across all branches (p_branch_id = NULL).
-- Managers are scoped to their resolved branch.
-- ============================================================
CREATE OR REPLACE FUNCTION public.pos_get_top_sellers(
  p_branch_id  uuid    DEFAULT NULL,
  p_limit      integer DEFAULT 10,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date   timestamptz DEFAULT NULL
)
RETURNS TABLE(
  seller_id   uuid,
  seller_name text,
  branch_id   uuid,
  branch_name text,
  sales_count bigint,
  total_amount numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role      text;
  v_branch_id uuid;
BEGIN
  v_role := public.pos_current_role_name();

  IF v_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Role % cannot access the top sellers report', v_role;
  END IF;

  -- For admin with no explicit branch: NULL means all branches.
  -- For manager: always resolve to their own branch.
  IF v_role = 'admin' THEN
    v_branch_id := p_branch_id;
  ELSE
    v_branch_id := public.pos_resolve_branch(NULL);
  END IF;

  RETURN QUERY
  SELECT
    s.sold_by                                                 AS seller_id,
    COALESCE(u.full_name, 'Desconocido')                     AS seller_name,
    s.branch_id                                              AS branch_id,
    COALESCE(b.name, 'Sucursal desconocida')                 AS branch_name,
    COUNT(*)::bigint                                          AS sales_count,
    SUM(s.total_amount)                                       AS total_amount
  FROM public.pos_sales s
  LEFT JOIN public.users    u ON u.id = s.sold_by
  LEFT JOIN public.branches b ON b.id = s.branch_id
  WHERE s.status = 'completed'
    AND s.sold_by IS NOT NULL
    AND (v_branch_id IS NULL OR s.branch_id = v_branch_id)
    AND (p_start_date IS NULL OR s.created_at >= p_start_date)
    AND (p_end_date   IS NULL OR s.created_at <= p_end_date)
  GROUP BY s.sold_by, u.full_name, s.branch_id, b.name
  ORDER BY sales_count DESC, total_amount DESC
  LIMIT COALESCE(p_limit, 10);
END;
$$;
