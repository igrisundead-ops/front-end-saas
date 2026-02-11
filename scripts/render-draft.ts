import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'

import {
  assertAssemblyAiConfigured,
  transcribeVideoToTokens,
} from '../src/server/transcription/assemblyai'
import type { VideoWithAnimatedCaptionsMode } from '../src/remotion/compositions/VideoWithAnimatedCaptions'

type CliOptions = {
  video: string
  out: string
  mode: VideoWithAnimatedCaptionsMode
  focus: boolean
  rotate: boolean
}

function getArgValue(args: string[], flag: string) {
  const index = args.indexOf(flag)
  if (index < 0 || index + 1 >= args.length) return null
  return args[index + 1] ?? null
}

function parseBooleanFlag(value: string | null, defaultValue: boolean) {
  if (value === null) return defaultValue
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
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

function normalizeMode(mode: string | null): VideoWithAnimatedCaptionsMode {
  if (mode === 'default' || mode === 'headline' || mode === 'caption') {
    return mode
  }
  if (mode === null) return 'caption'
  throw new Error(`Invalid --mode "${mode}". Use one of: default | headline | caption.`)
}

function normalizeCliOptions(args: string[]): CliOptions {
  const video = getArgValue(args, '--video')
  const out = getArgValue(args, '--out')

  if (!video) {
    throw new Error('Missing required argument: --video "<path-or-url>".')
  }
  if (!out) {
    throw new Error('Missing required argument: --out "<output.mp4>".')
  }

  return {
    video,
    out,
    mode: normalizeMode(getArgValue(args, '--mode')),
    focus: parseBooleanFlag(getArgValue(args, '--focus'), true),
    rotate: parseBooleanFlag(getArgValue(args, '--rotate'), false),
  }
}

function assertVideoInputExists(videoArg: string) {
  if (isHttpUrl(videoArg)) return

  const filePath = isFileUrl(videoArg)
    ? fileURLToPath(videoArg)
    : path.isAbsolute(videoArg)
      ? videoArg
      : path.resolve(videoArg)

  if (!existsSync(filePath)) {
    throw new Error(`Video file does not exist: ${filePath}`)
  }
}

function toRenderableVideoSrc(videoArg: string) {
  if (isHttpUrl(videoArg) || isFileUrl(videoArg)) {
    return videoArg
  }

  const absolutePath = path.isAbsolute(videoArg) ? videoArg : path.resolve(videoArg)
  return pathToFileURL(absolutePath).toString()
}

async function main() {
  const options = normalizeCliOptions(process.argv.slice(2))
  assertVideoInputExists(options.video)
  assertAssemblyAiConfigured()

  console.log(`[draft:render] Transcribing video with AssemblyAI: ${options.video}`)
  const tokens = await transcribeVideoToTokens(options.video)
  if (tokens.length === 0) {
    throw new Error('Transcription returned zero tokens. Draft render aborted.')
  }

  const videoSrc = toRenderableVideoSrc(options.video)
  const outputPath = path.isAbsolute(options.out) ? options.out : path.resolve(options.out)

  await mkdir(path.dirname(outputPath), { recursive: true })

  const inputProps = {
    videoSrc,
    tokens,
    mode: options.mode,
    enableFocus: options.focus,
    enableRotate: options.rotate,
  }

  const entryPoint = path.resolve(process.cwd(), 'remotion/index.ts')
  const bundledLocation = await bundle({
    entryPoint,
    onProgress: () => undefined,
  })

  const composition = await selectComposition({
    serveUrl: bundledLocation,
    id: 'VideoWithAnimatedCaptions',
    inputProps,
  })

  console.log(`[draft:render] Rendering MP4 to: ${outputPath}`)
  await renderMedia({
    serveUrl: bundledLocation,
    composition,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    overwrite: true,
    logLevel: 'info',
  })

  console.log('[draft:render] Render complete.')
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[draft:render] Failed: ${message}`)

  const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined
  if (cause) {
    const causeMessage = cause instanceof Error ? cause.message : String(cause)
    console.error(`[draft:render] Cause: ${causeMessage}`)
  }

  process.exitCode = 1
})
