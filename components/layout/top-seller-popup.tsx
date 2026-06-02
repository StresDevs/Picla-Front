'use client'

import { useEffect, useState } from 'react'
import { Trophy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { posService } from '@/lib/supabase/pos'
import { getSupabaseClient } from '@/lib/supabase/client'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

interface TopSeller {
  name: string
  branchName: string
  count: number
}

export function TopSellerPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [topSeller, setTopSeller] = useState<TopSeller | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)
  const [branchMap, setBranchMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const syncRole = () => setActiveRole(getActiveUserContext().role)
    syncRole()
    window.addEventListener(ACTIVE_ROLE_EVENT, syncRole)
    window.addEventListener('focus', syncRole)
    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, syncRole)
      window.removeEventListener('focus', syncRole)
    }
  }, [])

  useEffect(() => {
    const fetchBranches = async () => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from('branches').select('id, name')
      if (data) {
        const map: Record<string, string> = {}
        for (const b of data as Array<{ id: string; name: string }>) {
          map[b.id] = b.name
        }
        setBranchMap(map)
      }
    }
    void fetchBranches()
  }, [])

  if (activeRole !== 'admin' && activeRole !== 'manager') return null

  const fetchTopSeller = async () => {
    setIsLoading(true)
    setTopSeller(null)
    try {
      const sales = await posService.getSales(null, false)
      const counts: Record<string, { name: string; branchId: string; count: number }> = {}
      for (const sale of sales) {
        if (!sale.sold_by) continue
        const key = `${sale.sold_by}|${sale.branch_id}`
        if (!counts[key]) {
          counts[key] = { name: sale.sold_by, branchId: sale.branch_id, count: 0 }
        }
        counts[key].count++
      }
      const top = Object.values(counts).sort((a, b) => b.count - a.count)[0]
      if (top) {
        setTopSeller({
          name: top.name,
          branchName: branchMap[top.branchId] || top.branchId || '—',
          count: top.count,
        })
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      void fetchTopSeller()
    }
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-72 rounded-2xl border border-border/70 bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold">Top Vendedor</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                Calculando...
              </div>
            ) : topSeller ? (
              <div className="space-y-2">
                <p className="text-base font-bold leading-tight">{topSeller.name}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Sucursal: <span className="font-medium text-foreground">{topSeller.branchName}</span></p>
                  <p>Ventas realizadas: <span className="font-semibold text-primary">{topSeller.count}</span></p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin datos de ventas disponibles.</p>
            )}
          </div>
        </div>
      )}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-amber-500 hover:bg-amber-600 text-white border-0"
        onClick={handleToggle}
        title="Top Vendedor"
      >
        <Trophy className="h-5 w-5" />
      </Button>
    </div>
  )
}
