'use client'

import * as React from 'react'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Part } from '@/types/database'

export interface StringPickOption {
  value: string
  label: string
}

interface PartComboboxProps {
  parts: Part[]
  value: string
  onValueChange: (partId: string) => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function PartCombobox({
  parts,
  value,
  onValueChange,
  disabled,
  placeholder = 'Seleccionar producto',
  searchPlaceholder = 'Buscar por nombre o código...',
  emptyText = 'Ningún producto coincide.',
  className,
}: PartComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parts.find((p) => p.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || parts.length === 0}
          className={cn(
            'h-auto min-h-9 w-max min-w-full justify-between border-slate-300 bg-white px-3 py-2 font-normal text-sm text-slate-900 shadow-xs hover:bg-slate-50 dark:bg-input/30 dark:border-input dark:text-foreground dark:hover:bg-input/50',
            !selected && 'text-slate-400 dark:text-muted-foreground',
            className,
          )}
        >
          <span className="text-left whitespace-nowrap leading-snug">
            {selected
              ? `${selected.name} (${selected.code})`
              : parts.length === 0
                ? 'Sin productos'
                : placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] w-max max-w-[90vw] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {parts.map((part) => (
                <CommandItem
                  key={part.id}
                  value={`${part.name} ${part.code} ${part.id}`}
                  onSelect={() => {
                    onValueChange(part.id)
                    setOpen(false)
                  }}
                  className="items-start gap-2 border-b border-border/60 py-2 last:border-b-0"
                >
                  <CheckIcon
                    className={cn(
                      'size-4 shrink-0 mt-0.5',
                      value === part.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="min-w-max">
                    <p className="text-sm font-medium leading-snug whitespace-nowrap">
                      {part.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{part.code}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface SearchableStringPickProps {
  options: StringPickOption[]
  value: string
  onValueChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function SearchableStringPick({
  options,
  value,
  onValueChange,
  disabled,
  placeholder = 'Seleccionar…',
  searchPlaceholder = 'Escribir para filtrar…',
  emptyText = 'Sin coincidencias.',
  className,
}: SearchableStringPickProps) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || options.length === 0}
          className={cn(
            'h-auto min-h-9 w-max min-w-full justify-between border-slate-300 bg-white px-3 py-2 font-normal text-sm text-slate-900 shadow-xs hover:bg-slate-50 dark:bg-input/30 dark:border-input dark:text-foreground dark:hover:bg-input/50',
            !selected && 'text-slate-400 dark:text-muted-foreground',
            className,
          )}
        >
          <span className="text-left whitespace-nowrap leading-snug">{selected?.label ?? placeholder}</span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[var(--radix-popover-trigger-width)] w-max max-w-[90vw] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  onSelect={() => {
                    onValueChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon className={cn('size-4 shrink-0', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-max whitespace-nowrap">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
