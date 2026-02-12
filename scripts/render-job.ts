import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { runRenderPreflight, type RenderJob } from './render-preflight'

function getArgValue(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag)
  if (idx < 0 || idx + 1 >= args.length) return null
  return args[idx + 1] ?? null
}

function assertJob(value: unknown): asserts value is RenderJob {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid job JSON, expected an object.')
  }
  const asJob = value as Partial<RenderJob>
  if (!asJob.composition || typeof asJob.composition !== 'string') {
    throw new Error('Invalid job JSON, "composition" must be a string.')
  }
  if (!asJob.outPath || typeof asJob.outPath !== 'string') {
    throw new Error('Invalid job JSON, "outPath" must be a string.')
  }
  if (!asJob.inputProps || typeof asJob.inputProps !== 'object') {
    throw new Error('Invalid job JSON, "inputProps" must be an object.')
  }
}

async function main() {
  const jobArg = getArgValue(process.argv.slice(2), '--job')
  if (!jobArg) throw new Error('Missing required --job "<path/to/job.json>".')

  const jobPath = path.isAbsolute(jobArg) ? jobArg : path.resolve(jobArg)
  const raw = await readFile(jobPath, 'utf8')
  const parsed = JSON.parse(raw) as unknown
  assertJob(parsed)
  const job = parsed

  await runRenderPreflight(job, jobPath)

  const outPath = path.isAbsolute(job.outPath) ? job.outPath : path.resolve(job.outPath)
  await mkdir(path.dirname(outPath), { recursive: true })

  const serveUrl = await bundle({
    entryPoint: path.resolve(process.cwd(), 'remotion/index.ts'),
    onProgress: () => undefined,
  })

  const composition = await selectComposition({
    serveUrl,
    id: job.composition,
    inputProps: job.inputProps,
  })

  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    outputLocation: outPath,
    inputProps: job.inputProps,
    overwrite: true,
    logLevel: 'info',
  })

  console.log(`Render complete: ${outPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
