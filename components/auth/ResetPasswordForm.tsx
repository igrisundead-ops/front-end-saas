'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LockIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({})

  const validate = () => {
    const next: typeof errors = {}
    if (!password || password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (password !== confirmPassword) next.confirm = 'Passwords do not match.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">Invalid reset link</p>
          <p className="text-muted-foreground mt-1 text-sm">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/forgot-password">Request new reset link</Link>
        </Button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">Password reset successful</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>
          </div>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setServerError(null)
        if (!validate()) return
        setSubmitting(true)
        try {
          const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
          })
          const data = (await res.json()) as { ok?: boolean; error?: string }
          if (!res.ok) throw new Error(data.error || 'Reset failed')
          setSuccess(true)
        } catch (err) {
          setServerError(err instanceof Error ? err.message : 'Password reset failed. Please try again.')
        } finally {
          setSubmitting(false)
        }
      }}
      className="space-y-4"
    >
      <p className="text-muted-foreground text-sm">
        Enter your new password below.
      </p>

      <div>
        <label className="text-sm font-medium" htmlFor="reset-password">
          New password
        </label>
        <div className="mt-2 relative">
          <LockIcon className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            id="reset-password"
            type="password"
            placeholder="At least 8 characters"
            className="peer ps-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
        </div>
        {errors.password ? <div className="mt-1 text-xs text-red-500/80">{errors.password}</div> : null}
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="reset-confirm-password">
          Confirm password
        </label>
        <div className="mt-2 relative">
          <LockIcon className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            id="reset-confirm-password"
            type="password"
            placeholder="Re-enter your password"
            className="peer ps-9"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {errors.confirm ? <div className="mt-1 text-xs text-red-500/80">{errors.confirm}</div> : null}
      </div>

      {serverError ? <div className="text-xs text-red-500/80">{serverError}</div> : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Resetting...' : 'Reset password'}
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
