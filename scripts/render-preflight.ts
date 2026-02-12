import { access } from 'node:fs/promises'
import path from 'node:path'

export type RenderJob = {
  composition: string
  outPath: string
  inputProps: Record<string, unknown>
}

const REQUIRED_PROJECT_FILES = ['package.json', 'remotion/index.ts']

const POSSIBLE_INPUT_PATH_KEYS = ['videoSrc', 'captionsSrc', 'audioSrc', 'imageSrc']

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value)

const canAccess = async (filePath: string) => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export const runRenderPreflight = async (job: RenderJob, jobPath: string) => {
  for (const relativePath of REQUIRED_PROJECT_FILES) {
    const absolutePath = path.resolve(process.cwd(), relativePath)
    if (!(await canAccess(absolutePath))) {
      throw new Error(`Preflight failed: required project file is missing: ${absolutePath}`)
    }
  }

  for (const key of POSSIBLE_INPUT_PATH_KEYS) {
    const value = job.inputProps[key]
    if (typeof value !== 'string' || value.trim() === '' || isHttpUrl(value)) {
      continue
    }

    const resolvedPath = path.isAbsolute(value)
      ? value
      : path.resolve(path.dirname(jobPath), value)

    if (!(await canAccess(resolvedPath))) {
      throw new Error(`Preflight failed: inputProps.${key} file does not exist: ${resolvedPath}`)
    }
  }
}
