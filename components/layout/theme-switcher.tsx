'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {!mounted ? (
        <>
          <Moon className="w-5 h-5" />
          <span>Cambiar tema</span>
        </>
      ) : isDark ? (
        <>
          <Sun className="w-5 h-5" />
          <span>Modo claro</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5" />
          <span>Modo oscuro</span>
        </>
      )}
    </Button>
  )
}
