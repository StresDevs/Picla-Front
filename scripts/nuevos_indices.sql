-- ============================================================
-- PICLA - NUEVOS ÍNDICES PARA OPTIMIZACIÓN
-- Ejecutar en Supabase SQL Editor como superuser/service_role
-- ============================================================

-- Índices para consultas de dashboard y reportes por fecha (pos_sales)
CREATE INDEX IF NOT EXISTS idx_pos_sales_created_at_completed
  ON pos_sales (created_at DESC)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_pos_sales_branch_created_completed
  ON pos_sales (branch_id, created_at DESC)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_pos_sales_payment_method_created
  ON pos_sales (payment_method, created_at DESC)
  WHERE status = 'completed';

-- Índices para pos_sale_items (reportes de top productos)
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_part_id_v2
  ON pos_sale_items (part_id);

-- Índices para créditos (ya existen la mayoría, añadimos los que falten)
CREATE INDEX IF NOT EXISTS idx_credits_branch_status_v2
  ON credits (branch_id, status);

CREATE INDEX IF NOT EXISTS idx_credits_created_at_desc_v2
  ON credits (created_at DESC);

-- Índices para pagos de crédito
CREATE INDEX IF NOT EXISTS idx_credit_payments_credit_id_v2
  ON credit_payments (credit_id);

CREATE INDEX IF NOT EXISTS idx_credit_payments_created_at_desc
  ON credit_payments (created_at DESC);

-- Índices para inventario (stock crítico en dashboard)
CREATE INDEX IF NOT EXISTS idx_inventory_branch_quantity_v2
  ON inventory (branch_id, quantity);

-- Índices para cash_sessions (auditoría)
CREATE INDEX IF NOT EXISTS idx_cash_sessions_branch_opened_v2
  ON cash_sessions (branch_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_movements_session_type_v2
  ON cash_movements (cash_session_id, movement_type);

-- Índice para audit_logs (consultas de auditoría)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_action
  ON audit_logs (entity_table, action, created_at DESC);
