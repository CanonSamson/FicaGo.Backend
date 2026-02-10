import jwt, { SignOptions } from 'jsonwebtoken'
import logger from '../../utils/logger.js'

export interface TokenPayload {
  id: string
  role: 'VENDOR' | 'USER'
  planId?: string | null
}

export class JwtService {
  private readonly secretKey: string

  constructor() {
    this.secretKey = process.env.JWT_SECRET_KEY || 'default_secret_key'
    if (!process.env.JWT_SECRET_KEY) {
      logger.warn('JWT_SECRET_KEY is not set in environment variables, using default key')
    }
  }


  public generateToken(payload: TokenPayload, expiresIn: string | number = '1d'): string {
    try {
      // Cast expiresIn to any to avoid strict type checking issues with StringValue in @types/jsonwebtoken
      const options: SignOptions = { expiresIn: expiresIn as any }
      return jwt.sign(payload, this.secretKey, options)
    } catch (error: any) {
      logger.error('Error generating token', { error: error.message || error })
      throw new Error('Failed to generate token')
    }
  }

 
  public verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.secretKey) as TokenPayload
    } catch (error) {
      logger.error('Error verifying token', { error })
      throw new Error('Invalid or expired token')
    }
  }
}

export const jwtService = new JwtService()
