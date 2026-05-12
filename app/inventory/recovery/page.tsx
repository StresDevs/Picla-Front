'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PageHeader } from '@/components/common/page-header'
import { InventorySubnav } from '@/components/modules/inventory/inventory-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { branchesService, partsService } from '@/lib/supabase/inventory'
import { ACTIVE_ROLE_EVENT, getActiveUserContext, type AppUserRole } from '@/lib/mock/runtime-store'
import type { Part } from '@/types/database'

interface BranchOption {
  id: string
  name: string
}

export default function InventoryRecoveryPage() {
  const [activeRole, setActiveRole] = useState<AppUserRole>(() => getActiveUserContext().role)
  const [inactiveParts, setInactiveParts] = useState<Part[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const canRestore = activeRole === 'admin'

  const branchNameById = useMemo(() => {
    return new Map(branches.map((branch) => [branch.id, branch.name]))
  }, [branches])

  const filteredParts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return inactiveParts

    return inactiveParts.filter((part) => {
      const name = part.name.toLowerCase()
      const code = part.code.toLowerCase()
      const category = (part.category || '').toLowerCase()
      return name.includes(term) || code.includes(term) || category.includes(term)
    })
  }, [inactiveParts, searchTerm])

  useEffect(() => {
    const syncRole = () => {
      setActiveRole(getActiveUserContext().role)
    }

    syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncRole)
    window.addEventListener('focus', syncRole)

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncRole)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  useEffect(() => {
    const loadInactive = async () => {
      setIsLoading(true)
      setError(null)
      setFeedback(null)

      try {
        const [branchRows, inactive] = await Promise.all([
          branchesService.getAll(),
          canRestore ? partsService.getInactive() : Promise.resolve([]),
        ])
        setBranches(branchRows)
        setInactiveParts(inactive)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar productos desactivados')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInactive()
  }, [canRestore])

  const handleRestore = async (partId: string) => {
    if (!canRestore) return

    setIsRestoringId(partId)
    setError(null)
    setFeedback(null)

    try {
      await partsService.restore(partId)
      setInactiveParts((prev) => prev.filter((part) => part.id !== partId))
      setFeedback('Producto restaurado correctamente.')
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'No se pudo restaurar el producto')
    } finally {
      setIsRestoringId(null)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Recuperar productos"
          description="Administra productos desactivados y restauralos en la sucursal correspondiente."
        />
        <InventorySubnav />

        {!canRestore ? (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6 text-sm text-amber-700 dark:text-amber-300">
              Solo el rol admin puede recuperar productos. Tu rol actual es: {activeRole}.
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-500/40 bg-red-500/5">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        ) : null}

        {feedback ? (
          <Card className="border-primary/25 bg-primary/10">
            <CardContent className="pt-6 text-sm text-primary">{feedback}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Productos desactivados</CardTitle>
            <CardDescription>Busca por nombre, codigo o categoria y restaura el producto deseado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative max-w-md w-full">
                <Input
                  placeholder="Buscar por nombre, codigo o categoria"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Badge className="bg-primary/15 text-primary">
                {isLoading ? 'Cargando...' : `${filteredParts.length} productos`}
              </Badge>
            </div>

            <div className="rounded-xl border border-border/70 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Precio venta</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">Cargando productos...</TableCell>
                    </TableRow>
                  ) : filteredParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">
                        No hay productos desactivados que coincidan con el filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium">{part.name}</p>
                            <p className="text-xs text-muted-foreground">{part.code}</p>
                          </div>
                        </TableCell>
                        <TableCell>{part.category || '-'}</TableCell>
                        <TableCell>{branchNameById.get(part.branch_id) || part.branch_id}</TableCell>
                        <TableCell>Bs {part.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => void handleRestore(part.id)}
                            disabled={!canRestore || isRestoringId === part.id}
                          >
                            {isRestoringId === part.id ? 'Restaurando...' : 'Restaurar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
