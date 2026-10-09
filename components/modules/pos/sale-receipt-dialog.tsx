'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { buildInvoiceHtml, printMockInvoice, type PrintInvoiceParams } from '@/lib/mock/invoice'
import { toast } from '@/hooks/use-toast'

export function SaleReceiptDialog({ receipt, onClose }: { receipt: PrintInvoiceParams | null; onClose: () => void }) {
  const html = useMemo(() => receipt ? buildInvoiceHtml(receipt) : '', [receipt])
  return (
    <Dialog open={!!receipt} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-4xl max-h-[95svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comprobante de venta {receipt?.invoiceNumber}</DialogTitle>
          <DialogDescription>La venta fue registrada. Puedes revisar e imprimir el comprobante.</DialogDescription>
        </DialogHeader>
        <iframe title="Comprobante de venta" srcDoc={html} sandbox="" className="h-[65vh] w-full rounded border bg-white" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={() => {
            if (receipt && !printMockInvoice(receipt)) {
              toast({ title: 'Habilita las ventanas emergentes', description: 'El navegador bloqueó la ventana de impresión. Habilítala y vuelve a pulsar Imprimir.', variant: 'destructive' })
            }
          }}>Imprimir comprobante</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
