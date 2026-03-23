'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Card className="bg-card/95 border-border/70">
        <div className="p-8 text-center text-muted-foreground">
          Cargando datos...
        </div>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-card/95 border-border/70">
        <div className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-card/95 border-border/70 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-primary/5">
            {columns.map((column) => (
              <TableHead key={String(column.key)} className="text-foreground">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="border-border hover:bg-primary/6 transition-colors">
              {columns.map((column) => (
                <TableCell
                  key={`${row.id}-${String(column.key)}`}
                  className="text-foreground"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
