import { AuthShell } from '@/components/auth/AuthShell'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will send you a reset link by email."
      showMobileBrandRow
      showOAuth={false}
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
