import { AuthShell } from '@/components/auth/AuthShell'
import { VerifyForm } from '@/components/auth/VerifyForm'

export default function VerifyPage() {
  return (
    <AuthShell title="Verify email" subtitle="Verify your email to access your account.">
      <VerifyForm />
    </AuthShell>
  )
}

