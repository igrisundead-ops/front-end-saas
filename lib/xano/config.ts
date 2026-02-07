export const XANO_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:zFS15jK8'

export const ENDPOINTS = {
  signup: '/auth/signup',
  login: '/auth/login',
  me: '/auth/me',

  // Verify endpoint accepts { code } or { token } depending on your Xano setup.
  verifyEmail: '<PASTE_XANO_VERIFY_EMAIL_PATH>',

  // Resend endpoint accepts { email } or uses auth context depending on your Xano setup.
  resendVerification: '<PASTE_XANO_RESEND_VERIFY_PATH>',

  // Password reset: request sends a reset link to the user's email.
  requestPasswordReset: '/auth/request-password-reset',

  // Password reset: reset accepts { token, password } to set the new password.
  resetPassword: '/auth/reset-password',
} as const
