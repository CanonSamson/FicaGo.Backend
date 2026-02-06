import express from 'express'
import { onBoardVendor } from '../../controllers/vendor/onboarding/index.js'
import {
  sendLoginOtp,
  verifyLoginOtp,
} from '../../controllers/vendor/onboarding/loginController.js'
import { validateVendorOnboarding } from '../../middlewares/vendorValidation.js'

const router = express.Router()

router.post('/onboard', validateVendorOnboarding, onBoardVendor)
router.post('/login/send-otp', sendLoginOtp)
router.post('/login/verify-otp', verifyLoginOtp)

export { router as vendorOnboardingRoutes }
