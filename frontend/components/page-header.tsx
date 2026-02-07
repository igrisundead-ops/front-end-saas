'use client'

import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'border-b border-purple-500/10 backdrop-blur-sm px-8 py-6 flex items-center justify-between gap-6',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white/90">
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-white/50">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

