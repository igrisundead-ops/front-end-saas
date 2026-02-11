import React from 'react'
import { Composition } from 'remotion'
import type { TranscriptToken } from '../../lib/types/transcript'
import {
  TranscriptAnimatedPreview,
  type TranscriptAnimatedPreviewProps,
} from './TranscriptAnimatedPreview'
import {
  VideoWithAnimatedCaptions,
  type VideoWithAnimatedCaptionsProps,
} from './compositions/VideoWithAnimatedCaptions'

const DEFAULT_FPS = 30
const EMPTY_TOKENS: TranscriptToken[] = []

const defaultProps: TranscriptAnimatedPreviewProps = {
  tokens: EMPTY_TOKENS,
  mode: 'default',
  enableFocus: true,
  enableRotate: false,
}

const defaultVideoWithCaptionsProps: VideoWithAnimatedCaptionsProps = {
  videoSrc: '/video5775880588120564434.mp4',
  tokens: EMPTY_TOKENS,
  mode: 'caption',
  enableFocus: true,
  enableRotate: false,
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TranscriptAnimatedPreview"
        component={TranscriptAnimatedPreview}
        durationInFrames={300}
        fps={DEFAULT_FPS}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
      <Composition
        id="VideoWithAnimatedCaptions"
        component={VideoWithAnimatedCaptions}
        durationInFrames={900}
        fps={DEFAULT_FPS}
        width={1920}
        height={1080}
        defaultProps={defaultVideoWithCaptionsProps}
      />
    </>
  )
}
