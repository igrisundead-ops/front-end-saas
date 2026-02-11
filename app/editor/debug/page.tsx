'use client'

import * as React from 'react'
import Link from 'next/link'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { PrometheusShell } from '@/components/prometheus-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { TranscriptRenderer } from '@/src/textfx/transcript/TranscriptRenderer'
import type { TranscriptToken } from '@/lib/types/transcript'

type PreviewMode = 'default' | 'headline' | 'caption'

function msToTime(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const ss = `${s % 60}`.padStart(2, '0')
  return `${m}:${ss}`
}

export default function EditorDebugPage() {
  const tokens = React.useMemo<TranscriptToken[]>(() => [], [])
  const [playheadMs, setPlayheadMs] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(true)
  const [enableFocus, setEnableFocus] = React.useState(true)
  const [enableRotate, setEnableRotate] = React.useState(true)
  const [previewMode, setPreviewMode] = React.useState<PreviewMode>('default')

  const lastFrameRef = React.useRef<number | null>(null)
  const previewDurationMs = Math.max(tokens[tokens.length - 1]?.endMs ?? 10_000, 10_000)

  React.useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null
      return
    }

    let rafId = 0
    const tick = (now: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now
      const delta = now - lastFrameRef.current
      lastFrameRef.current = now
      setPlayheadMs((prev) => {
        const next = prev + delta
        return next >= previewDurationMs ? 0 : next
      })
      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(rafId)
      lastFrameRef.current = null
    }
  }, [isPlaying, previewDurationMs])

  React.useEffect(() => {
    setPlayheadMs(0)
  }, [previewMode, enableFocus, enableRotate])

  const progressPercent = Math.min(100, (playheadMs / previewDurationMs) * 100)

  return (
    <PrometheusShell
      header={
        <header className="flex items-center justify-between border-b border-purple-500/10 px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-white/90">Editor Debug Preview</h1>
            <p className="text-xs text-white/55">
              Preview surface without fixture transcripts. Real transcription is required.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">previewAnimations=1</Badge>
            <Link
              href="/remotion?focus=1&rotate=1"
              className="rounded-md border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Open /remotion
            </Link>
          </div>
        </header>
      }
    >
      <div className="mx-auto w-full max-w-5xl px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-3">
              <span>Preview</span>
              <Badge variant="success">Animated</Badge>
            </CardTitle>
            <CardDescription>
              Mirrors the editor transcript preview card and blocks when transcript data is missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.09),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(191,90,242,0.16),transparent_42%),linear-gradient(160deg,rgba(20,20,24,0.96),rgba(8,8,10,0.96))] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={previewMode === 'default' ? 'secondary' : 'outline'}
                  onClick={() => setPreviewMode('default')}
                >
                  Default
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'headline' ? 'secondary' : 'outline'}
                  onClick={() => setPreviewMode('headline')}
                >
                  Headline
                </Button>
                <Button
                  size="sm"
                  variant={previewMode === 'caption' ? 'secondary' : 'outline'}
                  onClick={() => setPreviewMode('caption')}
                >
                  Caption
                </Button>
                <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-white/75">
                  <label className="flex items-center gap-2">
                    <span>Focus</span>
                    <Switch checked={enableFocus} onCheckedChange={setEnableFocus} />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Rotate</span>
                    <Switch checked={enableRotate} onCheckedChange={setEnableRotate} />
                  </label>
                </div>
              </div>

              <div className="mt-3 flex h-[calc(100%-5.75rem)] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30 p-3">
                <TranscriptRenderer
                  tokens={tokens}
                  playheadMs={playheadMs}
                  mode={previewMode}
                  enableFocus={enableFocus}
                  enableRotate={enableRotate}
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="size-8"
                >
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setPlayheadMs(0)}
                  className="size-8"
                >
                  <RotateCcw className="size-4" />
                </Button>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-amber-300 transition-[width] duration-75"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="min-w-20 text-right font-mono text-xs text-white/70">
                  {msToTime(Math.floor(playheadMs))}
                </div>
              </div>

              <div className="mt-2 text-xs text-red-200/85">
                No transcript tokens loaded. Run a real transcription pass before previewing
                animated captions.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PrometheusShell>
  )
}
