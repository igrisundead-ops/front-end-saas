import { NextResponse, type NextRequest } from 'next/server'
import { xanoFetch } from '@/lib/xano/server'
import { ENDPOINTS } from '@/lib/xano/config'
import { ensureEndpoint, friendlyXanoError } from '../_utils'

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  try {
    ensureEndpoint(ENDPOINTS.resetPassword, 'resetPassword')

    const { token, password } = (await req.json()) as { token?: string; password?: string }

    if (!token) {
      return NextResponse.json({ error: 'Reset token is missing or invalid.' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    await xanoFetch(ENDPOINTS.resetPassword, {
      method: 'POST',
      body: { token, password },
    })

    console.log('[api/auth/reset-password] success', { ms: Date.now() - startedAt })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Reset failed'
    console.error('[api/auth/reset-password] error', { ms: Date.now() - startedAt, raw })
    const friendly = friendlyXanoError(err, 'Password reset failed. The link may have expired.')
    return NextResponse.json({ error: friendly }, { status: 400 })
  }
}
