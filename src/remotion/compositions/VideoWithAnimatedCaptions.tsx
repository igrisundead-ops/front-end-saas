import React from 'react'
import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig } from 'remotion'
import { TranscriptRenderer } from '../../textfx/transcript/TranscriptRenderer'
import type { TranscriptToken } from '../../../lib/types/transcript'

export type VideoWithAnimatedCaptionsMode = 'default' | 'headline' | 'caption'

export type VideoWithAnimatedCaptionsProps = {
  videoSrc: string
  tokens: TranscriptToken[]
  mode?: VideoWithAnimatedCaptionsMode
  enableFocus?: boolean
  enableRotate?: boolean
}

export const VideoWithAnimatedCaptions: React.FC<VideoWithAnimatedCaptionsProps> = ({
  videoSrc,
  tokens,
  mode = 'caption',
  enableFocus = true,
  enableRotate = false,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const playheadMs = (frame / fps) * 1_000

  const alignItems = mode === 'caption' ? 'flex-end' : 'center'
  const padding = mode === 'caption' ? '0 7% 7.5%' : '7.5% 7%'

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Video
        src={videoSrc}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(1200px circle at 12% -20%, rgba(0,0,0,0.30), transparent 48%), radial-gradient(1400px circle at 50% 120%, rgba(0,0,0,0.42), rgba(0,0,0,0.58))',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems,
          padding,
        }}
      >
        <div style={{ width: '85%', maxWidth: 1700 }}>
          {tokens.length > 0 ? (
            <TranscriptRenderer
              tokens={tokens}
              playheadMs={playheadMs}
              mode={mode}
              enableFocus={enableFocus}
              enableRotate={enableRotate}
              plate
            />
          ) : (
            <div
              style={{
                margin: '0 auto',
                maxWidth: 860,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.20)',
                background: 'rgba(0,0,0,0.45)',
                color: 'rgba(255,255,255,0.9)',
                boxShadow: '0 18px 48px rgba(0,0,0,0.55)',
                padding: '18px 20px',
                textAlign: 'center',
                fontSize: 26,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              No timed transcript tokens were provided.
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
