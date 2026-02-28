import express from "express";
import { onboardUser, updateUserProfile } from "../../controllers/user/userController.js";
import {
  sendAuthOtp,
  verifyAuthOtp,
} from "../../controllers/user/authController.js";
import { verifyUserToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/onboard", onboardUser);
router.post("/auth/send-otp", sendAuthOtp);
router.post("/auth/verify-otp", verifyAuthOtp);
router.put("/profile", verifyUserToken, updateUserProfile);

export default router;
