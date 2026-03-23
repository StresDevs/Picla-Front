interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8 pb-4 border-b border-border/60">
      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
