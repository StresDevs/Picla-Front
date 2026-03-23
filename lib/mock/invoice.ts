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
    .map((line) => {
      const lineTotal = line.quantity * line.unitPrice
      return `
        <tr>
          <td>${line.name}</td>
          <td style="text-align:center;">${line.quantity}</td>
          <td style="text-align:right;">${formatCurrency(line.unitPrice, params.currency)}</td>
          <td style="text-align:right;">${formatCurrency(lineTotal, params.currency)}</td>
        </tr>
      `
    })
    .join('')

  const invoiceHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Factura ${params.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
          h1 { margin: 0 0 8px; color: #9f1239; }
          .meta { font-size: 13px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 13px; }
          th { background: #ffe4e6; text-align: left; }
          .total { margin-top: 14px; font-size: 18px; font-weight: bold; color: #9f1239; }
          .footer { margin-top: 24px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Picla - Factura</h1>
        <div class="meta">
          <div><strong>Nro:</strong> ${params.invoiceNumber}</div>
          <div><strong>Fecha:</strong> ${issueDate}</div>
          <div><strong>Cliente:</strong> ${params.customerName}</div>
          <div><strong>Sucursal:</strong> ${params.branchName}</div>
          <div><strong>Vendedor:</strong> ${params.cashierName}</div>
          <div><strong>Método de pago:</strong> ${params.paymentMethod}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="total">Total: ${formatCurrency(params.total, params.currency)}</div>
        <div class="footer">Documento mock de demostración.</div>

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
