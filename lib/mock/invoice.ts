interface InvoiceLine {
  name: string
  quantity: number
  unitPrice: number
}

interface PrintInvoiceParams {
  invoiceNumber: string
  customerName: string
  branchName: string
  cashierName: string
  paymentMethod: string
  currency: 'BOB' | 'USD'
  total: number
  lines: InvoiceLine[]
  createdAt?: string
  isCredit?: boolean
  notes?: string
}

function formatCurrency(amount: number, currency: 'BOB' | 'USD') {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`
  }

  return `Bs ${amount.toFixed(2)}`
}

export function printMockInvoice(params: PrintInvoiceParams) {
  if (typeof window === 'undefined') return

  const createdAt = params.createdAt || new Date().toISOString()
  const issueDate = new Date(createdAt).toLocaleString('es-BO')

  const rows = params.lines
    .map((line, index) => {
      const lineTotal = line.quantity * line.unitPrice
      return `
        <tr>
          <td style="text-align:center;">${index + 1}</td>
          <td>${line.name}</td>
          <td style="text-align:center;">${line.quantity}</td>
          <td style="text-align:right;">${formatCurrency(line.unitPrice, params.currency)}</td>
          <td style="text-align:right;">${formatCurrency(lineTotal, params.currency)}</td>
        </tr>
      `
    })
    .join('')

  const creditBadge = params.isCredit
    ? `<div class="credit-badge">&#9888; VENTA A CRÉDITO</div>`
    : ''

  const notesSection = params.notes
    ? `<div class="notes"><strong>Notas:</strong> ${params.notes}</div>`
    : ''

  const invoiceHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Recibo de venta ${params.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
          h1 { margin: 0 0 8px; color: #9f1239; }
          .meta { font-size: 13px; margin-bottom: 12px; }
          .credit-badge { display: inline-block; margin-bottom: 10px; background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 13px; }
          th { background: #ffe4e6; text-align: left; }
          th:first-child, th:nth-child(3) { text-align: center; }
          th:nth-child(4), th:nth-child(5) { text-align: right; }
          .total-row { margin-top: 14px; display: flex; justify-content: flex-end; }
          .total { font-size: 18px; font-weight: bold; color: #9f1239; text-align: right; }
          .notes { margin-top: 12px; font-size: 13px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 12px; border-radius: 4px; }
          .footer { margin-top: 24px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Picla - Recibo de venta</h1>
        ${creditBadge}
        <div class="meta">
          <div><strong>Nro. Venta:</strong> ${params.invoiceNumber}</div>
          <div><strong>Fecha:</strong> ${issueDate}</div>
          <div><strong>Cliente:</strong> ${params.customerName}</div>
          <div><strong>Sucursal:</strong> ${params.branchName}</div>
          <div><strong>Vendedor:</strong> ${params.cashierName}</div>
          <div><strong>Método de pago:</strong> ${params.paymentMethod}${params.isCredit ? ' (Crédito)' : ''}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th style="text-align:right;">Precio Unitario</th>
              <th style="text-align:right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        ${notesSection}

        <div class="total-row">
          <div class="total">Total: ${formatCurrency(params.total, params.currency)}</div>
        </div>
        <div class="footer">Recibo mock de demostración.</div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(invoiceHtml)
  printWindow.document.close()
}
