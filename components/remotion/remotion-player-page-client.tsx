'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Player } from '@remotion/player'
import { TranscriptAnimatedPreview } from '@/src/remotion/TranscriptAnimatedPreview'
import type { TranscriptToken } from '@/lib/types/transcript'

export function RemotionPlayerPageClient() {
  const searchParams = useSearchParams()
  const focus = searchParams.get('focus') === '1'
  const rotate = searchParams.get('rotate') === '1'

  const tokens = React.useMemo<TranscriptToken[]>(() => [], [])
  const fps = 30
  const durationMs = Math.max(tokens[tokens.length - 1]?.endMs ?? 12_000, 12_000)
  const durationInFrames = Math.ceil((durationMs / 1000) * fps)

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Remotion Transcript Preview</h1>
            <p className="mt-1 text-sm text-white/65">
              Composition: <span className="font-mono">TranscriptAnimatedPreview</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/remotion?focus=1"
              className="rounded-md border border-white/20 px-3 py-1.5 text-white/80 hover:bg-white/10"
            >
              Focus On
            </Link>
            <Link
              href="/remotion?focus=1&rotate=1"
              className="rounded-md border border-white/20 px-3 py-1.5 text-white/80 hover:bg-white/10"
            >
              Focus + Rotate
            </Link>
            <Link
              href="/editor/debug"
              className="rounded-md border border-white/20 px-3 py-1.5 text-white/80 hover:bg-white/10"
            >
              Open Editor Debug
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-neutral-950 p-3">
          <Player
            component={TranscriptAnimatedPreview}
            durationInFrames={durationInFrames}
            fps={fps}
            compositionHeight={1080}
            compositionWidth={1920}
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 10,
              overflow: 'hidden',
            }}
            controls
            autoPlay
            loop
            inputProps={{
              tokens,
              mode: 'default',
              enableFocus: focus,
              enableRotate: rotate,
            }}
          />
        </div>

        <p className="text-xs text-white/60">
          Query flags: <span className="font-mono">?focus=1</span>,{' '}
          <span className="font-mono">?rotate=1</span>
        </p>
        <p className="text-xs text-red-200/85">
          No fixture transcript is used here. Provide real transcription tokens via input props or
          use the draft render CLI.
        </p>
      </div>
    </main>
  )
}
