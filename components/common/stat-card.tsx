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
    <Card className={`bg-card/95 border-border/70 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
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
          <div className="bg-primary/12 ring-1 ring-primary/20 p-3 rounded-xl">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
