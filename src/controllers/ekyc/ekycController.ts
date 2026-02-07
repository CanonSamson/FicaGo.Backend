import asyncWrapper from '../../middlewares/asyncWrapper.js'
import { Request, Response } from 'express'
import { ekycService } from '../../services/ekycService.js'

export const checkUserExists = asyncWrapper(async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body
  const result = await ekycService.checkUserExists(email, phoneNumber)
  
  res.status(result.code).json(result)
})
