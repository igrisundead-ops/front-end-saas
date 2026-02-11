'use client'

import React, { useMemo } from 'react'
import { TextFx } from '../TextFx'
import type { TranscriptRendererProps, TranscriptToken } from '../../../lib/types/transcript'

type SentenceGroup = {
  tokens: TranscriptToken[]
  text: string
  startMs: number
  endMs: number
  wordCount: number
}

function tokenId(token: TranscriptToken, i: number) {
  return typeof token.index === 'number' ? token.index : i
}

function sentenceText(tokens: TranscriptToken[]) {
  let out = ''
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]!
    const next = tokens[i + 1]
    if (token.kind === 'punct') {
      out += token.text
      if (next?.kind === 'word') out += ' '
    } else {
      out += token.text
      if (next?.kind === 'word') out += ' '
    }
  }
  return out.trim()
}

function toSentences(tokens: TranscriptToken[]): SentenceGroup[] {
  const groups: SentenceGroup[] = []
  let current: TranscriptToken[] = []

  for (const token of tokens) {
    current.push(token)
    if (token.kind === 'punct' && /[.!?]/.test(token.text)) {
      const words = current.filter((t) => t.kind === 'word').length
      groups.push({
        tokens: [...current],
        text: sentenceText(current),
        startMs: current[0]?.startMs ?? 0,
        endMs: current[current.length - 1]?.endMs ?? 0,
        wordCount: words,
      })
      current = []
    }
  }

  if (current.length > 0) {
    const words = current.filter((t) => t.kind === 'word').length
    groups.push({
      tokens: [...current],
      text: sentenceText(current),
      startMs: current[0]?.startMs ?? 0,
      endMs: current[current.length - 1]?.endMs ?? 0,
      wordCount: words,
    })
  }

  return groups
}

export const TranscriptRenderer = React.forwardRef<HTMLDivElement, TranscriptRendererProps>(
  (
    {
      tokens,
      playheadMs,
      mode = 'default',
      enableFocus = false,
      enableRotate = false,
      plate = true,
      className = '',
    },
    ref,
  ) => {
    const sentences = useMemo(() => toSentences(tokens), [tokens])

    const currentSentenceIndex = useMemo(() => {
      if (sentences.length === 0) return -1
      const index = sentences.findIndex(
        (sentence) => playheadMs >= sentence.startMs && playheadMs <= sentence.endMs + 400,
      )
      if (index >= 0) return index
      const fallback = sentences.findIndex((sentence) => sentence.startMs > playheadMs)
      return fallback > 0 ? fallback - 1 : 0
    }, [playheadMs, sentences])

    const currentSentence = currentSentenceIndex >= 0 ? sentences[currentSentenceIndex] : null

    const shortHooks = useMemo(() => {
      const fromSentences = sentences
        .filter((sentence) => sentence.wordCount > 0 && sentence.wordCount <= 4)
        .map((sentence) => sentence.text)

      if (fromSentences.length > 0) {
        return Array.from(new Set(fromSentences)).slice(0, 6)
      }

      const fromWords = tokens
        .filter((token) => token.kind === 'word' && token.text.length <= 8)
        .slice(0, 6)
        .map((token) => token.text)

      return Array.from(new Set(fromWords))
    }, [sentences, tokens])

    const rotatingHook =
      shortHooks.length > 0 ? shortHooks[Math.floor(playheadMs / 1700) % shortHooks.length] : null

    const visibleTokens = useMemo(() => {
      if (mode !== 'caption') return tokens
      return currentSentence?.tokens ?? []
    }, [currentSentence?.tokens, mode, tokens])

    const modeTypographyStyle: React.CSSProperties =
      mode === 'headline'
        ? {
            fontSize: 'clamp(52px, 6vw, 78px)',
            lineHeight: 1.05,
            fontWeight: 800,
            letterSpacing: '-0.015em',
          }
        : mode === 'caption'
          ? {
              fontSize: 'clamp(30px, 3.2vw, 38px)',
              lineHeight: 1.24,
              fontWeight: 600,
              letterSpacing: '-0.005em',
            }
          : {
              fontSize: 'clamp(42px, 4.5vw, 56px)',
              lineHeight: 1.14,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }

    return (
      <div
        ref={ref}
        className={`w-full max-w-4xl rounded-2xl border border-white/20 bg-black/30 p-6 shadow-xl backdrop-blur-md ${className}`}
        style={{
          width: '100%',
          maxWidth: 1600,
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.28)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          padding: 24,
        }}
      >
        <div
          className={`rounded-2xl ${plate ? 'textfx-plate px-5 py-4 md:px-7 md:py-6 shadow-[0_14px_44px_rgba(0,0,0,0.45)]' : ''}`}
          style={
            plate
              ? {
                  borderRadius: 16,
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(10px)',
                  padding: '18px 22px',
                  boxShadow: '0 14px 44px rgba(0,0,0,0.45)',
                }
              : undefined
          }
        >
          {enableRotate && rotatingHook ? (
            <div className="mb-4" style={{ marginBottom: 14 }}>
              <TextFx
                preset="rotate"
                animateBy="words"
                delay={60}
                duration={420}
                className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-100"
              >
                {rotatingHook}
              </TextFx>
            </div>
          ) : null}

          {enableFocus && currentSentence?.text ? (
            <div
              className="mb-4 rounded-xl border border-white/15 bg-black/40 px-4 py-3 backdrop-blur-md"
              style={{
                marginBottom: 14,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.40)',
                backdropFilter: 'blur(8px)',
                padding: '12px 14px',
              }}
            >
              <TextFx
                preset="focus"
                animateBy="words"
                delay={45}
                duration={520}
                className="text-[clamp(24px,2.5vw,34px)] font-semibold"
              >
                {currentSentence.text}
              </TextFx>
            </div>
          ) : null}

          <div style={modeTypographyStyle}>
            {visibleTokens.map((token, i) => {
              const id = tokenId(token, i)
              const isVisible = playheadMs >= token.startMs
              const next = visibleTokens[i + 1]
              const showTrailingSpace =
                token.kind === 'word' || (token.kind === 'punct' && next?.kind === 'word')

              const isHighEmphasis = token.kind === 'word' && token.emphasis === 'high'
              const preset = isHighEmphasis ? 'split' : 'blur'
              const splitType = isHighEmphasis ? 'chars' : 'words'
              const delay = isHighEmphasis ? 18 : 50
              const from = isHighEmphasis ? { opacity: 0, y: 26 } : undefined
              const to = isHighEmphasis ? { opacity: 1, y: 0 } : undefined

              return (
                <React.Fragment key={`token-wrap-${id}`}>
                  <TextFx
                    preset={preset}
                    splitType={splitType}
                    animateBy={splitType}
                    delay={delay}
                    from={from}
                    to={to}
                    animate={isVisible}
                    duration={isHighEmphasis ? 420 : 650}
                    className={
                      token.kind === 'punct'
                        ? 'text-white/95 font-semibold'
                        : isHighEmphasis
                          ? 'text-white font-extrabold'
                          : isVisible
                            ? 'text-white/95 font-semibold'
                            : 'text-white/50 font-semibold'
                    }
                  >
                    {token.text}
                  </TextFx>
                  {showTrailingSpace ? <span style={{ whiteSpace: 'pre' }}>{' '}</span> : null}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="mt-4 text-xs text-white/45" style={{ marginTop: 12, fontSize: 12 }}>
          {mode === 'caption' ? 'Caption mode' : 'Transcript preview'} |{' '}
          <span className="font-mono">{Math.floor(playheadMs)}ms</span>
        </div>
      </div>
    )
  },
)

TranscriptRenderer.displayName = 'TranscriptRenderer'
