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
    // We pass the app's reset-password page URL so Xano can include it in the email.
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''
    const redirectUrl = `${origin}/reset-password`

    await xanoFetch(ENDPOINTS.requestPasswordReset, {
      method: 'POST',
      body: { email, redirect_url: redirectUrl },
    })

    console.log('[api/auth/forgot-password] sent', { ms: Date.now() - startedAt, email })

    // Always return success to prevent email enumeration
    return NextResponse.json({ ok: true })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Request failed'
    console.error('[api/auth/forgot-password] error', { ms: Date.now() - startedAt, raw })

    // If it's a "not found" error from Xano, still return success to prevent email enumeration
    const friendly = friendlyXanoError(err, '')
    if (friendly.toLowerCase().includes('no account') || friendly.toLowerCase().includes('not found')) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      { error: friendly || 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
