import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <Card interactive={false} className={`bg-[hsl(348_39%_18%)] border-[hsl(352_24%_72%)] shadow-[0_10px_22px_hsl(352_65%_6%_/_0.35)] ring-0 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-zinc-200/85">{label}</p>
            <p className="text-2xl font-bold text-zinc-50 mt-3">{value}</p>
            {trend && (
              <p
                className={`text-xs font-medium mt-2 ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="bg-zinc-900/35 ring-1 ring-zinc-100/25 p-3 rounded-xl">
            <Icon className="w-6 h-6 text-zinc-50" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
