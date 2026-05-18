interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 mb-8 pb-4 border-b border-border/60 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-3xl">{description}</p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  )
}
