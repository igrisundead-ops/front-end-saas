export type Id = string

export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'exported'

export interface Project {
  id: Id
  title: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  thumbnailUrl?: string
}

export type PipelineStepStatus = 'pending' | 'running' | 'completed' | 'error'

export interface PipelineStep {
  key: 'video-analysis' | 'scene-detection' | 'audio-processing' | 'ai-enhancement'
  title: string
  status: PipelineStepStatus
  progress: number
}

export interface TranscriptSegment {
  id: Id
  startMs: number
  endMs: number
  text: string
  speaker?: string
}

export interface DetectedScene {
  id: Id
  startMs: number
  endMs: number
  label: string
}

export interface HighlightTimestamp {
  id: Id
  atMs: number
  label: string
}

export interface BRollSuggestion {
  id: Id
  startMs: number
  endMs: number
  query: string
  confidence: number
}

export interface TemplateStyle {
  id: Id
  name: string
  description: string
  category: 'Iman' | 'Podcast' | 'Docs' | 'Reels' | 'Minimal'
  tags: {
    captionIntensity: 'Low' | 'Medium' | 'High'
    pacing: 'Smooth' | 'Snappy' | 'Aggressive'
    broll: 'Rare' | 'Balanced' | 'Heavy'
  }
}

export type ProcessingJobStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface ProcessingArtifacts {
  transcript: TranscriptSegment[]
  scenes: DetectedScene[]
  highlights: HighlightTimestamp[]
  brollSuggestions: BRollSuggestion[]
  styleId?: Id
}

export interface ProcessingJobInput {
  prompt: string
  sources: string[]
  styleId?: Id
}

export interface ProcessingJob {
  id: Id
  projectId: Id
  status: ProcessingJobStatus
  createdAt: string
  startedAt: string
  steps: PipelineStep[]
  input: ProcessingJobInput
  artifacts: ProcessingArtifacts
}

export type AssetKind = 'upload' | 'music' | 'broll' | 'font' | 'logo'

export interface AssetItem {
  id: Id
  kind: AssetKind
  name: string
  createdAt: string
  url?: string
  sizeBytes?: number
  tags?: string[]
}

