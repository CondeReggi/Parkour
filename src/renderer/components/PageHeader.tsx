import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: Props) {
  return (
    <header className="flex items-start justify-between gap-4 pb-6 mb-6 border-b border-border">
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-shrink-0 items-center gap-2">{children}</div>}
    </header>
  )
}
