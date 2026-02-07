'use client'

import * as React from 'react'
import Link from 'next/link'
import { AtSignIcon, ArrowLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function isValidEmail(email: string) {
  return email.includes('@')
}

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [sent, setSent] = React.useState(false)
  const [emailError, setEmailError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setEmailError(null)

    if (!email.trim() || !isValidEmail(email)) {
      setEmailError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setSent(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm font-medium text-emerald-400">Check your email</p>
          <p className="text-muted-foreground mt-1 text-sm">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we sent a
            password reset link. Check your inbox and spam folder.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            setSent(false)
            setEmail('')
          }}
        >
          Send again
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-muted-foreground inline-flex items-center gap-1.5 text-sm hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Enter the email address associated with your account and we will send you a link to reset
        your password.
      </p>

      <div>
        <label className="text-sm font-medium" htmlFor="forgot-email">
          Email
        </label>
        <div className="mt-2 relative">
          <AtSignIcon className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@domain.com"
            className="peer ps-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </div>
        {emailError ? <div className="mt-1 text-xs text-red-500/80">{emailError}</div> : null}
      </div>

      {serverError ? <div className="text-xs text-red-500/80">{serverError}</div> : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send reset link'}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-muted-foreground inline-flex items-center gap-1.5 text-sm hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
