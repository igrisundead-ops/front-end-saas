import { Suspense } from 'react'
import { AuthShell } from '@/components/auth/AuthShell'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your new password below."
      showMobileBrandRow
      showOAuth={false}
    >
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
