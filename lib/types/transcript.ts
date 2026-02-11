import type { ReactNode } from 'react'

export type TextFxPreset = 'split' | 'blur' | 'focus' | 'rotate'
export type TokenKind = 'word' | 'punct'
export type EmphasisLevel = 'none' | 'low' | 'high'
export type SplitType = 'chars' | 'words'
export type AnimateBy = 'chars' | 'words'

export interface TranscriptToken {
  text: string
  startMs: number
  endMs: number
  confidence?: number
  kind: TokenKind
  emphasis: EmphasisLevel
  index?: number
}

export interface TextFxProps {
  children: ReactNode
  preset: TextFxPreset
  splitType?: SplitType
  animateBy?: AnimateBy
  delay?: number
  from?: {
    opacity?: number
    y?: number
    x?: number
    scale?: number
    rotate?: number
    rotation?: number
  }
  to?: {
    opacity?: number
    y?: number
    x?: number
    scale?: number
    rotate?: number
    rotation?: number
  }
  animate?: boolean
  duration?: number
  stagger?: number
  className?: string
}

export interface TranscriptRendererProps {
  tokens: TranscriptToken[]
  playheadMs: number
  mode?: 'default' | 'headline' | 'caption'
  enableFocus?: boolean
  enableRotate?: boolean
  plate?: boolean
  className?: string
}

export interface AssemblyAIWordLike {
  text: string
  start?: number
  end?: number
  confidence?: number
}

export interface AssemblyAISegmentLike {
  text?: string
  start?: number
  end?: number
  confidence?: number
  words?: AssemblyAIWordLike[]
}
