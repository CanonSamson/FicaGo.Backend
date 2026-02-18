export type VendorRecord = {
  vendorType?: string | null
  selfieImage?: string | null
  identificationType?: string | null
  identificationNumber?: string | null
  taxIdentificationNumber?: string | null
  gender?: string | null
  bankAccount?: {
    bankName?: string | null
    accountName?: string | null
    accountNumber?: string | null
  } | null
  services?: Array<unknown> | null
  cacCertificateUrl?: string | null
  onboardingStatus?: string | null
}

export const computeOnboardingFlags = (vendor: VendorRecord) => {
  const hasProfile =
    !!vendor.vendorType &&
    !!vendor.selfieImage &&
    !!vendor.identificationType &&
    !!vendor.identificationNumber &&
    !!vendor.gender &&
    !!vendor.taxIdentificationNumber

  const hasBank = !!vendor.bankAccount
  const hasServices = (vendor.services?.length ?? 0) > 0
  const requiresVerification = vendor.vendorType === 'registered'
  const hasVerification = !requiresVerification || !!vendor.cacCertificateUrl

  return {
    hasProfile,
    hasBank,
    hasServices,
    requiresVerification,
    hasVerification,
  }
}
