'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Download, Save, Share2, Sparkles, Video } from 'lucide-react'

import { PrometheusShell } from '@/components/prometheus-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { getJobStatus, getProject } from '@/lib/mock'
import type { DetectedScene, ProcessingJob, Project } from '@/lib/types'

function msToTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const ss = `${s % 60}`.padStart(2, '0')
  return `${m}:${ss}`
}

export default function EditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const projectId = params.id

  const [project, setProject] = React.useState<Project | null>(null)
  const [job, setJob] = React.useState<ProcessingJob | null>(null)
  const [selectedSceneId, setSelectedSceneId] = React.useState<string | null>(null)
  const [captionsEnabled, setCaptionsEnabled] = React.useState(true)
  const [pacing, setPacing] = React.useState([55])

  React.useEffect(() => {
    setProject(getProject(projectId))
    const tick = () => setJob(getJobStatus(projectId))
    tick()
    const t = window.setInterval(tick, 250)
    return () => window.clearInterval(t)
  }, [projectId])

  const scenes = job?.artifacts.scenes ?? []
  React.useEffect(() => {
    if (!selectedSceneId && scenes.length > 0) setSelectedSceneId(scenes[0]!.id)
  }, [selectedSceneId, scenes])

  const selectedScene: DetectedScene | null =
    scenes.find((s) => s.id === selectedSceneId) ?? null

  const totalMs = scenes.length > 0 ? scenes[scenes.length - 1]!.endMs : 60_000

  return (
    <PrometheusShell
      header={
        <header className="border-b border-purple-500/10 backdrop-blur-sm px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white/90">
              {project?.title ?? 'Project'}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/45">
              <Save className="size-3.5" />
              Autosave: <span className="text-white/60">mock</span>
              {job?.status === 'completed' ? (
                <Badge variant="success" className="ml-2">
                  Ready
                </Badge>
              ) : job?.status === 'running' ? (
                <Badge variant="warning" className="ml-2">
                  Processing
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/exports/${projectId}`)}>
              <Download className="size-4" />
              Export
            </Button>
            <Button variant="outline">
              <Share2 className="size-4" />
              Share
            </Button>
          </div>
        </header>
      }
    >
      <div className="px-8 py-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Preview</span>
                <Badge variant="secondary" className="shrink-0">
                  {selectedScene ? `${msToTime(selectedScene.startMs)}–${msToTime(selectedScene.endMs)}` : '—'}
                </Badge>
              </CardTitle>
              <CardDescription>Placeholder preview. Hook up a real player later.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-purple-500/10 flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Video className="size-5" />
                  Video preview
                </div>
                <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/70 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-purple-300" />
                    Captions: {captionsEnabled ? 'On' : 'Off'} · Pacing: {pacing[0]}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Scene track + highlight markers (mock).</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {scenes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/60">
                  No detected scenes yet. Run processing on the Overview page.
                </div>
              ) : (
                <div className="relative">
                  <div className="flex items-stretch gap-1">
                    {scenes.map((scene) => {
                      const w = Math.max(
                        6,
                        Math.round(((scene.endMs - scene.startMs) / totalMs) * 100),
                      )
                      const active = scene.id === selectedSceneId
                      return (
                        <button
                          key={scene.id}
                          onClick={() => setSelectedSceneId(scene.id)}
                          className={cn(
                            'h-12 rounded-lg border transition-colors',
                            active
                              ? 'border-purple-400/30 bg-purple-500/15'
                              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]',
                          )}
                          style={{ width: `${w}%` }}
                          title={scene.label}
                        />
                      )
                    })}
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 top-0 h-12">
                    {(job?.artifacts.highlights ?? []).map((h) => {
                      const left = Math.round((h.atMs / totalMs) * 100)
                      return (
                        <div
                          key={h.id}
                          className="absolute top-0 h-12 w-px bg-gradient-to-b from-fuchsia-300/70 via-purple-300/40 to-transparent"
                          style={{ left: `${left}%` }}
                          title={h.label}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Inspector</CardTitle>
            <CardDescription>Adjust the edit without leaving flow.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="captions">
              <TabsList className="w-full">
                <TabsTrigger value="captions" className="flex-1">
                  Captions
                </TabsTrigger>
                <TabsTrigger value="cuts" className="flex-1">
                  Cuts
                </TabsTrigger>
                <TabsTrigger value="broll" className="flex-1">
                  B-roll
                </TabsTrigger>
              </TabsList>

              <TabsContent value="captions" className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <div className="text-sm font-medium text-white/85">Enable captions</div>
                    <div className="mt-1 text-xs text-white/45">
                      Tied to caption intensity in templates later.
                    </div>
                  </div>
                  <Switch checked={captionsEnabled} onCheckedChange={setCaptionsEnabled} />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white/85">Caption density</div>
                  <div className="mt-1 text-xs text-white/45">
                    UI-only: wire to caption generator.
                  </div>
                  <div className="mt-4">
                    <Slider value={pacing} onValueChange={setPacing} max={100} step={1} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cuts" className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white/85">Pacing</div>
                  <div className="mt-1 text-xs text-white/45">
                    Snappier cuts increase momentum, but reduce breathing room.
                  </div>
                  <div className="mt-4">
                    <Slider value={pacing} onValueChange={setPacing} max={100} step={1} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="broll" className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white/85">Suggestions</div>
                  <div className="mt-1 text-xs text-white/45">
                    {job?.artifacts.brollSuggestions.length
                      ? 'Mock suggestions from the pipeline.'
                      : 'Run processing to populate suggestions.'}
                  </div>
                  <div className="mt-4 space-y-2">
                    {(job?.artifacts.brollSuggestions ?? []).slice(0, 5).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70"
                      >
                        <span className="truncate">{s.query}</span>
                        <span className="shrink-0 tabular-nums text-white/45">
                          {Math.round(s.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PrometheusShell>
  )
}

