const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

function loadTs(relative, mocks = {}) {
  const filename = path.join(__dirname, '..', relative)
  const module = new Module(filename)
  module.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = module.require.bind(module)
  module.require = (name) => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name)
  module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename)
  return module.exports
}

const { buildInvoiceHtml, printMockInvoice } = loadTs('lib/mock/invoice.ts')
const { receiptFromSale, getSalePaymentMethod } = loadTs('lib/sale-receipt.ts', { './pos-payments': loadTs('lib/pos-payments.ts') })
const base = {
  invoiceNumber: 'N1', customerName: 'Cliente Uno', branchName: 'Centro', cashierName: 'Ana Perez',
  currency: 'BOB', total: 100, lines: [{ code: 'P1', name: 'Repuesto', quantity: 2, unitPrice: 50 }],
}

for (const paymentMethod of ['Efectivo', 'QR/Transferencia', 'Tarjeta', 'Crédito']) {
  test(`Comprobante imprimible para ${paymentMethod}`, () => {
    const html = buildInvoiceHtml({ ...base, paymentMethod })
    for (const value of ['Cliente Uno', 'Ana Perez', 'Repuesto', 'P1', 'Bs 100.00', paymentMethod]) assert.ok(html.includes(value), value)
    assert.ok(!html.includes('window.print()'), 'La vista previa no imprime automáticamente')
    assert.ok(buildInvoiceHtml({ ...base, paymentMethod }, true).includes('window.print()'))
  })
}

test('Credito incluye anticipo, saldo y condiciones incluso sin pago inicial', () => {
  for (const initialPayment of [0, 30]) {
    const html = buildInvoiceHtml({ ...base, paymentMethod: 'Crédito', isCredit: true, notes: 'Acuerdo especial', credit: {
      initialPayment, initialPaymentMethod: 'QR/Transferencia', balance: 100 - initialPayment,
      dueDays: 10, dueDate: '19/10/2026', reminderDate: '15/10/2026', sellerName: 'Luis Responsable',
    } })
    for (const value of ['Pago inicial', `Bs ${initialPayment.toFixed(2)}`, `Bs ${(100 - initialPayment).toFixed(2)}`, '10 días', '19/10/2026', '15/10/2026', 'Luis Responsable', 'Acuerdo especial']) assert.ok(html.includes(value), value)
    assert.ok(html.includes(initialPayment ? 'QR/Transferencia' : 'Sin pago inicial'))
  }
})

test('Los datos del cliente y productos no pueden insertar scripts en el comprobante', () => {
  const attack = '<script>alert("x")</script>'
  const html = buildInvoiceHtml({ ...base, paymentMethod: 'Efectivo', customerName: attack, lines: [{ name: attack, quantity: 1, unitPrice: 100 }] })
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;'))
})

test('Imprimir detecta ventana bloqueada y escribe el comprobante al permitirla', () => {
  try {
    global.window = { open: () => null }
    assert.equal(printMockInvoice({ ...base, paymentMethod: 'Efectivo' }), false)
    let documentHtml = ''
    global.window = { open: () => ({ document: { open() {}, write(html) { documentHtml = html }, close() {} } }) }
    assert.equal(printMockInvoice({ ...base, paymentMethod: 'Efectivo' }), true)
    assert.ok(documentHtml.includes('Ana Perez'))
    assert.ok(documentHtml.includes('window.print()'))
  } finally { delete global.window }
})

test('Historial reconoce credito aunque el metodo guardado por POS sea efectivo', () => {
  const sale = { sale_id: 'sale-1', sold_by_name: 'Ana Perez', payment_method: 'cash', customer_name: 'Cliente Uno',
    total_amount: 100, created_at: '2026-10-09T12:00:00Z', metadata: {
      payment_type: 'credit', credit_initial_payment: 30, credit_initial_payment_method: 'qr', credit_due_days: 10,
    }, items: [{ part_code: 'P1', part_name: 'Repuesto', quantity: 2, unit_price: 50, delivered_quantity: 1 }] }
  assert.equal(getSalePaymentMethod(sale), 'credit')
  const receipt = receiptFromSale(sale, 'N1', 'Centro')
  assert.equal(receipt.cashierName, 'Ana Perez')
  assert.equal(receipt.credit.initialPayment, 30)
  assert.equal(receipt.credit.balance, 70)
  assert.equal(receipt.credit.initialPaymentMethod, 'QR/Transferencia')
  assert.deepEqual(receipt.pendingDeliveryItems, ['Repuesto (1 pendientes)'])
})

// Ejecuta la función real de cierre del componente con sus servicios simulados.
const pageSource = readFileSync(path.join(__dirname, '../app/pos/sales/page.tsx'), 'utf8')
const ast = ts.createSourceFile('page.tsx', pageSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let checkoutFunction
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'completeOrQueueSale') checkoutFunction = node.initializer.getText(ast)
  ts.forEachChild(node, visit)
}
visit(ast)
const compiledCheckout = ts.transpileModule(`const checkout = ${checkoutFunction};`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText

async function completeSale(payment, currency = 'BOB', overrides = {}) {
  let receipt, saleInput
  const errors = []
  const noop = () => {}
  const scope = {
    setFirstPaymentAmount: noop, setAutoSecondPayment: noop,
    isSubmitting: false, priceDrafts: {}, priceChangesEnabled: true, changedPrices: [], anonymousSale: false,
    cart: [{ part_id: 'p1', code: 'P1', name: 'Repuesto', quantity: 2, unit_price: 50, base_price: 50 }],
    selectedCustomer: { id: 'c1', full_name: 'Cliente Uno', nit_ci: '123', phone: '777' },
    isCreditSale: payment === 'credit', canQueueSale: false, canCompleteSale: true, selectedPayment: payment,
    creditSellerName: 'Luis Responsable', creditInitialPayment: '30', creditDueDays: '10', creditReminderDate: '',
    creditNotes: 'Acuerdo', creditInitialPaymentMethod: 'qr', cartTotalBob: 100, paymentCurrency: currency,
    safeExchangeRate: 10, amountToCharge: currency === 'USD' ? 10 : 100,
    activeBranchId: 'b1', activeBranchName: 'Centro', activeUserName: 'Ana Perez', resolvedCustomerName: 'Cliente Uno',
    deliverySet: new Set(), normalizeBranchId: (id) => id, buildSaleItemsPayload: () => [], parseDateInput: (value) => value ? new Date(value) : null,
    posService: { createSale: async (input) => { saleInput = input; return { sale_id: 'sale-1' } }, getSaleReceiptNumber: async () => 'N1' },
    creditsService: { create: async () => 'credit-1' }, reloadPOSData: async () => {},
    PAYMENT_METHODS: [{ id: 'cash', label: 'Efectivo' }, { id: 'qr', label: 'QR/Transferencia' }, { id: 'credit', label: 'Crédito' }],
    setIsSubmitting: noop, setIsCheckoutOpen: noop, setCart: noop, setDeliverySet: noop, setCreditInitialPayment: noop, setCreditDueDays: noop,
    setCreditReminderDate: noop, setCreditNotes: noop, toast: noop, setCompletedReceipt: (value) => { receipt = value },
    setErrorModal: (value) => errors.push(value), parseErrorDetails: (error) => ({ message: error.message }), toFriendlySaleError: (value) => value,
    ...overrides,
  }
  const fn = new Function(...Object.keys(scope), `${compiledCheckout}\nreturn checkout()`)
  const success = await fn(...Object.values(scope))
  return { success, receipt, errors, saleInput }
}

for (const payment of ['cash', 'qr', 'credit']) {
  test(`Al finalizar venta ${payment} siempre se abre el comprobante`, async () => {
    const { success, receipt, errors, saleInput } = await completeSale(payment)
    assert.equal(success, true)
    assert.deepEqual(errors, [])
    assert.equal(receipt.total, 100)
    assert.equal(receipt.cashierName, 'Ana Perez')
    assert.equal(receipt.customerDocument, '123')
    assert.equal(saleInput.metadata.created_by_name, 'Ana Perez')
    if (payment === 'credit') {
      assert.equal(receipt.credit.initialPayment, 30)
      assert.equal(receipt.credit.balance, 70)
      assert.equal(receipt.credit.registered, true)
      assert.equal(saleInput.metadata.credit_initial_payment_method, 'qr')
    } else assert.equal(receipt.credit, undefined)
  })
}

test('En USD los precios del comprobante coinciden con el total convertido', async () => {
  const { receipt } = await completeSale('qr', 'USD')
  assert.equal(receipt.currency, 'USD')
  assert.equal(receipt.total, 10)
  assert.equal(receipt.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), receipt.total)
})

test('Si falla el registro del credito, la venta conserva comprobante y advierte el fallo', async () => {
  const { success, receipt, errors } = await completeSale('credit', 'BOB', { creditsService: { create: async () => { throw new Error('Fallo credito') } } })
  assert.equal(success, true)
  assert.equal(receipt.credit.registered, false)
  assert.equal(errors.length, 1)
  assert.ok(buildInvoiceHtml(receipt).includes('el registro del crédito falló'))
})

test('PDF individual y reporte general contienen el vendedor y datos del credito', () => {
  const { jsPDF } = require('jspdf')
  const originalSave = jsPDF.API.save
  let pdf
  jsPDF.API.save = function () { pdf = this.output(); return this }
  try {
    const generators = loadTs('lib/pdf/generators.ts')
    generators.generateSaleInvoicePdf({ saleId: 's1', date: '2026-10-09', customer: 'Cliente Uno', paymentMethod: 'Credito', branchName: 'Centro',
      cashier: 'Ana Perez', total: 100, items: [{ name: 'Repuesto', quantity: 2, unitPrice: 50, lineTotal: 100 }],
      credit: { initialPayment: 30, paidAmount: 30, balance: 70, dueDate: '2026-10-19', sellerName: 'Luis Responsable' } })
    for (const value of ['Ana Perez', 'Luis Responsable', 'Pago inicial', 'Bs 30.00', 'Bs 70.00']) assert.ok(pdf.includes(value), value)
    generators.generateCashSessionPdf({ branchName: 'Centro', sessionDate: '09/10/2026', cashier: 'Varios', exchangeRate: 10,
      sales: ['Ana Perez', 'Luis Gomez'].map((seller, i) => ({ saleId: `s${i}`, saleNumber: `N${i + 1}`, date: '2026-10-09', customer: 'Cliente', paymentMethod: 'Efectivo', seller,
        items: [{ code: 'P1', name: 'Repuesto', quantity: 1, unit: 'PZA', unitPrice: 50, totalBob: 50, totalUsd: 5 }], subtotalBob: 50, discount: 0, totalBob: 50, totalUsd: 5 })) })
    for (const value of ['Vendedor', 'Ana Perez', 'Luis Gomez', 'N1', 'N2']) assert.ok(pdf.includes(value), value)
  } finally { jsPDF.API.save = originalSave }
})

test('Excel general e individual preservan vendedor, columnas y extras de credito', () => {
  const source = readFileSync(path.join(__dirname, '../app/pos/sales-history/page.tsx'), 'utf8')
  const ast = ts.createSourceFile('history.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const callbacks = []
  function find(node, ancestors = []) {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'exportToExcel') {
      callbacks.push([...ancestors].reverse().find(ts.isArrowFunction).getText(ast))
    }
    ts.forEachChild(node, (child) => find(child, [...ancestors, node]))
  }
  find(ast)
  assert.equal(callbacks.length, 2)
  const XLSX = require('xlsx')
  const originalWriteFile = XLSX.writeFile
  let workbook
  XLSX.writeFile = (value) => { workbook = value }
  try {
    const { exportToExcel } = loadTs('lib/excel/export.ts')
    const sale = { sale_id: 's1', sold_by_name: 'Ana Perez', metadata: { credit_initial_payment: 30 },
      items: [{ part_code: 'P1', part_name: 'Repuesto', quantity: 2, unit_price: 50, line_total: 100 }] }
    const scope = { ...loadTs('lib/pos-payments.ts'), getSalePaymentMethod, exportToExcel, filteredSales: [sale], branches: [{ id: 'b1', name: 'Centro' }], activeBranchId: 'b1',
      getCachedAppSettings: () => ({ usd_to_bob_rate: 10 }), resolveSaleNumber: () => 'N1', branchName: 'Centro', saleNumber: 'N1', sale,
      creditMap: new Map([['s1', { paid_amount: 30, balance: 70, due_date: '2026-10-19', seller_name: 'Luis Responsable', notes: 'Acuerdo' }]]) }
    for (const callback of callbacks) {
      const code = ts.transpileModule(`const action = ${callback}; action();`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText
      new Function(...Object.keys(scope), code)(...Object.values(scope))
      const [headers, row] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })
      assert.equal(row.length, headers.length)
      assert.equal(row[headers.indexOf('Vendedor')], 'Ana Perez')
      assert.equal(row[headers.indexOf('Venta')], 'N1')
      if (headers.includes('Pago inicial (Bs)')) {
        assert.equal(row[headers.indexOf('Pago inicial (Bs)')], 30)
        assert.equal(row[headers.indexOf('Saldo actual (Bs)')], 70)
      }
    }
  } finally { XLSX.writeFile = originalWriteFile }
})

test('Historial une vendedores por identificador de venta sin mezclar filas', async () => {
  const sales = [{ sale_id: 's1', sold_by: 'u1' }, { sale_id: 's2', sold_by: 'u2' }]
  const calls = []
  const supabase = { rpc: async (name, args) => {
    calls.push([name, args])
    return { data: name === 'pos_get_sales' ? sales : [
      { sale_id: 's2', sold_by_name: 'Luis Gomez', metadata: {}, exchange_rate: 10 },
      { sale_id: 's1', sold_by_name: 'Ana Perez', metadata: {}, exchange_rate: 10 },
    ] }
  } }
  const { posService } = loadTs('lib/supabase/pos.ts', { './client': { supabase }, '../pos-payments': loadTs('lib/pos-payments.ts') })
  const result = await posService.getSales('b1', true)
  assert.deepEqual(result.map((sale) => sale.sold_by_name), ['Ana Perez', 'Luis Gomez'])
  assert.equal(calls[1][1].p_branch_id, 'b1')
})

test('Sin nueva consulta SQL usa nombre guardado y conserva ID cuando RLS oculta otro usuario', async () => {
  const supabase = {
    rpc: async (name) => name === 'pos_get_sales' ? { data: [{ sale_id: 's1', sold_by: 'u1' }, { sale_id: 's2', sold_by: 'u2' }] } : { error: { code: 'PGRST202' } },
    from: (table) => ({ select: () => ({ in: async () => ({ data: table === 'users' ? [] : [
      { id: 's1', metadata: { created_by_name: 'Ana Perez' }, exchange_rate: 10 },
      { id: 's2', metadata: {}, exchange_rate: 10 },
    ] }) }) }),
  }
  const { posService } = loadTs('lib/supabase/pos.ts', { './client': { supabase }, '../pos-payments': loadTs('lib/pos-payments.ts') })
  const result = await posService.getSales('b1')
  assert.deepEqual(result.map((sale) => sale.sold_by_name), ['Ana Perez', 'Usuario u2'])
})

test('La venta completada conserva comprobante si falla la actualizacion posterior del POS', async () => {
  const { success, receipt, errors } = await completeSale('cash', 'BOB', { reloadPOSData: async () => { throw new Error('Sin conexion') } })
  assert.equal(success, true)
  assert.equal(receipt.invoiceNumber, 'N1')
  assert.deepEqual(errors, [])
})
