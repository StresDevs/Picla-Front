const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const filename = path.join(__dirname, '../lib/pos-payments.ts')
const helper = new Module(filename)
helper._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename)
const { validateMixedPayments, receiptPayments, saleTotalBob } = helper.exports

test('Solo efectivo y QR pueden participar en nuevos pagos mixtos', () => {
  assert.equal(validateMixedPayments([{ method: 'cash', amount: 4 }, { method: 'qr', amount: 6 }], 10), null)
  assert.ok(validateMixedPayments([{ method: 'cash', amount: 4 }, { method: 'card', amount: 6 }], 10))
  assert.ok(validateMixedPayments([{ method: 'qr', amount: 4 }, { method: 'qr', amount: 6 }], 10))
})
test('Los importes deben cuadrar al centavo y ser finitos', () => {
  assert.ok(validateMixedPayments([{ method: 'cash', amount: 4 }, { method: 'qr', amount: 5.99 }], 10))
  assert.ok(validateMixedPayments([{ method: 'cash', amount: NaN }, { method: 'qr', amount: 6 }], 10))
  assert.equal(saleTotalBob([{ quantity: 3, unit_price: 0.1 }, { quantity: 1, unit_price: 0.2 }]), 0.5)
})
test('El comprobante de una edición conserva el neto por método, incluso una devolución cruzada', () => {
  assert.deepEqual(receiptPayments({ payment_type: 'adjusted', payments: [{ method: 'cash', amount: 100 }, { method: 'qr', amount: -20 }] }), [
    { method: 'Efectivo', amount: 100 }, { method: 'QR/Transferencia', amount: -20 },
  ])
})
test('La evidencia histórica de tarjeta sigue siendo legible sin habilitar pagos nuevos', () => {
  assert.deepEqual(receiptPayments({ payment_type: 'mixed', payments: [{ method: 'card', amount: 10 }] }), [{ method: 'Tarjeta', amount: 10 }])
})
