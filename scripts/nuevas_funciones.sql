-- ============================================================
-- PICLA - NUEVAS FUNCIONES RPC
-- Ejecutar en Supabase SQL Editor como superuser/service_role
-- ============================================================

-- ============================================================
-- SECCIÓN 1: SOPORTE DE PAGO "credit" EN POS
-- ============================================================

-- 1.1 Agregar 'credit' al CHECK constraint de pos_sales.payment_method
-- Primero eliminar el constraint actual y recrearlo con 'credit'
DO $$
BEGIN
  -- pos_sales: agregar 'credit' al check de payment_method
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pos_sales_payment_method_check'
      AND conrelid = 'pos_sales'::regclass
      AND pg_get_constraintdef(oid) ILIKE '%credit%'
  ) THEN
    ALTER TABLE pos_sales DROP CONSTRAINT IF EXISTS pos_sales_payment_method_check;
    ALTER TABLE pos_sales ADD CONSTRAINT pos_sales_payment_method_check
      CHECK (payment_method = ANY (ARRAY['cash','card','qr','credit']));
    RAISE NOTICE 'pos_sales: payment_method CHECK actualizado con credit';
  ELSE
    RAISE NOTICE 'pos_sales: credit ya está en el CHECK constraint';
  END IF;
END $$;

-- 1.2 Agregar 'sale_credit_advance' al CHECK constraint de cash_movements.movement_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cash_movements_type_check'
      AND conrelid = 'cash_movements'::regclass
      AND pg_get_constraintdef(oid) ILIKE '%sale_credit_advance%'
  ) THEN
    ALTER TABLE cash_movements DROP CONSTRAINT IF EXISTS cash_movements_type_check;
    ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_type_check
      CHECK (movement_type = ANY (ARRAY[
        'manual_income','manual_expense',
        'sale_cash','sale_return_cash',
        'sale_card','sale_return_card',
        'sale_qr','sale_return_qr',
        'sale_credit_advance'
      ]));
    RAISE NOTICE 'cash_movements: movement_type CHECK actualizado con sale_credit_advance';
  ELSE
    RAISE NOTICE 'cash_movements: sale_credit_advance ya está en el CHECK constraint';
  END IF;
END $$;

-- NOTA: La función pos_create_sale debe actualizar su lógica interna para:
--   - Si payment_method = 'credit': NO crear movimiento sale_cash para el total
--   - Si advance_amount > 0: Crear movimiento sale_credit_advance por advance_amount
--   - Guardar la venta con payment_method = 'credit' en pos_sales

-- ============================================================
-- SECCIÓN 2: DASHBOARD - RESUMEN GENERAL
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_summary(
  p_branch_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
  v_today date := CURRENT_DATE;
  v_week_start date := CURRENT_DATE - INTERVAL '6 days';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No active authenticated session';
  END IF;

  SELECT jsonb_build_object(
    -- KPIs de ventas
    'sales_today', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM pos_sales
      WHERE status = 'completed'
        AND created_at::date = v_today
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ),
    'sales_today_count', (
      SELECT COUNT(*)
      FROM pos_sales
      WHERE status = 'completed'
        AND created_at::date = v_today
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ),
    'sales_week', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM pos_sales
      WHERE status = 'completed'
        AND created_at::date >= v_week_start
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ),
    -- Créditos activos
    'credits_active_count', (
      SELECT COUNT(*)
      FROM credits
      WHERE status IN ('active', 'overdue')
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ),
    'credits_active_balance', (
      SELECT COALESCE(SUM(balance), 0)
      FROM credits
      WHERE status IN ('active', 'overdue')
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ),
    'credits_overdue_count', (
      SELECT COUNT(*)
      FROM credits
      WHERE status = 'overdue'
        AND (p_branch_id IS NULL OR branch_id = p_branch_id)
    ),
    -- Inventario crítico (quantity <= min_quantity)
    'low_stock_count', (
      SELECT COUNT(*)
      FROM inventory i
      WHERE i.quantity <= i.min_quantity
        AND i.quantity > 0
        AND (p_branch_id IS NULL OR i.branch_id = p_branch_id)
    ),
    'zero_stock_count', (
      SELECT COUNT(*)
      FROM inventory i
      WHERE i.quantity = 0
        AND (p_branch_id IS NULL OR i.branch_id = p_branch_id)
    ),
    -- Ventas últimos 7 días por día
    'sales_last_7_days', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', day_series::date, 'total', COALESCE(day_total, 0), 'count', COALESCE(day_count, 0))
        ORDER BY day_series
      ), '[]'::jsonb)
      FROM generate_series(v_week_start::timestamp, v_today::timestamp, '1 day'::interval) AS day_series
      LEFT JOIN (
        SELECT created_at::date AS sale_date,
               SUM(total_amount) AS day_total,
               COUNT(*) AS day_count
        FROM pos_sales
        WHERE status = 'completed'
          AND created_at::date >= v_week_start
          AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        GROUP BY created_at::date
      ) sub ON sub.sale_date = day_series::date
    ),
    -- Ventas por método de pago (semana)
    'sales_by_method', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('method', payment_method, 'total', method_total)), '[]'::jsonb)
      FROM (
        SELECT payment_method, SUM(total_amount) AS method_total
        FROM pos_sales
        WHERE status = 'completed'
          AND created_at::date >= v_week_start
          AND (p_branch_id IS NULL OR branch_id = p_branch_id)
        GROUP BY payment_method
        ORDER BY method_total DESC
      ) methods
    ),
    -- Top 5 productos más vendidos esta semana
    'top_products_week', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('name', part_name, 'quantity', qty, 'total', rev) ORDER BY rev DESC), '[]'::jsonb)
      FROM (
        SELECT si.part_name,
               SUM(si.quantity) AS qty,
               SUM(si.line_total) AS rev
        FROM pos_sale_items si
        JOIN pos_sales s ON s.id = si.sale_id
        WHERE s.status = 'completed'
          AND s.created_at::date >= v_week_start
          AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
        GROUP BY si.part_name
        ORDER BY rev DESC
        LIMIT 5
      ) top
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_summary(uuid) TO authenticated;

-- ============================================================
-- SECCIÓN 3: REPORTES - VENTAS POR DÍA
-- ============================================================

CREATE OR REPLACE FUNCTION get_report_sales_by_day(
  p_branch_id      uuid DEFAULT NULL,
  p_date_from      date DEFAULT NULL,
  p_date_to        date DEFAULT NULL,
  p_payment_method text DEFAULT NULL
)
RETURNS TABLE (
  sale_date         date,
  branch_id         uuid,
  branch_name       text,
  payment_method    text,
  total_amount      numeric,
  sale_count        bigint,
  avg_sale          numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No active authenticated session';
  END IF;

  RETURN QUERY
  SELECT
    s.created_at::date         AS sale_date,
    s.branch_id                AS branch_id,
    b.name                     AS branch_name,
    s.payment_method           AS payment_method,
    SUM(s.total_amount)        AS total_amount,
    COUNT(*)::bigint           AS sale_count,
    ROUND(AVG(s.total_amount), 2) AS avg_sale
  FROM pos_sales s
  JOIN branches b ON b.id = s.branch_id
  WHERE s.status = 'completed'
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND (p_date_from IS NULL OR s.created_at::date >= p_date_from)
    AND (p_date_to   IS NULL OR s.created_at::date <= p_date_to)
    AND (p_payment_method IS NULL OR s.payment_method = p_payment_method)
  GROUP BY s.created_at::date, s.branch_id, b.name, s.payment_method
  ORDER BY s.created_at::date DESC, total_amount DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_report_sales_by_day(uuid, date, date, text) TO authenticated;

-- ============================================================
-- SECCIÓN 4: REPORTES - TOP PRODUCTOS
-- ============================================================

CREATE OR REPLACE FUNCTION get_report_top_products(
  p_branch_id  uuid  DEFAULT NULL,
  p_date_from  date  DEFAULT NULL,
  p_date_to    date  DEFAULT NULL,
  p_limit      int   DEFAULT 20
)
RETURNS TABLE (
  part_id       uuid,
  part_code     text,
  part_name     text,
  category_name text,
  units_sold    bigint,
  revenue       numeric,
  avg_price     numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No active authenticated session';
  END IF;

  RETURN QUERY
  SELECT
    p.id                             AS part_id,
    p.code                           AS part_code,
    p.name                           AS part_name,
    COALESCE(ic.name, p.category, 'Sin categoría') AS category_name,
    SUM(si.quantity)::bigint         AS units_sold,
    SUM(si.line_total)               AS revenue,
    ROUND(AVG(si.unit_price), 2)     AS avg_price
  FROM pos_sale_items si
  JOIN parts p      ON p.id = si.part_id
  JOIN pos_sales s  ON s.id = si.sale_id
  LEFT JOIN inventory_categories ic ON ic.id = p.category_id
  WHERE s.status = 'completed'
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND (p_date_from IS NULL OR s.created_at::date >= p_date_from)
    AND (p_date_to   IS NULL OR s.created_at::date <= p_date_to)
  GROUP BY p.id, p.code, p.name, ic.name, p.category
  ORDER BY revenue DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_report_top_products(uuid, date, date, int) TO authenticated;

-- ============================================================
-- SECCIÓN 5: AUDITORÍA - LOG UNIFICADO (usa audit_logs real)
-- ============================================================

CREATE OR REPLACE FUNCTION get_audit_log(
  p_date_from    timestamptz DEFAULT NULL,
  p_date_to      timestamptz DEFAULT NULL,
  p_entity_type  text        DEFAULT NULL,
  p_user_search  text        DEFAULT NULL,
  p_limit        int         DEFAULT 200
)
RETURNS TABLE (
  event_id      text,
  event_time    timestamptz,
  entity_type   text,
  entity_id     text,
  action        text,
  description   text,
  actor_name    text,
  branch_name   text,
  metadata      jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No active authenticated session';
  END IF;

  RETURN QUERY
  SELECT
    al.id::text                    AS event_id,
    al.created_at                  AS event_time,
    -- Nombre legible de la tabla
    CASE al.entity_table
      WHEN 'pos_sales'        THEN 'Venta'
      WHEN 'pos_sale_items'   THEN 'Ítem de venta'
      WHEN 'pos_sale_queue'   THEN 'Cola de venta'
      WHEN 'pos_sale_returns' THEN 'Devolución'
      WHEN 'credits'          THEN 'Crédito'
      WHEN 'credit_payments'  THEN 'Pago de crédito'
      WHEN 'cash_sessions'    THEN 'Sesión de caja'
      WHEN 'cash_movements'   THEN 'Movimiento de caja'
      WHEN 'inventory'        THEN 'Inventario'
      WHEN 'parts'            THEN 'Producto'
      WHEN 'customers'        THEN 'Cliente'
      WHEN 'branches'         THEN 'Sucursal'
      WHEN 'users'            THEN 'Usuario'
      ELSE al.entity_table
    END                            AS entity_type,
    COALESCE(al.entity_id::text, '-') AS entity_id,
    -- Acción en español
    CASE al.action
      WHEN 'insert' THEN 'CREACION'
      WHEN 'update' THEN 'ACTUALIZACION'
      WHEN 'delete' THEN 'ELIMINACION'
      ELSE upper(al.action)
    END                            AS action,
    -- Descripción legible
    CASE al.action
      WHEN 'insert' THEN 'Creación de '
      WHEN 'update' THEN 'Actualización de '
      WHEN 'delete' THEN 'Eliminación de '
      ELSE al.action || ' en '
    END
    || CASE al.entity_table
         WHEN 'pos_sales'        THEN 'venta'
         WHEN 'pos_sale_items'   THEN 'ítem de venta'
         WHEN 'pos_sale_queue'   THEN 'cola de venta'
         WHEN 'pos_sale_returns' THEN 'devolución'
         WHEN 'credits'          THEN 'crédito'
         WHEN 'credit_payments'  THEN 'pago de crédito'
         WHEN 'cash_sessions'    THEN 'sesión de caja'
         WHEN 'cash_movements'   THEN 'movimiento de caja'
         WHEN 'inventory'        THEN 'inventario'
         WHEN 'parts'            THEN 'producto'
         WHEN 'customers'        THEN 'cliente'
         WHEN 'branches'         THEN 'sucursal'
         WHEN 'users'            THEN 'usuario'
         ELSE al.entity_table
       END
    || CASE
         WHEN COALESCE(al.new_data, al.old_data) IS NOT NULL
              AND COALESCE(al.new_data, al.old_data) ? 'total_amount'
           THEN ' — Total: Bs ' || (COALESCE(al.new_data, al.old_data)->>'total_amount')
         WHEN COALESCE(al.new_data, al.old_data) IS NOT NULL
              AND COALESCE(al.new_data, al.old_data) ? 'amount'
           THEN ' — Monto: Bs ' || (COALESCE(al.new_data, al.old_data)->>'amount')
         ELSE ''
       END
    || CASE
         WHEN al.new_data IS NOT NULL AND al.new_data ? 'payment_method'
           THEN ' | Método: ' || (al.new_data->>'payment_method')
         ELSE ''
       END
    || CASE
         WHEN al.new_data IS NOT NULL AND al.new_data ? 'customer_name'
              AND (al.new_data->>'customer_name') IS NOT NULL
           THEN ' | Cliente: ' || (al.new_data->>'customer_name')
         WHEN al.new_data IS NOT NULL AND al.new_data ? 'full_name'
           THEN ' | ' || (al.new_data->>'full_name')
         WHEN al.new_data IS NOT NULL AND al.new_data ? 'name'
           THEN ' | ' || (al.new_data->>'name')
         ELSE ''
       END                         AS description,
    COALESCE(u.full_name, 'Sistema') AS actor_name,
    -- branch_name: primero de audit_logs.branch_id, luego de new_data->branch_id
    COALESCE(
      b.name,
      (SELECT bb.name FROM branches bb WHERE bb.id = (COALESCE(al.new_data, al.old_data)->>'branch_id')::uuid),
      '-'
    )                              AS branch_name,
    COALESCE(al.metadata, al.new_data, '{}'::jsonb) AS metadata
  FROM audit_logs al
  LEFT JOIN users u    ON u.id = al.actor_user_id
  LEFT JOIN branches b ON b.id = al.branch_id
  WHERE (p_date_from IS NULL OR al.created_at >= p_date_from)
    AND (p_date_to   IS NULL OR al.created_at <= p_date_to)
    AND (p_entity_type IS NULL OR al.entity_table ILIKE '%' || p_entity_type || '%')
    AND (p_user_search IS NULL OR u.full_name ILIKE '%' || p_user_search || '%')
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_audit_log(timestamptz, timestamptz, text, text, int) TO authenticated;

