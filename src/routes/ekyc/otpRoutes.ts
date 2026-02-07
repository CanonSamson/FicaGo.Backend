import express from 'express'
import { sendOtp, verifyOtp } from '../../controllers/ekyc/phoneNumberVerificationController.js'
import { checkUserExists } from '../../controllers/ekyc/ekycController.js'

const router = express.Router()

router.post('/generate-otp', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/check-user', checkUserExists)

export { router as otpRoutes }
