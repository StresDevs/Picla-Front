import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'

export const MAX_QR_BYTES = 2 * 1024 * 1024
export const QR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export function detectQrMime(bytes: Buffer): string | null {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR') return 'image/png'
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) return 'image/jpeg'
  if (bytes.length >= 16 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}
function qrDirectory() {
  return resolve(/* turbopackIgnore: true */ process.env.PAYMENT_QR_DIR || join(process.cwd(), 'data', 'payment-qr'))
}
export async function readPaymentQr() {
  try {
    const bytes = await readFile(join(qrDirectory(), 'payment-qr.image'))
    const mime = detectQrMime(bytes)
    if (!mime) throw new Error('Archivo QR inválido')
    const version = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
    return { bytes, mime, url: '/api/settings/payment-qr?image=1&v=' + version }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
export async function writePaymentQr(bytes: Buffer, mime: string) {
  if (!bytes.length || bytes.length > MAX_QR_BYTES || !QR_MIME_TYPES.includes(mime) || detectQrMime(bytes) !== mime) {
    throw new Error('Selecciona una imagen PNG, JPG o WebP válida de hasta 2 MB')
  }
  const directory = qrDirectory()
  await mkdir(directory, { recursive: true })
  const temporary = join(directory, randomUUID() + '.tmp')
  try {
    await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 })
    await rename(temporary, join(directory, 'payment-qr.image'))
  } finally {
    await rm(temporary, { force: true })
  }
}
export async function deletePaymentQr() {
  await rm(join(qrDirectory(), 'payment-qr.image'), { force: true })
}
