-- Crear tablas para el sistema de gestión de repuestos

-- Tabla de sucursales
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  manager VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios (trabajadores)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  branch_id UUID REFERENCES branches(id),
  role VARCHAR(50) DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  nit_ci VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de repuestos/partes
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(code, branch_id)
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 10,
  max_quantity INTEGER DEFAULT 1000,
  last_restock TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(part_id, branch_id)
);

-- Tabla de cajas registradoras
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  opening_balance DECIMAL(10, 2) NOT NULL,
  closing_balance DECIMAL(10, 2),
  expected_amount DECIMAL(10, 2),
  difference DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones de caja
CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID REFERENCES cash_registers(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de gastos de caja chica
CREATE TABLE IF NOT EXISTS cash_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID REFERENCES cash_registers(id),
  branch_id UUID REFERENCES branches(id),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  receipt_url TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL,
  cash_register_id UUID REFERENCES cash_registers(id),
  branch_id UUID REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items de venta
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transferencias de productos entre sucursales
CREATE TABLE IF NOT EXISTS product_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID REFERENCES parts(id),
  from_branch_id UUID REFERENCES branches(id),
  to_branch_id UUID REFERENCES branches(id),
  quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  user_id UUID REFERENCES users(id),
  transfer_date DATE NOT NULL,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de devoluciones de ventas
CREATE TABLE IF NOT EXISTS sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id),
  part_id UUID REFERENCES parts(id),
  quantity INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  branch_id UUID REFERENCES branches(id),
  return_date DATE NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de créditos
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  sale_id UUID REFERENCES sales(id),
  branch_id UUID REFERENCES branches(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  balance DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_date DATE NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos de créditos
CREATE TABLE IF NOT EXISTS credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID REFERENCES credits(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_parts_branch_id ON parts(branch_id);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_code ON parts(code);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_branch_id ON cash_registers(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_id ON cash_registers(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_register_id ON cash_transactions(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_expenses_branch_id ON cash_expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_cash_register ON sales(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_product_transfers_from ON product_transfers(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_product_transfers_to ON product_transfers(to_branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_sale_id ON sales_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_branch_id ON sales_returns(branch_id);
CREATE INDEX IF NOT EXISTS idx_credits_branch_id ON credits(branch_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_customer_id ON credits(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_id ON audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
