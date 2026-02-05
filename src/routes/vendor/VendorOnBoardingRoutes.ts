import express from 'express'
import { onBoardVendor } from '../../controllers/vendor/onboarding/index.js'
import { validateVendorOnboarding } from '../../middlewares/vendorValidation.js'

const router = express.Router()

router.post('/onboard', validateVendorOnboarding, onBoardVendor)

export { router as vendorOnboardingRoutes }
