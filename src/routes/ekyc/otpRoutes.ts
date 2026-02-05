import express from 'express'
import { sendOtp, verifyOtp } from '../../controllers/ekyc/phoneNumberVerificationController.js'

const router = express.Router()

router.post('/generate-otp', sendOtp)
router.post('/verify-otp', verifyOtp)

export { router as otpRoutes }
