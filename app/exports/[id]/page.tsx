'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { Download, Frame, Sparkles } from 'lucide-react'

import { PrometheusShell } from '@/components/prometheus-shell'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { getProject } from '@/lib/mock'

export default function ExportPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const project = getProject(projectId)

  const [split, setSplit] = React.useState([52])
  const [preset, setPreset] = React.useState<'9:16' | '1:1' | '16:9'>('9:16')
  const [watermark, setWatermark] = React.useState(true)

  const beforeWidth = split[0] ?? 50

  return (
    <PrometheusShell
      header={
        <PageHeader
          title="Export"
          description={project ? `Project: ${project.title}` : 'Export presets and comparisons.'}
          actions={
            <Button className="bg-white text-black hover:bg-white/90">
              <Download className="size-4" />
              Export (Mock)
            </Button>
          }
        />
      }
    >
      <div className="px-8 py-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Before / After</CardTitle>
            <CardDescription>Slider mock (wire to renders later).</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-white/[0.06]" />
              <div className="absolute inset-0 flex">
                <div className="relative h-full" style={{ width: `${beforeWidth}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-white/[0.01] to-transparent" />
                  <div className="absolute left-3 top-3">
                    <Badge variant="secondary">Before</Badge>
                  </div>
                </div>
                <div className="relative h-full flex-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-white/[0.01] to-transparent" />
                  <div className="absolute right-3 top-3">
                    <Badge variant="success">After</Badge>
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 w-px bg-white/40" style={{ left: `${beforeWidth}%` }} />
              <div
                className="absolute inset-y-0 -ml-3 flex w-6 items-center justify-center"
                style={{ left: `${beforeWidth}%` }}
              >
                <div className="h-10 w-6 rounded-full border border-white/20 bg-black/60 backdrop-blur-md shadow-lg" />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-white/50">Drag to compare</div>
              <div className="mt-3">
                <Slider value={split} onValueChange={setSplit} max={100} step={1} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presets</CardTitle>
              <CardDescription>Choose aspect ratio (mock).</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {(['9:16', '1:1', '16:9'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors',
                    preset === p
                      ? 'border-purple-400/30 bg-purple-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white/85">{p}</div>
                    {preset === p ? (
                      <Badge variant="success">Selected</Badge>
                    ) : (
                      <Badge variant="secondary">Preset</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    Optimized export pipeline placeholder.
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Watermark</CardTitle>
              <CardDescription>UI-only premium options.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <Frame className="size-4 text-white/60" />
                  <div>
                    <div className="text-sm font-medium text-white/85">Enable watermark</div>
                    <div className="mt-1 text-xs text-white/45">Preview overlay in player.</div>
                  </div>
                </div>
                <Switch checked={watermark} onCheckedChange={setWatermark} />
              </div>
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-white/[0.02] to-fuchsia-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white/85">
                  <Sparkles className="size-4 text-purple-300" />
                  Premium export (mock)
                </div>
                <div className="mt-1 text-xs text-white/45">
                  Higher bitrate, loudness normalization, and caption burn-in options later.
                </div>
                <div className="mt-3">
                  <Button variant="outline" className="w-full">
                    Upgrade to unlock
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PrometheusShell>
  )
}

