export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@ficago.ng'
export const EMAILS_FROM = {
  noreply: EMAIL_FROM,
  vendor: 'vendor@ficago.ng',
  wallet: 'wallet@ficago.ng',
  system: 'system@ficago.ng',
  onboarding: 'onboarding@ficago.ng',
  consumer: 'consumer@ficago.ng'

}


export type EmailFrom = keyof typeof EMAILS_FROM