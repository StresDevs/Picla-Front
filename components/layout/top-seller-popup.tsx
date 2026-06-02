'use client'

import { useEffect, useState } from 'react'
import { Trophy, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { posService, type TopSellerRecord } from '@/lib/supabase/pos'
import { ACTIVE_ROLE_EVENT, getActiveUserContext } from '@/lib/mock/runtime-store'

export function TopSellerPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [sellers, setSellers] = useState<TopSellerRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeRole, setActiveRole] = useState(() => getActiveUserContext().role)

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

  if (activeRole !== 'admin' && activeRole !== 'manager') return null

  const fetchSellers = async () => {
    setIsLoading(true)
    setSellers([])
    try {
      const result = await posService.getTopSellers({ limit: 5 })
      setSellers(result)
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = () => {
    if (!isOpen) void fetchSellers()
    setIsOpen((prev) => !prev)
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 rounded-2xl border border-border/70 bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold">Top Vendedores</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => void fetchSellers()}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                aria-label="Actualizar"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                Calculando...
              </div>
            ) : sellers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Sin datos de ventas disponibles.</p>
            ) : (
              sellers.map((seller, index) => (
                <div
                  key={`${seller.seller_id}-${seller.branch_id}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${index === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted/30'}`}
                >
                  <span className="text-base leading-none">{medals[index] ?? `${index + 1}.`}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{seller.seller_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{seller.branch_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{seller.sales_count}</p>
                    <p className="text-[10px] text-muted-foreground">ventas</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <Button
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-amber-500 hover:bg-amber-600 text-white border-0"
        onClick={handleToggle}
        title="Top Vendedores"
      >
        <Trophy className="h-5 w-5" />
      </Button>
    </div>
  )
}
