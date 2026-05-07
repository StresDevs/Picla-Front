import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// -------------------------------------------------------------------
// Shared types & helpers
// -------------------------------------------------------------------

type CellDef = string | number
type RowData = CellDef[]

function fmtDate(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('es-BO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function fmtTime(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

function fmtDateTime(d: Date | string) {
  return `${fmtDate(d)} ${fmtTime(d)}`
}

function fmtMoney(v: number | null | undefined, decimals = 2) {
  return (v ?? 0).toFixed(decimals)
}

function buildTitle(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 20, { align: 'center' })
  if (subtitle) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, pageWidth / 2, 27, { align: 'center' })
  }
}

function addFooter(doc: jsPDF, text: string) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(text, 14, pageHeight - 8)
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
    doc.setTextColor(0)
  }
}

function savePdf(doc: jsPDF, name: string) {
  doc.save(`${name}_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// -------------------------------------------------------------------
// Number to text (Spanish) for invoice totals
// -------------------------------------------------------------------

const UNITS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
const TENS_SPECIAL = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
const TENS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function numberToSpanish(n: number): string {
  if (n === 0) return 'cero'
  if (n < 0) return `menos ${numberToSpanish(-n)}`

  const integer = Math.floor(n)
  const cents = Math.round((n - integer) * 100)

  let text = integerToSpanish(integer)
  text = text.charAt(0).toUpperCase() + text.slice(1)

  return `${text} con ${String(cents).padStart(2, '0')}/100`
}

function integerToSpanish(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cien'

  if (n < 10) return UNITS[n]
  if (n < 20) return TENS_SPECIAL[n - 10]
  if (n < 30) {
    const u = n % 10
    return u === 0 ? 'veinte' : `veinti${UNITS[u]}`
  }
  if (n < 100) {
    const t = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? TENS[t] : `${TENS[t]} y ${UNITS[u]}`
  }
  if (n < 1000) {
    const h = Math.floor(n / 100)
    const rest = n % 100
    return rest === 0 ? HUNDREDS[h] : `${HUNDREDS[h]} ${integerToSpanish(rest)}`
  }
  if (n < 1000000) {
    const thousands = Math.floor(n / 1000)
    const rest = n % 1000
    const prefix = thousands === 1 ? 'mil' : `${integerToSpanish(thousands)} mil`
    return rest === 0 ? prefix : `${prefix} ${integerToSpanish(rest)}`
  }

  return String(n)
}

// -------------------------------------------------------------------
// 1. Inventory control report (stock by branch)
// -------------------------------------------------------------------

export interface InventoryReportRow {
  code: string
  name: string
  stock: number
  category?: string
  cost?: number
  price?: number
}

export function generateInventoryPdf(input: {
  branchName: string
  rows: InventoryReportRow[]
}) {
  const doc = new jsPDF()
  const now = new Date()
  buildTitle(doc, 'Reporte de Inventario', `Sucursal: ${input.branchName} — ${fmtDateTime(now)}`)

  const body: RowData[] = input.rows.map((r, i) => [
    i + 1,
    r.code,
    r.name,
    r.category || '-',
    r.stock,
    fmtMoney(r.cost),
    fmtMoney(r.price),
  ])

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Código', 'Producto', 'Categoría', 'Stock', 'Costo', 'Precio']],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  addFooter(doc, `Inventario — ${input.branchName} — Generado: ${fmtDateTime(now)}`)
  savePdf(doc, `inventario_${input.branchName.replace(/\s+/g, '_')}`)
}

// -------------------------------------------------------------------
// 2. Inventory snapshot (stock-history / cierre)
// -------------------------------------------------------------------

export interface SnapshotReportItem {
  code: string
  name: string
  quantity: number
}

export function generateSnapshotPdf(input: {
  branchName: string
  snapshotType: string
  takenAt: string
  takenByName: string
  cashSessionId: string
  items: SnapshotReportItem[]
}) {
  const doc = new jsPDF()
  const label = input.snapshotType === 'open' ? 'Apertura' : 'Cierre'
  buildTitle(doc, `Reporte de ${label} de Caja`, `Sucursal: ${input.branchName}`)

  doc.setFontSize(9)
  doc.text(`Fecha: ${fmtDateTime(input.takenAt)}`, 14, 34)
  doc.text(`Registrado por: ${input.takenByName || 'N/A'}`, 14, 39)
  doc.text(`Sesión de caja: ${input.cashSessionId}`, 14, 44)

  const body: RowData[] = input.items.map((item, i) => [
    i + 1,
    item.code || '-',
    item.name || '-',
    item.quantity,
  ])

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Código', 'Producto', 'Cantidad']],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  const totalUnits = input.items.reduce((sum, item) => sum + item.quantity, 0)
  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 200
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total items: ${input.items.length} — Total unidades: ${totalUnits}`, 14, finalY + 10)

  addFooter(doc, `${label} de caja — ${input.branchName} — ${fmtDateTime(input.takenAt)}`)
  savePdf(doc, `snapshot_${label.toLowerCase()}_${input.branchName.replace(/\s+/g, '_')}`)
}

// -------------------------------------------------------------------
// 3. Exits report (salidas)
// -------------------------------------------------------------------

export interface ExitReportRow {
  code: string
  name: string
  quantity: number
  cost: number
  reason: string
  branchName: string
  date: string
  category?: string
}

export function generateExitsPdf(input: {
  branchName: string
  from?: string
  to?: string
  rows: ExitReportRow[]
}) {
  const doc = new jsPDF('landscape')
  const now = new Date()
  const dateRange = input.from || input.to
    ? `Desde: ${input.from || '—'} Hasta: ${input.to || '—'}`
    : 'Todos los registros'
  buildTitle(doc, 'Reporte de Salidas de Inventario', `${input.branchName} — ${dateRange}`)

  const body: RowData[] = input.rows.map((r, i) => [
    i + 1,
    r.code,
    r.name,
    r.quantity,
    `Bs ${fmtMoney(r.cost)}`,
    r.reason || '-',
    r.branchName,
  ])

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Código', 'Producto', 'Cantidad', 'Costo', 'Motivo', 'Sucursal']],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      5: { cellWidth: 50 },
    },
  })

  addFooter(doc, `Salidas — ${input.branchName} — Generado: ${fmtDateTime(now)}`)
  savePdf(doc, `salidas_${input.branchName.replace(/\s+/g, '_')}`)
}

// -------------------------------------------------------------------
// 4. Transfer confirmation PDF (traspaso)
// -------------------------------------------------------------------

export interface TransferConfirmationItem {
  name: string
  quantity: number
  priceOrigin: number
  priceDestination: number
}

export function generateTransferPdf(input: {
  transferNumber: string
  date: Date
  exchangeRate: number
  fromBranchName: string
  toBranchName: string
  items: TransferConfirmationItem[]
}) {
  const doc = new jsPDF()
  buildTitle(doc, 'NOTA DE CONSIGNACIÓN / TRASPASO')

  let y = 32
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nro. Traspaso: ${input.transferNumber}`, 14, y); y += 5
  doc.text(`Fecha: ${fmtDate(input.date)}`, 14, y)
  doc.text(`Hora: ${fmtTime(input.date)}`, 100, y); y += 5
  doc.text(`T.C: ${fmtMoney(input.exchangeRate, 4)}`, 14, y); y += 5
  doc.text(`Almacén Origen: ${input.fromBranchName}`, 14, y)
  doc.text(`Almacén Destino: ${input.toBranchName}`, 130, y); y += 8

  const body: RowData[] = input.items.map((item, i) => [
    i + 1,
    item.name,
    item.quantity,
    `Bs ${fmtMoney(item.priceOrigin)}`,
    `Bs ${fmtMoney(item.priceDestination)}`,
    `Bs ${fmtMoney(item.priceOrigin * item.quantity)}`,
    `Bs ${fmtMoney(item.priceDestination * item.quantity)}`,
  ])

  const totalOrigen = input.items.reduce((s, i) => s + i.priceOrigin * i.quantity, 0)
  const totalDestino = input.items.reduce((s, i) => s + i.priceDestination * i.quantity, 0)

  body.push(['', 'TOTAL', '', '', '', `Bs ${fmtMoney(totalOrigen)}`, `Bs ${fmtMoney(totalDestino)}`])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Producto', 'Cant.', 'Precio Origen', 'Precio Destino', 'Total Origen', 'Total Destino']],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 180

  // Observation
  const obsY = finalY + 10
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  const obsText = 'Observación: El "CONSIGNATARIO" estará obligado a la debida conservación de los bienes que le son entregados mediante este documento. En caso de su incumplimiento el "CONSIGNATARIO" estará obligado a reponer en efectivo el bien dañado al "CONSIGNANTE".'
  const lines = doc.splitTextToSize(obsText, 180)
  doc.text(lines, 14, obsY)

  // Signatures
  const sigY = obsY + lines.length * 4 + 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const sigWidth = 50
  const gap = (pageWidth - 28 - sigWidth * 3) / 2
  const positions = [14, 14 + sigWidth + gap, 14 + (sigWidth + gap) * 2]
  const labels = ['Elaborado por', 'VoBo Gerencia', 'Recibí Conforme']

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  for (let i = 0; i < 3; i++) {
    const x = positions[i]
    doc.line(x, sigY, x + sigWidth, sigY)
    doc.text(labels[i], x + sigWidth / 2, sigY + 5, { align: 'center' })
  }

  addFooter(doc, `Traspaso ${input.transferNumber} — ${fmtDateTime(input.date)}`)
  savePdf(doc, `traspaso_${input.transferNumber.slice(0, 8)}`)
}

// -------------------------------------------------------------------
// 5. Cash session close report (cierre de caja / POS)
// -------------------------------------------------------------------

export interface CashSessionSaleItem {
  code: string
  name: string
  quantity: number
  unit: string
  unitPrice: number
  totalBob: number
  totalUsd: number
}

export interface CashSessionSaleGroup {
  saleId: string
  date: string
  customer: string
  paymentMethod: string
  items: CashSessionSaleItem[]
  subtotalBob: number
  discount: number
  totalBob: number
  totalUsd: number
}

export function generateCashSessionPdf(input: {
  branchName: string
  sessionDate: string
  cashier: string
  exchangeRate: number
  sales: CashSessionSaleGroup[]
}) {
  const doc = new jsPDF('landscape')
  buildTitle(doc, 'Informe de Cierre de Caja', `Sucursal: ${input.branchName} — ${input.sessionDate}`)

  doc.setFontSize(9)
  doc.text(`Cajero: ${input.cashier}`, 14, 34)
  doc.text(`T.C: ${fmtMoney(input.exchangeRate, 4)}`, 130, 34)

  let startY = 40
  let globalItem = 0
  const allRows: RowData[] = []

  for (const sale of input.sales) {
    for (const item of sale.items) {
      globalItem++
      allRows.push([
        globalItem,
        item.code,
        item.name,
        item.quantity,
        item.unit || 'PZA',
        `Bs ${fmtMoney(item.unitPrice)}`,
        `$${fmtMoney(item.totalUsd)}`,
        `Bs ${fmtMoney(item.totalBob)}`,
      ])
    }
  }

  autoTable(doc, {
    startY,
    head: [['#', 'Código', 'Producto', 'Cant.', 'U.M.', 'P. Unit.', 'Total ($)', 'Total (Bs)']],
    body: allRows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 200

  const totalBob = input.sales.reduce((s, sale) => s + sale.totalBob, 0)
  const totalUsd = input.sales.reduce((s, sale) => s + sale.totalUsd, 0)
  const totalDiscount = input.sales.reduce((s, sale) => s + sale.discount, 0)
  const subtotal = totalBob + totalDiscount

  let ty = finalY + 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.text(`Subtotal: Bs ${fmtMoney(subtotal)}`, pageWidth - 14, ty, { align: 'right' }); ty += 5
  if (totalDiscount > 0) {
    doc.text(`Descuentos: - Bs ${fmtMoney(totalDiscount)}`, pageWidth - 14, ty, { align: 'right' }); ty += 5
  }
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL (Bs): Bs ${fmtMoney(totalBob)}`, pageWidth - 14, ty, { align: 'right' }); ty += 5
  doc.text(`TOTAL ($): $${fmtMoney(totalUsd)}`, pageWidth - 14, ty, { align: 'right' }); ty += 8

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text(`Son: ${numberToSpanish(totalBob)} Bolivianos`, 14, ty)

  addFooter(doc, `Cierre de caja — ${input.branchName} — ${input.sessionDate}`)
  savePdf(doc, `cierre_caja_${input.branchName.replace(/\s+/g, '_')}`)
}

// -------------------------------------------------------------------
// 6. Sale invoice PDF (factura individual)
// -------------------------------------------------------------------

export interface InvoiceItem {
  code?: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export function generateSaleInvoicePdf(input: {
  saleId: string
  date: string
  customer: string
  paymentMethod: string
  branchName: string
  cashier?: string
  items: InvoiceItem[]
  total: number
  exchangeRate?: number
}) {
  const doc = new jsPDF()
  buildTitle(doc, 'FACTURA DE VENTA')

  let y = 32
  doc.setFontSize(9)
  doc.text(`Nro. Venta: ${input.saleId}`, 14, y); y += 5
  doc.text(`Fecha: ${fmtDateTime(input.date)}`, 14, y); y += 5
  doc.text(`Cliente: ${input.customer}`, 14, y); y += 5
  doc.text(`Método de pago: ${input.paymentMethod}`, 14, y); y += 5
  doc.text(`Sucursal: ${input.branchName}`, 14, y)
  if (input.cashier) doc.text(`Cajero: ${input.cashier}`, 130, y)
  y += 8

  const body: RowData[] = input.items.map((item, i) => [
    i + 1,
    item.code || '-',
    item.name,
    item.quantity,
    `Bs ${fmtMoney(item.unitPrice)}`,
    `Bs ${fmtMoney(item.lineTotal)}`,
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Código', 'Producto', 'Cant.', 'P. Unit.', 'Total']],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? 180
  let ty = finalY + 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL: Bs ${fmtMoney(input.total)}`, doc.internal.pageSize.getWidth() - 14, ty, { align: 'right' })
  ty += 8
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(`Son: ${numberToSpanish(input.total)} Bolivianos`, 14, ty)

  if (input.exchangeRate && input.exchangeRate > 0) {
    ty += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`Total ($): $${fmtMoney(input.total / input.exchangeRate)} — T.C: ${fmtMoney(input.exchangeRate, 4)}`, 14, ty)
  }

  addFooter(doc, `Factura ${input.saleId} — ${input.branchName}`)
  savePdf(doc, `factura_${input.saleId.slice(0, 8)}`)
}

// -------------------------------------------------------------------
// 7. Transfer history report
// -------------------------------------------------------------------

export interface TransferHistoryReportRow {
  date: string
  type: string
  product: string
  code: string
  quantity: number
  fromBranch: string
  toBranch: string
  reason: string
}

export function generateTransferHistoryPdf(input: {
  branchName: string
  rows: TransferHistoryReportRow[]
}) {
  const doc = new jsPDF('landscape')
  const now = new Date()
  buildTitle(doc, 'Historial de Traspasos', `${input.branchName} — ${fmtDateTime(now)}`)

  const body: RowData[] = input.rows.map((r, i) => [
    i + 1,
    fmtDateTime(r.date),
    r.type,
    r.code,
    r.product,
    r.quantity,
    r.fromBranch,
    r.toBranch,
    r.reason || '-',
  ])

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Fecha', 'Operación', 'Código', 'Producto', 'Cant.', 'Origen', 'Destino', 'Motivo']],
    body,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  addFooter(doc, `Historial traspasos — ${input.branchName} — Generado: ${fmtDateTime(now)}`)
  savePdf(doc, `historial_traspasos_${input.branchName.replace(/\s+/g, '_')}`)
}

// -------------------------------------------------------------------
// 8. Entries report (ingresos)
// -------------------------------------------------------------------

export interface EntryReportRow {
  date: string
  code: string
  name: string
  quantity: number
  unitCost: number | null
  unitPrice: number | null
  supplier: string
  reference: string
  reason: string
  branchName: string
}

export function generateEntriesPdf(input: {
  branchName: string
  from?: string
  to?: string
  rows: EntryReportRow[]
}) {
  const doc = new jsPDF('landscape')
  const now = new Date()
  const dateRange = input.from || input.to
    ? `Desde: ${input.from || '—'} Hasta: ${input.to || '—'}`
    : 'Todos los registros'
  buildTitle(doc, 'Reporte de Ingresos de Inventario', `${input.branchName} — ${dateRange}`)

  const body: RowData[] = input.rows.map((r, i) => [
    i + 1,
    fmtDateTime(r.date),
    r.code,
    r.name,
    r.quantity,
    `Bs ${fmtMoney(r.unitCost)}`,
    `Bs ${fmtMoney(r.unitPrice)}`,
    r.supplier || '-',
    r.reason || '-',
  ])

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Fecha', 'Código', 'Producto', 'Cant.', 'Costo', 'Precio', 'Proveedor', 'Motivo']],
    body,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  addFooter(doc, `Ingresos — ${input.branchName} — Generado: ${fmtDateTime(now)}`)
  savePdf(doc, `ingresos_${input.branchName.replace(/\s+/g, '_')}`)
}

// -------------------------------------------------------------------
// 9. Generic history / control report
// -------------------------------------------------------------------

export function generateGenericHistoryPdf(input: {
  title: string
  subtitle: string
  columns: string[]
  rows: RowData[]
}) {
  const doc = new jsPDF('landscape')
  buildTitle(doc, input.title, input.subtitle)

  autoTable(doc, {
    startY: 34,
    head: [input.columns],
    body: input.rows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })

  const now = new Date()
  addFooter(doc, `${input.title} — Generado: ${fmtDateTime(now)}`)
  savePdf(doc, input.title.replace(/\s+/g, '_').toLowerCase())
}
