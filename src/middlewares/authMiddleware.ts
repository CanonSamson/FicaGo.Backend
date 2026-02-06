import { Request, Response, NextFunction } from 'express'
import { jwtService } from '../services/jwt/jwtService.js'

// Middleware to check if the user's token is verified
export const verifyUserToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1] // Extract token from the Authorization header

  if (!token) {
    res.status(401).json({ message: 'Token not provided' })
    return // Ensure the function exits here
  }

  try {
    const decoded = jwtService.verifyToken(token)
    req.id = decoded.id 
    req.role = decoded.role
    req.plan = decoded.plan
    next() // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}
