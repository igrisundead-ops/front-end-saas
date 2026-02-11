import type { TranscriptSegment } from '@/lib/types'
import type {
  AssemblyAISegmentLike,
  EmphasisLevel,
  TranscriptToken,
} from '@/lib/types/transcript'

const EMPHASIS_KEYWORDS = new Set([
  'time',
  'fire',
  'money',
  'truth',
  'risk',
  'future',
  'war',
  'love',
  'death',
])

const WORD_OR_PUNCT_REGEX = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?|[.,!?;:]/g
const PUNCT_REGEX = /^[.,!?;:]$/

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function cleanWord(word: string) {
  return word.replace(/[^A-Za-z0-9']/g, '')
}

function getEmphasisLevel(word: string): EmphasisLevel {
  const cleaned = cleanWord(word)
  if (!cleaned) return 'none'

  const hasAlpha = /[A-Za-z]/.test(cleaned)
  if (hasAlpha && cleaned === cleaned.toUpperCase() && cleaned.length > 1) {
    return 'high'
  }

  if (cleaned.length > 8) {
    return 'high'
  }

  if (EMPHASIS_KEYWORDS.has(cleaned.toLowerCase())) {
    return 'high'
  }

  return 'none'
}

function tokenizeTimedText(
  text: string,
  startMs: number,
  endMs: number,
  confidence: number,
  startIndex: number,
): TranscriptToken[] {
  const parts = text.match(WORD_OR_PUNCT_REGEX) ?? []
  if (parts.length === 0) return []

  const wordCount = parts.filter((part) => !PUNCT_REGEX.test(part)).length
  const durationMs = Math.max(endMs - startMs, 1)
  const msPerWord = durationMs / Math.max(wordCount, 1)

  let index = startIndex
  let cursorMs = startMs
  const tokens: TranscriptToken[] = []

  for (const part of parts) {
    if (PUNCT_REGEX.test(part)) {
      const punctStartMs = clamp(cursorMs - Math.min(msPerWord * 0.2, 90), startMs, endMs)
      tokens.push({
        text: part,
        startMs: punctStartMs,
        endMs: clamp(cursorMs, punctStartMs, endMs),
        confidence: 1,
        kind: 'punct',
        emphasis: 'none',
        index,
      })
      index += 1
      continue
    }

    const wordStartMs = clamp(cursorMs, startMs, endMs)
    const nextCursor = clamp(cursorMs + msPerWord, wordStartMs + 1, endMs)

    tokens.push({
      text: part,
      startMs: wordStartMs,
      endMs: nextCursor,
      confidence,
      kind: 'word',
      emphasis: getEmphasisLevel(part),
      index,
    })
    index += 1
    cursorMs = nextCursor
  }

  return tokens
}

export function parseTranscriptText(
  text: string,
  startMs = 0,
  endMs = 30_000,
  confidence = 0.95,
): TranscriptToken[] {
  return tokenizeTimedText(text, startMs, endMs, confidence, 0)
}

type SegmentInput = TranscriptSegment | AssemblyAISegmentLike

function getSegmentStartMs(segment: SegmentInput) {
  if ('startMs' in segment && typeof segment.startMs === 'number') return segment.startMs
  if ('start' in segment && typeof segment.start === 'number') return segment.start
  return 0
}
function getSegmentEndMs(segment: SegmentInput, startMs: number) {
  if ('endMs' in segment && typeof segment.endMs === 'number') return segment.endMs
  if ('end' in segment && typeof segment.end === 'number') return segment.end
  return startMs + 1_500
}

export function parseAssemblyAITranscript(segments: SegmentInput[]): TranscriptToken[] {
  const tokens: TranscriptToken[] = []
  let tokenIndex = 0

  for (const segment of segments) {
    const segmentStart = getSegmentStartMs(segment)
    const segmentEnd = getSegmentEndMs(segment, segmentStart)
    const segmentConfidence =
      'confidence' in segment && typeof segment.confidence === 'number'
        ? segment.confidence
        : 0.95

    const wordItems =
      'words' in segment && Array.isArray(segment.words) ? segment.words : undefined

    if (wordItems && wordItems.length > 0) {
      for (const word of wordItems) {
        const wordStart = typeof word.start === 'number' ? word.start : segmentStart
        const wordEnd =
          typeof word.end === 'number' ? word.end : Math.max(wordStart + 220, segmentEnd)
        const confidence =
          typeof word.confidence === 'number' ? word.confidence : segmentConfidence

        const wordTokens = tokenizeTimedText(
          word.text ?? '',
          wordStart,
          wordEnd,
          confidence,
          tokenIndex,
        )

        tokenIndex += wordTokens.length
        tokens.push(...wordTokens)
      }
      continue
    }

    const text = 'text' in segment && typeof segment.text === 'string' ? segment.text : ''
    if (!text.trim()) continue

    const segmentTokens = tokenizeTimedText(
      text,
      segmentStart,
      segmentEnd,
      segmentConfidence,
      tokenIndex,
    )
    tokenIndex += segmentTokens.length
    tokens.push(...segmentTokens)
  }

  return tokens
}
