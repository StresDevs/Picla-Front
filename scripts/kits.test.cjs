const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

function loadTs(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file)
  const mod = new Module(filename, module)
  mod.filename = filename
  mod.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = mod.require.bind(mod)
  mod.require = (name) => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name)
  mod._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename)
  return mod.exports
}

const helpers = loadTs('lib/kit-code.ts')
const input = {
  code: 'GENERAL-008', name: 'Nuevo kit', description: '', category: 'General', branch_id: 'branch-a',
  items: [{ id: 'draft', part_id: 'part-a', quantity: 2, kit_price: 10 }],
}
const duplicate = { code: '23505', message: 'duplicate key value violates unique constraint "product_kits_branch_id_code_key"' }

function serviceWithDatabase(options = {}) {
  const kits = (options.kits || []).map((kit) => ({ ...kit }))
  const components = []
  const attempts = []
  const deleted = []
  let reads = 0
  const client = {
    from(table) {
      let operation, rows, filters = [], start = 0, end = Infinity
      const query = {
        insert(value) { operation = 'insert'; rows = value; return this },
        select() { operation ||= 'select'; return this },
        delete() { operation = 'delete'; return this },
        eq(key, value) { filters.push([key, value]); return this },
        order() { return this },
        range(from, to) { start = from; end = to; return this },
        single() { return this },
        async then(resolve, reject) {
          try {
            if (table === 'product_kit_items') {
              if (options.itemError) return resolve({ data: null, error: options.itemError })
              components.push(...rows)
              return resolve({ data: null, error: null })
            }
            if (operation === 'insert') {
              attempts.push(rows[0].code)
              if (options.insertError) return resolve({ data: null, error: options.insertError })
              if (kits.some((kit) => kit.branch_id === rows[0].branch_id && kit.code === rows[0].code)) {
                return resolve({ data: null, error: duplicate })
              }
              const kit = { ...rows[0], id: `kit-${kits.length + 1}`, is_active: true }
              kits.push(kit)
              return resolve({ data: kit, error: null })
            }
            if (operation === 'delete') {
              if (options.cleanupError) return resolve({ data: null, error: options.cleanupError })
              const index = kits.findIndex((kit) => filters.every(([key, value]) => kit[key] === value))
              if (index >= 0) deleted.push(...kits.splice(index, 1))
              return resolve({ data: null, error: null })
            }
            reads++
            if (options.readError) return resolve({ data: null, error: options.readError })
            const data = kits.filter((kit) => filters.every(([key, value]) => kit[key] === value))
              .slice(start, end + 1).map(({ code }) => ({ code }))
            return resolve({ data, error: null })
          } catch (error) { return reject(error) }
        },
      }
      return query
    },
  }
  const { kitsService } = loadTs('lib/supabase/inventory.ts', {
    './client': { supabase: client }, '@/lib/kit-code': helpers,
  })
  return { service: kitsService, kits, components, attempts, deleted, get reads() { return reads } }
}

test('el codigo avanza por prefijo aunque se edite la categoria o se normalice igual', () => {
  assert.equal(helpers.buildNextKitCode(' General ', [{ code: 'GENERAL-007', category: 'Otra' }]), 'GENERAL-008')
  assert.equal(helpers.buildNextKitCode('Motor / aceite', [{ code: 'MOTOR-ACEITE-009' }]), 'MOTOR-ACEITE-010')
  assert.equal(helpers.buildNextKitCode('Motor', [{ code: 'MOTOR-ACEITE-999' }, { code: 'MOTOR-002' }]), 'MOTOR-003')
  assert.equal(helpers.buildNextKitCode('', []), 'GENERAL-001')
})

test('los errores planos de Supabase conservan su mensaje', () => {
  assert.equal(helpers.getKitErrorMessage({ message: 'Permiso denegado', code: '42501' }, 'Error'), 'Permiso denegado')
  assert.equal(helpers.getKitErrorMessage(new Error('Sin conexion'), 'Error'), 'Sin conexion')
  assert.equal(helpers.getKitErrorMessage(null, 'Error'), 'Error')
})

test('permite crear consecutivamente mas de siete kits', async () => {
  const db = serviceWithDatabase()
  for (let n = 1; n <= 12; n++) {
    const code = helpers.buildNextKitCode('General', db.kits)
    const created = await db.service.create({ ...input, code })
    assert.equal(created.code, `GENERAL-${String(n).padStart(3, '0')}`)
  }
  assert.equal(db.kits.length, 12)
  assert.equal(db.components.length, 12)
})

test('un codigo reservado por un kit eliminado se reemplaza sin tocar otros registros', async () => {
  const existing = { id: 'deleted', code: 'GENERAL-008', branch_id: input.branch_id, is_active: false }
  const db = serviceWithDatabase({ kits: [existing, { code: 'GENERAL-999', branch_id: 'branch-b' }] })
  const created = await db.service.create(input)
  assert.equal(created.code, 'GENERAL-009')
  assert.deepEqual(db.attempts, ['GENERAL-008', 'GENERAL-009'])
  assert.deepEqual(db.kits[0], existing)
  assert.equal(db.components.length, 1)
})

test('reintenta un codigo que ya fue creado por otro usuario', async () => {
  const db = serviceWithDatabase({ kits: [{ code: input.code, branch_id: input.branch_id, is_active: true }] })
  assert.equal((await db.service.create(input)).code, 'GENERAL-009')
  assert.equal(db.kits.length, 2)
})

test('consulta todos los codigos cuando hay mas de una pagina', async () => {
  const kits = Array.from({ length: 505 }, (_, i) => ({
    code: `GENERAL-${String(i + 1).padStart(3, '0')}`, branch_id: input.branch_id,
  }))
  const db = serviceWithDatabase({ kits })
  assert.equal((await db.service.create(input)).code, 'GENERAL-506')
  assert.equal(db.reads, 2)
})

test('rechaza productos repetidos o un kit vacio antes de crear la cabecera', async () => {
  const db = serviceWithDatabase()
  await assert.rejects(db.service.create({ ...input, items: [...input.items, ...input.items] }), /repetidos/)
  await assert.rejects(db.service.create({ ...input, items: [] }), /al menos un producto/)
  assert.equal(db.kits.length, 0)
  assert.equal(db.attempts.length, 0)
})

test('un fallo de componentes elimina solo la cabecera del intento fallido', async () => {
  const itemError = { code: '23503', message: 'Producto inexistente' }
  const existing = { id: 'existing', code: 'GENERAL-001', branch_id: input.branch_id }
  const db = serviceWithDatabase({ kits: [existing], itemError })
  await assert.rejects(db.service.create(input), (error) => error === itemError)
  assert.deepEqual(db.kits, [existing])
  assert.equal(db.deleted.length, 1)
  assert.equal(db.components.length, 0)
})

test('si falla la limpieza informa que kit necesita revision', async () => {
  const db = serviceWithDatabase({ itemError: { message: 'Sin permisos' }, cleanupError: { message: 'Sin conexion' } })
  await assert.rejects(db.service.create(input), /GENERAL-008.*Revisa ese kit/)
  assert.equal(db.kits.length, 1)
})

test('un error de permisos se devuelve sin reintentos de codigo', async () => {
  const insertError = { code: '42501', message: 'Permiso denegado' }
  const db = serviceWithDatabase({ insertError })
  await assert.rejects(db.service.create(input), (error) => error === insertError)
  assert.equal(db.attempts.length, 1)
  assert.equal(db.reads, 0)
})

test('los reintentos por concurrencia tienen un limite y un mensaje explicito', async () => {
  const db = serviceWithDatabase({ insertError: duplicate })
  await assert.rejects(db.service.create(input), /mismo tiempo/)
  assert.equal(db.attempts.length, 3)
})
