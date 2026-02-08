export const XANO_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:zFS15jK8'

export const ENDPOINTS = {
  signup: '/auth/signup',
  login: '/auth/login',
  me: '/auth/me',

  // Verify endpoint accepts { code } or { token } depending on your Xano setup.
  verifyEmail: '<PASTE_XANO_VERIFY_EMAIL_PATH>',

  // Resend endpoint accepts { email } or uses auth context depending on your Xano setup.
  resendVerification: '<PASTE_XANO_RESEND_VERIFY_PATH>',

  // Video upload endpoint: expects { file_name, content_type, base64 } in the body.
  // The Xano endpoint should accept a base64-encoded file and return { url } or similar.
  uploadVideo: '<PASTE_XANO_VIDEO_UPLOAD_PATH>',
} as const

/** Maximum base64 payload size in bytes (default ~50 MB encoded, ~37 MB raw file). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
