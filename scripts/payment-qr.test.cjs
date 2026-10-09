const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const Module = require('node:module')
const ts = require('typescript')

function loadTs(file, mocks = {}) {
  const filename = path.resolve(file)
  const mod = new Module(filename, module)
  mod.filename = filename
  mod.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = mod.require.bind(mod)
  mod.require = (name) => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name)
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename)
  return mod.exports
}
const store = loadTs('lib/server/payment-qr-store.ts')
let role = 'admin', active = true, authenticated = true, directory, oldDirectory
const authMock = {
  createSupabaseServerClient: () => ({ auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'test-user' } : null }, error: null }) } }),
  createSupabaseAdminClient: () => ({ from: (table) => ({ select() { return this }, eq() { return this }, async single() { return { data: table === 'users' ? { role_id: 'test-role', is_active: active } : { name: role }, error: null } } }) }),
}
const route = loadTs('app/api/settings/payment-qr/route.ts', {
  '@/lib/supabase/server': authMock,
  '@/lib/server/payment-qr-store': store,
})
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
const request = (method, form, auth = true) => new Request('http://localhost/api/settings/payment-qr', { method, headers: auth ? { Authorization: 'Bearer test' } : {}, body: form })
const upload = (bytes = png, type = 'image/png', name = '../../outside.png') => {
  const form = new FormData()
  form.set('file', new File([bytes], name, { type }))
  return request('POST', form)
}
before(async () => {
  directory = await fsp.mkdtemp(path.join(os.tmpdir(), 'picla-qr-test-'))
  oldDirectory = process.env.PAYMENT_QR_DIR
  process.env.PAYMENT_QR_DIR = directory
})
after(async () => {
  if (oldDirectory === undefined) delete process.env.PAYMENT_QR_DIR
  else process.env.PAYMENT_QR_DIR = oldDirectory
  assert.equal(path.dirname(directory), os.tmpdir())
  assert.ok(path.basename(directory).startsWith('picla-qr-test-'))
  await fsp.rm(directory, { recursive: true, force: true })
})
test('sin QR devuelve estado vacío e imagen 404', async () => {
  assert.deepEqual(await (await route.GET(request('GET'))).json(), { url: null })
  assert.equal((await route.GET(new Request('http://localhost/api/settings/payment-qr?image=1'))).status, 404)
})
test('bloquea escritura sin sesión, con sesión inválida, rol no administrador y usuario inactivo', async () => {
  assert.equal((await route.POST(request('POST', undefined, false))).status, 401)
  assert.equal((await route.DELETE(request('DELETE', undefined, false))).status, 401)
  authenticated = false
  assert.equal((await route.POST(upload())).status, 401)
  authenticated = true
  role = 'employee'
  assert.equal((await route.POST(upload())).status, 403)
  assert.equal((await route.DELETE(request('DELETE'))).status, 403)
  role = 'admin'; active = false
  assert.equal((await route.POST(upload())).status, 403)
  active = true
  assert.equal(await store.readPaymentQr(), null)
})
test('admin sube y sirve una imagen desde disco sin usar el nombre enviado', async () => {
  const response = await route.POST(upload())
  assert.equal(response.status, 200)
  const { url } = await response.json()
  assert.match(url, /image=1&v=/)
  const image = await route.GET(new Request('http://localhost' + url))
  assert.equal(image.headers.get('content-type'), 'image/png')
  assert.equal(image.headers.get('cache-control'), 'no-store')
  assert.equal(image.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png)
  assert.deepEqual(await fsp.readdir(directory), ['payment-qr.image'])
})
test('rechaza tipos falsos y archivos grandes conservando el QR anterior', async () => {
  assert.equal((await route.POST(upload(Buffer.from('<svg>bad</svg>')))).status, 400)
  assert.equal((await route.POST(upload(png, 'image/jpeg'))).status, 400)
  assert.equal((await route.POST(upload(png, 'image/svg+xml'))).status, 400)
  const large = Buffer.alloc(store.MAX_QR_BYTES + 1)
  assert.equal((await route.POST(upload(large))).status, 400)
  const oversized = new Request('http://localhost/api/settings/payment-qr', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(store.MAX_QR_BYTES + 128 * 1024)); controller.close() } }), duplex: 'half' })
  assert.equal((await route.POST(oversized)).status, 413)
  await assert.rejects(store.writePaymentQr(large, 'image/png'))
  assert.deepEqual((await store.readPaymentQr()).bytes, png)
})
test('reemplaza el archivo y cambia la URL sin dejar temporales', async () => {
  const previous = (await store.readPaymentQr()).url
  const replacement = Buffer.from(png)
  replacement[replacement.length - 1] ^= 1
  await store.writePaymentQr(replacement, 'image/png')
  assert.notEqual((await store.readPaymentQr()).url, previous)
  assert.deepEqual(await fsp.readdir(directory), ['payment-qr.image'])
})
test('admin elimina el QR y eliminarlo nuevamente es válido', async () => {
  assert.equal((await route.DELETE(request('DELETE'))).status, 200)
  assert.equal(await store.readPaymentQr(), null)
  assert.equal((await route.DELETE(request('DELETE'))).status, 200)
})
