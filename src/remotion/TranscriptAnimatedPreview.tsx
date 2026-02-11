import React from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { TranscriptRenderer } from '../textfx/transcript/TranscriptRenderer'
import type { TranscriptToken } from '../../lib/types/transcript'

export type TranscriptAnimatedPreviewMode = 'default' | 'headline' | 'caption'

export type TranscriptAnimatedPreviewProps = {
  tokens: TranscriptToken[]
  mode: TranscriptAnimatedPreviewMode
  enableFocus?: boolean
  enableRotate?: boolean
}

export const TranscriptAnimatedPreview: React.FC<TranscriptAnimatedPreviewProps> = ({
  tokens,
  mode,
  enableFocus = true,
  enableRotate = false,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const playheadMs = (frame / fps) * 1000

  const entrance = spring({
    fps,
    frame,
    config: {
      damping: 200,
      stiffness: 150,
      mass: 0.9,
    },
  })

  const glowOpacity = interpolate(frame, [0, 20, 80], [0.2, 0.35, 0.22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'extend',
  })

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.08), transparent 38%), radial-gradient(circle at 84% 86%, rgba(118, 87, 255, 0.2), transparent 40%), linear-gradient(160deg, rgb(18,18,22), rgb(6,6,10))',
        display: 'flex',
        alignItems: mode === 'caption' ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: mode === 'caption' ? '7% 7.5% 10%' : '8% 7.5%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(1100px circle at 24% -12%, rgba(255,255,255,0.2), transparent 46%), radial-gradient(900px circle at 88% 12%, rgba(143, 113, 255, 0.2), transparent 42%)',
          opacity: glowOpacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(1200px ellipse at center, rgba(0,0,0,0.08), rgba(0,0,0,0.28))',
        }}
      />
      <div
        style={{
          width: '85%',
          maxWidth: 1700,
          transform: `scale(${0.96 + entrance * 0.04})`,
          opacity: 0.6 + entrance * 0.4,
        }}
      >
        <TranscriptRenderer
          tokens={tokens}
          playheadMs={playheadMs}
          mode={mode}
          enableFocus={enableFocus}
          enableRotate={enableRotate}
          plate
        />
      </div>
    </AbsoluteFill>
  )
}
