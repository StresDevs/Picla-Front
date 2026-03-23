'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { CreditsSubnav } from '@/components/modules/credits/credits-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function CreditsNewPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader title="Nuevo Crédito" description="Registro base de crédito con plazo, pago parcial y observaciones" />
        <CreditsSubnav />

        <Card className="border-sky-500/45 bg-zinc-950/70">
          <CardHeader>
            <CardTitle className="text-zinc-100">Formulario de crédito</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2"><Label>Cliente</Label><Input placeholder="Nombre completo" /></div>
            <div className="space-y-2"><Label>Producto</Label><Input placeholder="Mercadería a crédito" /></div>
            <div className="space-y-2"><Label>Almacén origen</Label><Input placeholder="Sucursal / Bodega" /></div>
            <div className="space-y-2"><Label>Vendedor</Label><Input placeholder="Nombre" /></div>
            <div className="space-y-2"><Label>Precio total</Label><Input type="number" placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Pago inicial</Label><Input type="number" placeholder="0.00" /></div>
            <div className="space-y-2"><Label>Días plazo</Label><Input type="number" placeholder="10" /></div>
            <div className="space-y-2"><Label>Fecha recordatorio</Label><Input type="date" /></div>
            <div className="space-y-2 md:col-span-4"><Label>Observaciones</Label><Input placeholder="Condiciones del crédito" /></div>
            <Button className="md:col-span-4">Registrar crédito</Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
