'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Search } from 'lucide-react'

import { PrometheusShell } from '@/components/prometheus-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { createProject, listProjects } from '@/lib/mock'
import type { Project, ProjectStatus } from '@/lib/types'

const FILTERS: Array<{ label: string; value: 'all' | ProjectStatus }> = [
  { label: 'All', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Exported', value: 'exported' },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]['value']>('all')
  const [projects, setProjects] = React.useState<Project[]>([])

  React.useEffect(() => {
    setProjects(listProjects())
  }, [])

  const filtered = projects
    .filter((p) => (filter === 'all' ? true : p.status === filter))
    .filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <PrometheusShell
      header={
        <PageHeader
          title="Projects"
          description="Organize runs, iterate edits, and jump into the editor."
          actions={
            <>
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects…"
                  className="pl-9 w-[320px]"
                />
              </div>
              <Button
                onClick={() => {
                  const project = createProject({ title: 'New PROMETHEUS Project' })
                  router.push(`/editor/${project.id}`)
                }}
                className="bg-white text-black hover:bg-white/90"
              >
                <Plus className="size-4" />
                New Project
              </Button>
            </>
          }
        />
      }
    >
      <div className="px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                filter === f.value
                  ? 'border-purple-400/30 bg-purple-500/10 text-white'
                  : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white/80',
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative md:hidden w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <div className="text-sm text-white/70">No projects yet.</div>
              <div className="mt-2 text-xs text-white/45">
                Start with a quick upload on the Overview page.
              </div>
              <div className="mt-6 flex justify-center">
                <Button onClick={() => router.push('/')} variant="outline">
                  Go to Overview
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/editor/${p.id}`)}
                className="text-left"
              >
                <Card className="group h-full transition-colors hover:bg-white/[0.05]">
                  <CardContent className="p-5 space-y-4">
                    <div className="h-32 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-purple-500/10" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {p.title}
                        </div>
                        <div className="mt-1 text-xs text-white/45">
                          {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge
                        variant={
                          p.status === 'ready'
                            ? 'success'
                            : p.status === 'processing'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </PrometheusShell>
  )
}

