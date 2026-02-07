export function extractToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const obj = payload as Record<string, unknown>
  const candidates = ['token', 'authToken', 'auth_token', 'accessToken', 'access_token']
  for (const key of candidates) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return undefined
}

export function ensureEndpoint(pathOrUrl: string, name: string) {
  if (!pathOrUrl || pathOrUrl.includes('<PASTE_')) {
    throw new Error(`[CONFIG] Missing Xano endpoint for ${String(name)} in lib/xano/config.ts`)
  }
}

/**
 * Extract a user-friendly error message from raw Xano error strings.
 * Xano errors look like: "[XANO] 500 ... :: {"status":500,...,"response":{"code":"...","message":"Invalid Credentials",...}}"
 */
export function friendlyXanoError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err)
  try {
    const jsonPart = raw.split('::').slice(1).join('::').trim()
    if (jsonPart) {
      const parsed = JSON.parse(jsonPart)
      const xanoMsg: string | undefined = parsed?.response?.message ?? parsed?.message
      if (typeof xanoMsg === 'string' && xanoMsg.length > 0) {
        const lower = xanoMsg.toLowerCase()
        if (lower.includes('invalid credentials') || lower.includes('invalid password')) {
          return 'Invalid email or password.'
        }
        if (lower.includes('not found') || lower.includes('no user')) {
          return 'No account found with that email.'
        }
        if (lower.includes('already exists') || lower.includes('duplicate')) {
          return 'An account with that email already exists.'
        }
        if (lower.includes('locked') || lower.includes('blocked')) {
          return 'Account is locked. Please contact support.'
        }
        if (lower.includes('rate limit') || lower.includes('too many')) {
          return 'Too many attempts. Please wait and try again.'
        }
        if (lower.includes('unable to locate')) {
          return 'Service endpoint not available. Please contact support.'
        }
        return xanoMsg
      }
    }
  } catch {
    // JSON parse failed — use fallback
  }
  return fallback
}

export function getUserVerificationFlag(user: unknown): boolean | undefined {
  if (!user || typeof user !== 'object') return undefined
  const u = user as Record<string, unknown>

  const candidates = ['email_verified', 'emailVerified', 'verified', 'is_verified', 'isVerified']
  for (const key of candidates) {
    const value = u[key]
    if (typeof value === 'boolean') return value
  }
  return undefined
}
