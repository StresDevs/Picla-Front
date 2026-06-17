interface InvoiceLine {
  code?: string
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
  pendingDeliveryItems?: string[]
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
  const issueDate = new Date(createdAt).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const rows = params.lines
    .map((line, index) => {
      const lineTotal = line.quantity * line.unitPrice
      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td class="center">${line.code || '-'}</td>
          <td>${line.name}</td>
          <td class="center">${line.quantity}</td>
          <td class="right">${formatCurrency(line.unitPrice, params.currency)}</td>
          <td class="right"><strong>${formatCurrency(lineTotal, params.currency)}</strong></td>
        </tr>
      `
    })
    .join('')

  const badges: string[] = []
  if (params.isCredit) {
    badges.push(`<span class="badge badge-credit">&#9888; VENTA A CRÉDITO</span>`)
  }
  if (params.pendingDeliveryItems && params.pendingDeliveryItems.length > 0) {
    badges.push(`<span class="badge badge-delivery">&#128666; ENTREGA PENDIENTE</span>`)
  }
  const badgesHtml = badges.length > 0 ? `<div class="badges">${badges.join('')}</div>` : ''

  const notesSection = params.notes
    ? `<div class="notes-box"><span class="notes-label">Notas del crédito:</span> ${params.notes}</div>`
    : ''

  const pendingDeliverySection =
    params.pendingDeliveryItems && params.pendingDeliveryItems.length > 0
      ? `<div class="pending-box">
          <div class="pending-title">&#128666; Productos pendientes de entrega</div>
          <div class="pending-subtitle">Los siguientes productos serán entregados en una fecha posterior:</div>
          ${params.pendingDeliveryItems
            .map((name) => `<div class="pending-item">• ${name}</div>`)
            .join('')}
        </div>`
      : ''

  const invoiceHtml = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Recibo ${params.invoiceNumber} — Picla</title>
  <style>
    @media print {
      body { margin: 0; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      padding: 28px 32px;
      color: #1f2937;
      max-width: 820px;
      margin: 0 auto;
      font-size: 13px;
    }

    /* HEADER */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 3px solid #9f1239;
      margin-bottom: 18px;
    }
    .company { font-size: 26px; font-weight: 800; color: #9f1239; letter-spacing: -0.5px; }
    .receipt-type { font-size: 12px; color: #6b7280; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.06em; }
    .receipt-num-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; text-align: right; }
    .receipt-num { font-size: 30px; font-weight: 800; color: #111827; text-align: right; line-height: 1; margin-top: 2px; }

    /* BADGES */
    .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 5px; font-size: 12px; font-weight: 700;
      border-width: 1px; border-style: solid;
    }
    .badge-credit { background: #fef3c7; border-color: #f59e0b; color: #92400e; }
    .badge-delivery { background: #dbeafe; border-color: #3b82f6; color: #1e40af; }

    /* META GRID */
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 28px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 7px;
      padding: 13px 16px;
      margin-bottom: 18px;
    }
    .meta-row { display: flex; gap: 6px; align-items: baseline; }
    .meta-label { color: #6b7280; white-space: nowrap; font-size: 12px; }
    .meta-value { font-weight: 600; color: #111827; }

    /* TABLE */
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    thead { background: #fef2f2; }
    th {
      border: 1px solid #e5e7eb;
      padding: 9px 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #374151;
    }
    th.center { text-align: center; }
    th.right { text-align: right; }
    td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: middle; }
    td.center { text-align: center; }
    td.right { text-align: right; }
    tr:nth-child(even) td { background: #fafafa; }

    /* BOXES */
    .pending-box {
      margin: 14px 0;
      padding: 12px 14px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
    }
    .pending-title { font-weight: 700; color: #1d4ed8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .pending-subtitle { color: #3b82f6; font-size: 12px; margin-bottom: 7px; }
    .pending-item { color: #1e40af; padding: 2px 0; font-size: 13px; }

    .notes-box {
      margin: 12px 0;
      padding: 10px 14px;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 6px;
    }
    .notes-label { font-weight: 700; color: #92400e; margin-right: 4px; }

    /* TOTAL */
    .total-section { display: flex; justify-content: flex-end; margin: 16px 0 8px; }
    .total-box {
      border: 2px solid #9f1239;
      border-radius: 7px;
      padding: 10px 22px;
      text-align: right;
      min-width: 200px;
    }
    .total-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin-bottom: 2px; }
    .total-amount { font-size: 26px; font-weight: 800; color: #9f1239; }

    /* FOOTER */
    .footer {
      margin-top: 22px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="company">Picla</div>
      <div class="receipt-type">Comprobante de Venta</div>
    </div>
    <div>
      <div class="receipt-num-label">Nro. Venta</div>
      <div class="receipt-num">${params.invoiceNumber}</div>
    </div>
  </div>

  ${badgesHtml}

  <div class="meta">
    <div class="meta-row">
      <span class="meta-label">Fecha:</span>
      <span class="meta-value">${issueDate}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Sucursal:</span>
      <span class="meta-value">${params.branchName}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Cliente:</span>
      <span class="meta-value">${params.customerName}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Funcionario:</span>
      <span class="meta-value">${params.cashierName}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Método de pago:</span>
      <span class="meta-value">${params.paymentMethod}${params.isCredit ? ' — Crédito' : ''}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Moneda:</span>
      <span class="meta-value">${params.currency}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="center" style="width:40px">#</th>
        <th class="center" style="width:80px">Código</th>
        <th>Producto</th>
        <th class="center" style="width:70px">Cant.</th>
        <th class="right" style="width:120px">P. Unitario</th>
        <th class="right" style="width:120px">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  ${pendingDeliverySection}
  ${notesSection}

  <div class="total-section">
    <div class="total-box">
      <div class="total-label">Total</div>
      <div class="total-amount">${formatCurrency(params.total, params.currency)}</div>
    </div>
  </div>

  <div class="footer">
    Gracias por su compra &nbsp;·&nbsp; Generado por Picla POS
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return

  printWindow.document.open()
  printWindow.document.write(invoiceHtml)
  printWindow.document.close()
}
