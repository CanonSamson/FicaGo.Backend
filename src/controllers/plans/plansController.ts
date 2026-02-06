import { Request, Response } from 'express'
import prisma from '../../../prisma/prisma.js'
import asyncWrapper from '../../middlewares/asyncWrapper.js'
import logger from '../../utils/logger.js'

/**
 * @desc    Get all plans
 * @route   GET /v1/api/plans
 * @access  Public
 */
export const getPlans = asyncWrapper(async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        role: req.role
      },
      orderBy: {
        price: 'asc'
      }
    })

    logger.info('Plans fetched successfully', { count: plans.length, role: req.role })

    res.status(200).json({
      success: true,
      message: 'Plans fetched successfully',
      data: plans
    })
  } catch (error) {
    logger.error('Error fetching plans:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans'
    })
  }
})
