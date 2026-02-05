import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import logger from '../utils/logger.js'

const vendorOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  businessType: z.string().min(1, 'Business type is required'),
  mobileNumber: z.string().min(1, 'Mobile number is required'),
  serviceCategory: z.string().min(1, 'Service category is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required')
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
