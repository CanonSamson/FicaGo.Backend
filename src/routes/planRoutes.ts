import express from 'express'
import { getPlans } from '../controllers/plans/plansController.js'
import { verifyUserToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', verifyUserToken, getPlans)

export { router as planRoutes }
