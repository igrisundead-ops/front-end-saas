import { NextResponse } from 'next/server'

import { getXanoToken } from '@/lib/auth/cookies'
import { ENDPOINTS, MAX_UPLOAD_BYTES } from '@/lib/xano/config'
import { xanoFetch } from '@/lib/xano/server'
import { ensureEndpoint } from '@/app/api/auth/_utils'

type UploadBody = {
  file_name: string
  content_type: string
  base64: string
}

type XanoUploadResponse = {
  /** URL of the uploaded file returned by Xano */
  url?: string
  /** Xano may return a path instead */
  path?: string
  [key: string]: unknown
}

export async function POST(req: Request) {
  const startedAt = Date.now()

  try {
    ensureEndpoint(ENDPOINTS.uploadVideo, 'uploadVideo')

    const token = await getXanoToken()
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated. Please log in first.' },
        { status: 401 }
      )
    }

    const body = (await req.json()) as Partial<UploadBody>

    if (!body.base64 || !body.file_name || !body.content_type) {
      return NextResponse.json(
        { error: 'Missing required fields: file_name, content_type, base64' },
        { status: 400 }
      )
    }

    // Size guard
    const payloadSize = new Blob([body.base64]).size
    if (payloadSize > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File too large. Maximum allowed size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB (base64-encoded).`,
        },
        { status: 413 }
      )
    }

    console.info('[api/upload/video] uploading', {
      file_name: body.file_name,
      content_type: body.content_type,
      base64Length: body.base64.length,
    })

    const res = await xanoFetch<XanoUploadResponse>(
      ENDPOINTS.uploadVideo,
      {
        method: 'POST',
        body: {
          file_name: body.file_name,
          content_type: body.content_type,
          base64: body.base64,
        },
      },
      token
    )

    console.info('[api/upload/video] ok', {
      ms: Date.now() - startedAt,
      url: res?.url ?? res?.path ?? null,
    })

    return NextResponse.json({
      success: true,
      url: res?.url ?? res?.path ?? null,
      data: res,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('[api/upload/video] error', { ms: Date.now() - startedAt, message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
