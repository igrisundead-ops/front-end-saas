'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import './textfx.css'
import type { TextFxProps } from '../../lib/types/transcript'

export const TextFx = React.forwardRef<HTMLDivElement, TextFxProps>(
  (
    {
      children,
      preset = 'blur',
      splitType = 'chars',
      animateBy,
      delay = 50,
      from = {},
      to = {},
      animate = true,
      duration = 600,
      stagger = 0,
      className = '',
    },
    ref,
  ) => {
    const text = String(children)
    const effectiveSplit = animateBy ?? splitType

    const chunks = useMemo(() => {
      if (!text) return []
      if (effectiveSplit === 'words') {
        const wordChunks = text.match(/\S+\s*/g) ?? [text]
        return wordChunks.map((chunk) => ({ text: chunk, isSpace: /^\s+$/.test(chunk) }))
      }
      return text.split('').map((chunk) => ({ text: chunk, isSpace: /^\s+$/.test(chunk) }))
    }, [effectiveSplit, text])

    const baseFrom = {
      opacity: from.opacity ?? 0,
      y: from.y ?? 0,
      x: from.x ?? 0,
      scale: from.scale ?? 1,
      rotate: from.rotate ?? from.rotation ?? 0,
    }

    const baseTo = {
      opacity: to.opacity ?? 1,
      y: to.y ?? 0,
      x: to.x ?? 0,
      scale: to.scale ?? 1,
      rotate: to.rotate ?? to.rotation ?? 0,
    }

    const variants = (() => {
      switch (preset) {
        case 'split':
          return {
            hidden: {
              ...baseFrom,
              opacity: from.opacity ?? 0,
              y: from.y ?? 20,
            },
            visible: {
              ...baseTo,
              opacity: to.opacity ?? 1,
              y: to.y ?? 0,
            },
          }

        case 'blur':
          return {
            hidden: {
              ...baseFrom,
              opacity: from.opacity ?? 0,
              filter: 'blur(10px)',
            },
            visible: {
              ...baseTo,
              opacity: to.opacity ?? 1,
              filter: 'blur(0px)',
            },
          }

        case 'focus':
          return {
            hidden: {
              ...baseFrom,
              opacity: from.opacity ?? 0.35,
              scale: from.scale ?? 0.98,
              filter: 'blur(1.5px)',
            },
            visible: {
              ...baseTo,
              opacity: to.opacity ?? 1,
              scale: to.scale ?? 1,
              filter: 'blur(0px)',
            },
          }

        case 'rotate':
          return {
            hidden: {
              ...baseFrom,
              opacity: from.opacity ?? 0,
              rotate: from.rotate ?? from.rotation ?? -110,
            },
            visible: {
              ...baseTo,
              opacity: to.opacity ?? 1,
              rotate: to.rotate ?? to.rotation ?? 0,
            },
          }

        default:
          return {
            hidden: baseFrom,
            visible: baseTo,
          }
      }
    })()

    const containerVariants = {
      visible: {
        transition: {
          staggerChildren: stagger || delay / 1000,
        },
      },
    }

    return (
      <motion.div
        ref={ref}
        className={`inline-flex flex-wrap textfx-readable textfx-stroke text-white/95 ${className}`}
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          color: 'rgba(255, 255, 255, 0.92)',
          textShadow: '0 2px 18px rgba(0, 0, 0, 0.85), 0 0 38px rgba(0, 0, 0, 0.55)',
          WebkitTextStroke: '1px rgba(0, 0, 0, 0.55)',
        }}
        initial="hidden"
        animate={animate ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        {chunks.map((chunk, i) => (
          <motion.span
            key={`${i}-${chunk.text}`}
            variants={variants}
            transition={{
              duration: duration / 1000,
              ease: 'easeOut',
            }}
            className={chunk.isSpace ? 'whitespace-pre' : 'inline-block whitespace-pre'}
            style={{
              display: chunk.isSpace ? 'inline' : 'inline-block',
              whiteSpace: 'pre',
            }}
          >
            {chunk.text}
          </motion.span>
        ))}
      </motion.div>
    )
  },
)

TextFx.displayName = 'TextFx'
