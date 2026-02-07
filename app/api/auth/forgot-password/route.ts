import { NextResponse, type NextRequest } from 'next/server'
import { xanoFetch } from '@/lib/xano/server'
import { ENDPOINTS } from '@/lib/xano/config'
import { ensureEndpoint, friendlyXanoError } from '../_utils'

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  try {
    ensureEndpoint(ENDPOINTS.requestPasswordReset, 'requestPasswordReset')

    const { email } = (await req.json()) as { email?: string }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    // Call Xano to send the reset link email.
    // Build redirect URL so Xano can embed it in the email template.
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''
    const redirectUrl = `${origin}/reset-password`

    await xanoFetch(ENDPOINTS.requestPasswordReset, {
      method: 'POST',
      body: { email, redirect_url: redirectUrl, reset_url: redirectUrl },
    })

    console.log('[api/auth/forgot-password] sent', { ms: Date.now() - startedAt, email })

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Request failed'
    console.error('[api/auth/forgot-password] error', { ms: Date.now() - startedAt, raw })

    const friendly = friendlyXanoError(err, '')
    const lower = (raw + ' ' + friendly).toLowerCase()

    // If it's a "not found" error from Xano (user doesn't exist), still return success to prevent email enumeration
    if (lower.includes('no account') || lower.includes('not found') || lower.includes('no record')) {
      return NextResponse.json({ ok: true })
    }

    // If the endpoint itself doesn't exist in Xano ("Unable to locate request")
    if (lower.includes('unable to locate') || lower.includes('not_found') || lower.includes('404')) {
      console.error('[api/auth/forgot-password] Xano endpoint not found — check ENDPOINTS.requestPasswordReset in lib/xano/config.ts')
      return NextResponse.json(
        { error: 'Password reset is not available. Please contact support.' },
        { status: 501 }
      )
    }

    return NextResponse.json(
      { error: friendly || 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
