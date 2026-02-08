import prisma from '../../prisma/prisma.js'
import logger from '../utils/logger.js'

export interface ServiceResponse {
  success: boolean
  data: any
  error: any
  message?: string
  code: number
}

export class EkycService {
  async checkUserExists(email?: string, phoneNumber?: string): Promise<ServiceResponse> {
    try {
      if (!email && !phoneNumber) {
        return {
          success: false,
          data: null,
          error: 'Missing credentials',
          message: 'Email or phone number is required',
          code: 400
        }
      }

      const whereClause: any = { OR: [] }

      if (email) {
        whereClause.OR.push({ email })
      }

      if (phoneNumber) {
        // Ensure phoneNumber is a string as per schema
        whereClause.OR.push({ mobileNumber: String(phoneNumber) })
      }

      const user = await prisma.vendor.findFirst({
        where: whereClause
      })

      if (user) {
        return {
          success: true,
          data: {
            exists: true,
            field: user.email === email ? 'email' : 'phoneNumber'
          },
          error: null,
          message: 'User exists',
          code: 200
        }
      }

      return {
        success: true,
        data: {
          exists: false
        },
        error: null,
        message: 'User does not exist',
        code: 200
      }
    } catch (error) {
      logger.error('Check user existence failed', { error })
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Internal server error',
        code: 500
      }
    }
  }
}

export const ekycService = new EkycService()
