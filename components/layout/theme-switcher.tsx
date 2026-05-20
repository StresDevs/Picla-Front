'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

interface ThemeSwitcherProps {
  collapsed?: boolean
}

export function ThemeSwitcher({ collapsed = false }: ThemeSwitcherProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'
  const label = !mounted ? 'Cambiar tema' : isDark ? 'Modo claro' : 'Modo oscuro'
  const Icon = !mounted ? Moon : isDark ? Sun : Moon

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        title={label}
        aria-label={label}
        className="h-10 w-10 mx-auto text-sidebar-foreground hover:bg-sidebar-accent"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        <Icon className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Button>
  )
}
