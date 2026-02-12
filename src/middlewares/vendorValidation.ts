import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import logger from '../utils/logger.js'
import { VENDOR_TYPES } from '../utils/contant/index.js'

const vendorOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  businessType: z.string().min(1, 'Business type is required'),
  mobileNumber: z.number().int().transform((val) => val.toString()),
  serviceCategory: z.string().min(1, 'Service category is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required')
})

const upgradeToRegisteredSchema = z.object({
  cacCertificate: z.string().min(1, 'CAC Certificate is required'),
  registrationType: z.string().min(1, 'Registration Type is required'),
  rcNumber: z.string().min(1, 'RC Number is required'),
  registeredBusinessName: z.string().min(1, 'Registered Business Name is required'),
  taxIdentificationNumber: z.string().min(1, 'Tax Identification Number is required')
})

const vendorProfileCompletionSchema = z.object({
  vendorType: z.enum(VENDOR_TYPES),
  selfieImage: z.string().min(1, 'Selfie image is required'),
  identificationType: z.string().min(1, 'Identification type is required'),
  identificationNumber: z.string().min(1, 'Identification number is required'),
  taxIdentificationNumber: z.string().min(1, 'Tax Identification number is required'),
  gender: z.string().min(1, 'Gender is required')
})

export const validateVendorOnboarding = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = Math.random().toString(36).substring(7)
  logger.debug('Vendor Validation: Starting onboarding request validation', {
    requestId,
    body: req.body
  })

  try {
    const result = vendorOnboardingSchema.safeParse(req.body)

    if (!result.success) {
      logger.warn('Vendor Validation: Onboarding request validation failed', {
        requestId,
        errors: result.error.issues,
        body: req.body
      })

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      })
      return
    }

    logger.debug('Vendor Validation: Onboarding request validation successful', {
      requestId
    })

    // Attach validated data to request
    req.body = result.data
    next()
  } catch (error) {
    logger.error('Vendor Validation: Unexpected error during validation', {
      requestId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })

    res.status(500).json({
      success: false,
      message: 'Internal validation error'
    })
  }
}

const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank Name is required'),
  accountNumber: z.string().min(1, 'Account Number is required'),
  accountName: z.string().min(1, 'Account Name is required')
})

export const validateBankAccount = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = Math.random().toString(36).substring(7)
  logger.debug('Vendor Validation: Starting bank account request validation', {
    requestId,
    body: req.body
  })

  try {
    const result = bankAccountSchema.safeParse(req.body)

    if (!result.success) {
      logger.warn('Vendor Validation: Bank account request validation failed', {
        requestId,
        errors: result.error.issues,
        body: req.body
      })

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      })
      return
    }

    logger.debug('Vendor Validation: Bank account request validation successful', {
      requestId
    })

    // Attach validated data to request
    req.body = result.data
    next()
  } catch (error) {
    logger.error('Vendor Validation: Unexpected error during validation', {
      requestId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })

    res.status(500).json({
      success: false,
      message: 'Internal validation error'
    })
  }
}

export const validateUpgradeToRegistered = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = Math.random().toString(36).substring(7)
  logger.debug('Vendor Validation: Starting upgrade to registered request validation', {
    requestId,
    body: req.body
  })

  try {
    const result = upgradeToRegisteredSchema.safeParse(req.body)

    if (!result.success) {
      logger.warn('Vendor Validation: Upgrade request validation failed', {
        requestId,
        errors: result.error.issues,
        body: req.body
      })

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      })
      return
    }

    logger.debug('Vendor Validation: Upgrade request validation successful', {
      requestId
    })

    // Attach validated data to request
    req.body = result.data
    next()
  } catch (error) {
    logger.error('Vendor Validation: Unexpected error during validation', {
      requestId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })

    res.status(500).json({
      success: false,
      message: 'Internal validation error'
    })
  }
}

export const validateVendorProfileCompletion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = Math.random().toString(36).substring(7)
  logger.debug('Vendor Validation: Starting profile completion request validation', {
    requestId,
    body: req.body
  })

  try {
    const result = vendorProfileCompletionSchema.safeParse(req.body)

    if (!result.success) {
      logger.warn('Vendor Validation: Profile completion request validation failed', {
        requestId,
        errors: result.error.issues,
        body: req.body
      })

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
      })
      return
    }

    logger.debug('Vendor Validation: Profile completion request validation successful', {
      requestId
    })

    // Attach validated data to request
    req.body = result.data
    next()
  } catch (error) {
    logger.error('Vendor Validation: Unexpected error during validation', {
      requestId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })

    res.status(500).json({
      success: false,
      message: 'Internal validation error'
    })
  }
}
