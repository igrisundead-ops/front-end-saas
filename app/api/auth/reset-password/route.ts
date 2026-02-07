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

    // Xano's standard reset-password endpoint accepts magic_token (or token) and password
    await xanoFetch(ENDPOINTS.resetPassword, {
      method: 'POST',
      body: { magic_token: token, token, password },
    })

    console.log('[api/auth/reset-password] success', { ms: Date.now() - startedAt })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Reset failed'
    console.error('[api/auth/reset-password] error', { ms: Date.now() - startedAt, raw })
    const friendly = friendlyXanoError(err, 'Password reset failed. The link may have expired.')
    const lower = (raw + ' ' + friendly).toLowerCase()

    if (lower.includes('unable to locate') || lower.includes('not_found') || lower.includes('404')) {
      console.error('[api/auth/reset-password] Xano endpoint not found — check ENDPOINTS.resetPassword in lib/xano/config.ts')
      return NextResponse.json(
        { error: 'Password reset is not available. Please contact support.' },
        { status: 501 }
      )
    }

    return NextResponse.json({ error: friendly }, { status: 400 })
  }
}
