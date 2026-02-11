import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { parseAssemblyAITranscript } from '../../../lib/transcript-utils'
import type { AssemblyAISegmentLike, TranscriptToken } from '../../../lib/types/transcript'

const ASSEMBLYAI_API_BASE = 'https://api.assemblyai.com/v2'
const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 15 * 60 * 1_000
const WORD_OR_PUNCT_REGEX = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?|[.,!?;:]/g
const PUNCT_REGEX = /^[.,!?;:]$/

type AssemblyAIUploadResponse = {
  upload_url?: string
  error?: string
}

type AssemblyAIStartTranscriptResponse = {
  id?: string
  status?: string
  error?: string
}

type AssemblyAIWord = {
  text: string
  start: number
  end: number
  confidence?: number
}

type AssemblyAISegment = AssemblyAISegmentLike & {
  start: number
  end: number
  text: string
}

type AssemblyAITranscriptResult = {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  error?: string
  text?: string
  confidence?: number
  words?: AssemblyAIWord[]
  utterances?: AssemblyAISegment[]
  segments?: AssemblyAISegment[]
}

type VideoInputSource = {
  uploadBytes: Uint8Array
  renderSrc: string
  sourceLabel: string
}

function getApiKey() {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim()
  if (!key) {
    throw new Error(
      'ASSEMBLYAI_API_KEY is required. Set it in your environment before running transcription.',
    )
  }
  return key
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isFileUrl(value: string) {
  try {
    return new URL(value).protocol === 'file:'
  } catch {
    return false
  }
}

async function responseToErrorText(res: Response) {
  const text = await res.text()
  if (!text) return `HTTP ${res.status}`
  try {
    const parsed = JSON.parse(text) as { error?: string }
    return parsed.error?.trim() || text
  } catch {
    return text
  }
}

async function resolveVideoInput(videoSrc: string): Promise<VideoInputSource> {
  const source = videoSrc.trim()
  if (!source) {
    throw new Error('Video source is empty.')
  }

  if (isHttpUrl(source)) {
    const res = await fetch(source)
    if (!res.ok) {
      const reason = await responseToErrorText(res)
      throw new Error(`Failed to download remote video: ${reason}`)
    }

    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.byteLength === 0) {
      throw new Error('Remote video returned empty content.')
    }

    return {
      uploadBytes: bytes,
      renderSrc: source,
      sourceLabel: source,
    }
  }

  const filePath = isFileUrl(source)
    ? fileURLToPath(source)
    : path.isAbsolute(source)
      ? source
      : path.resolve(source)

  if (!existsSync(filePath)) {
    throw new Error(`Local video file not found: ${filePath}`)
  }

  const bytes = new Uint8Array(await readFile(filePath))
  if (bytes.byteLength === 0) {
    throw new Error(`Local video file is empty: ${filePath}`)
  }

  return {
    uploadBytes: bytes,
    renderSrc: pathToFileURL(filePath).toString(),
    sourceLabel: filePath,
  }
}

async function uploadToAssemblyAI(bytes: Uint8Array, apiKey: string) {
  const res = await fetch(`${ASSEMBLYAI_API_BASE}/upload`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: Buffer.from(bytes),
  })

  if (!res.ok) {
    const reason = await responseToErrorText(res)
    throw new Error(`AssemblyAI upload failed: ${reason}`)
  }

  const payload = (await res.json()) as AssemblyAIUploadResponse
  if (!payload.upload_url) {
    throw new Error(payload.error || 'AssemblyAI upload did not return upload_url.')
  }

  return payload.upload_url
}

async function startTranscription(uploadUrl: string, apiKey: string) {
  const res = await fetch(`${ASSEMBLYAI_API_BASE}/transcript`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      punctuate: true,
      format_text: true,
    }),
  })

  if (!res.ok) {
    const reason = await responseToErrorText(res)
    throw new Error(`AssemblyAI transcript start failed: ${reason}`)
  }

  const payload = (await res.json()) as AssemblyAIStartTranscriptResponse
  if (!payload.id) {
    throw new Error(payload.error || 'AssemblyAI transcript start response did not include id.')
  }

  return payload.id
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function waitForTranscription(transcriptId: string, apiKey: string) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const res = await fetch(`${ASSEMBLYAI_API_BASE}/transcript/${transcriptId}`, {
      headers: {
        authorization: apiKey,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const reason = await responseToErrorText(res)
      throw new Error(`AssemblyAI transcript poll failed: ${reason}`)
    }

    const payload = (await res.json()) as AssemblyAITranscriptResult
    if (payload.status === 'completed') {
      return payload
    }

    if (payload.status === 'error') {
      throw new Error(payload.error || 'AssemblyAI reported transcription error.')
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error(
    `AssemblyAI transcription timed out after ${Math.floor(POLL_TIMEOUT_MS / 1_000)} seconds.`,
  )
}

function ensureTokenOrder(tokens: TranscriptToken[]) {
  return tokens
    .filter((token) => token.text.trim().length > 0 || token.kind === 'punct')
    .sort((a, b) => {
      if (a.startMs !== b.startMs) return a.startMs - b.startMs
      if (a.endMs !== b.endMs) return a.endMs - b.endMs
      if (a.kind !== b.kind) return a.kind === 'word' ? -1 : 1
      return 0
    })
    .map((token, index) => ({
      ...token,
      confidence: typeof token.confidence === 'number' ? token.confidence : 0.95,
      index,
    }))
}

function injectPunctuationFromTranscriptText(
  wordsOnlyTokens: TranscriptToken[],
  transcriptText: string,
): TranscriptToken[] {
  const parts = transcriptText.match(WORD_OR_PUNCT_REGEX) ?? []
  if (parts.length === 0) return wordsOnlyTokens

  const mixedTokens: TranscriptToken[] = []
  let wordCursor = 0
  let lastWord: TranscriptToken | null = null

  for (const part of parts) {
    if (PUNCT_REGEX.test(part)) {
      const previousWord = lastWord
      const nextWord = wordsOnlyTokens[wordCursor] ?? null

      if (!previousWord && !nextWord) continue

      const endMs = previousWord?.endMs ?? nextWord?.startMs ?? 0
      const startAnchor = previousWord?.endMs ?? nextWord?.startMs ?? endMs
      const startMs = Math.max(
        previousWord ? previousWord.startMs : 0,
        startAnchor - Math.min(90, Math.max(20, (nextWord?.startMs ?? endMs) - startAnchor)),
      )

      mixedTokens.push({
        text: part,
        startMs,
        endMs: Math.max(endMs, startMs),
        confidence: 1,
        kind: 'punct',
        emphasis: 'none',
      })

      continue
    }

    const nextWordToken = wordsOnlyTokens[wordCursor]
    if (!nextWordToken) continue
    mixedTokens.push(nextWordToken)
    lastWord = nextWordToken
    wordCursor += 1
  }

  while (wordCursor < wordsOnlyTokens.length) {
    const nextWordToken = wordsOnlyTokens[wordCursor]!
    mixedTokens.push(nextWordToken)
    wordCursor += 1
  }

  return mixedTokens
}

function tokensFromWordLevelData(result: AssemblyAITranscriptResult) {
  const words = (result.words ?? []).filter((word) => {
    return (
      typeof word.text === 'string' &&
      word.text.trim().length > 0 &&
      typeof word.start === 'number' &&
      typeof word.end === 'number'
    )
  })

  if (words.length === 0) {
    throw new Error('AssemblyAI word-level result is empty.')
  }

  const parsed = parseAssemblyAITranscript([
    {
      text: result.text ?? words.map((word) => word.text).join(' '),
      start: words[0]!.start,
      end: words[words.length - 1]!.end,
      confidence: result.confidence ?? 0.95,
      words,
    },
  ])

  const hasPunctuation = parsed.some((token) => token.kind === 'punct')
  if (hasPunctuation || !result.text) {
    return ensureTokenOrder(parsed)
  }

  const wordsOnly = parsed.filter((token) => token.kind === 'word')
  const withPunctuation = injectPunctuationFromTranscriptText(wordsOnly, result.text)
  return ensureTokenOrder(withPunctuation)
}

function tokensFromSegmentLevelData(result: AssemblyAITranscriptResult) {
  const candidateSegments = (result.utterances ?? result.segments ?? []).filter((segment) => {
    return (
      typeof segment.text === 'string' &&
      segment.text.trim().length > 0 &&
      typeof segment.start === 'number' &&
      typeof segment.end === 'number'
    )
  })

  if (candidateSegments.length === 0) {
    throw new Error(
      'AssemblyAI completed, but did not provide word-level or segment-level timestamps.',
    )
  }

  const tokens = parseAssemblyAITranscript(candidateSegments)
  return ensureTokenOrder(tokens)
}

export function assertAssemblyAiConfigured(): void {
  getApiKey()
}

export async function transcribeVideoToTokens(videoSrc: string): Promise<TranscriptToken[]> {
  const apiKey = getApiKey()

  let input: VideoInputSource
  try {
    input = await resolveVideoInput(videoSrc)
  } catch (error) {
    throw new Error(`Failed to prepare video source for transcription: ${videoSrc}`, {
      cause: error,
    })
  }

  let uploadUrl: string
  try {
    uploadUrl = await uploadToAssemblyAI(input.uploadBytes, apiKey)
  } catch (error) {
    throw new Error(`Failed to upload media to AssemblyAI from source: ${input.sourceLabel}`, {
      cause: error,
    })
  }

  let transcriptId: string
  try {
    transcriptId = await startTranscription(uploadUrl, apiKey)
  } catch (error) {
    throw new Error('Failed to start AssemblyAI transcription job.', {
      cause: error,
    })
  }

  let completed: AssemblyAITranscriptResult
  try {
    completed = await waitForTranscription(transcriptId, apiKey)
  } catch (error) {
    throw new Error(`AssemblyAI transcription failed for job ${transcriptId}.`, {
      cause: error,
    })
  }

  try {
    let tokens: TranscriptToken[] = []
    const hasWordLevelData = Array.isArray(completed.words) && completed.words.length > 0

    if (hasWordLevelData) {
      try {
        tokens = tokensFromWordLevelData(completed)
      } catch {
        tokens = tokensFromSegmentLevelData(completed)
      }
    } else {
      tokens = tokensFromSegmentLevelData(completed)
    }

    if (tokens.length === 0) {
      throw new Error('AssemblyAI transcription produced zero tokens.')
    }

    return tokens
  } catch (error) {
    throw new Error(
      `Unable to map AssemblyAI transcription into timed tokens (job ${transcriptId}, source ${input.renderSrc}).`,
      { cause: error },
    )
  }
}
