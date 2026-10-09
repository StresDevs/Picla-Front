const assert = require('node:assert/strict')
const { test } = require('node:test')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const filename = path.join(__dirname, '../lib/pos-price.ts')
const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const helper = new Module(filename)
helper._compile(compiled, filename)
const { resolvePOSPriceDraft } = helper.exports

for (const [draft, price, reason] of [
  ['19', 20, 'min'], ['41', 40, 'max'], ['20', 20, null], ['40', 40, null],
  ['30', 30, null], ['25.50', 25.5, null], ['', 30, 'invalid'],
  ['  ', 30, 'invalid'], ['abc', 30, 'invalid'], ['Infinity', 30, 'invalid'],
  ['-1', 20, 'min'], ['1', 20, 'min'], ['35.126', 35.13, null],
]) {
  test('Al terminar la edición de ' + JSON.stringify(draft), () => {
    assert.deepEqual(resolvePOSPriceDraft(draft, 30, 20, 40), { price, reason })
  })
}

test('Vaciar restaura el último precio confirmado, no siempre el original', () => {
  assert.deepEqual(resolvePOSPriceDraft('', 25, 20, 40), { price: 25, reason: 'invalid' })
})
test('Escribir por etapas permite alcanzar un precio válido', () => {
  let draft = '30'
  let confirmedPrice = 30
  for (const text of ['', '1', '19', '35']) draft = text
  assert.equal(confirmedPrice, 30)
  confirmedPrice = resolvePOSPriceDraft(draft, confirmedPrice, 20, 40).price
  assert.equal(confirmedPrice, 35)
})
