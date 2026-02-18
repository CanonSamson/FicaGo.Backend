import express from "express";

import {
  getCurrentVendor,
  updateVendorDetails,
  upgradeToRegisteredVendor,
  completeVendorProfile,
  setupBankAccount,
  submitOnboardingForReview,
  getOnboardingStatus,
  getOnboardingStepStatuses,
  getProfileCompletionPercent,
} from "../../controllers/vendor/vendorController.js";
import { verifyUserToken } from "../../middlewares/authMiddleware.js";
import { validateUpgradeToRegistered, validateVendorProfileCompletion, validateBankAccount } from "../../middlewares/vendorValidation.js";

const router = express.Router();

router.get("/me", verifyUserToken, getCurrentVendor);
router.patch("/me", verifyUserToken, updateVendorDetails);
router.post("/upgrade/registered", verifyUserToken, validateUpgradeToRegistered, upgradeToRegisteredVendor);
router.post("/complete-profile", verifyUserToken, validateVendorProfileCompletion, completeVendorProfile);
router.post("/bank-account", verifyUserToken, validateBankAccount, setupBankAccount);
router.post("/onboarding/submit", verifyUserToken, submitOnboardingForReview);
router.get("/onboarding/status", verifyUserToken, getOnboardingStatus);
router.get("/onboarding/steps", verifyUserToken, getOnboardingStepStatuses);
router.get("/profile/completion", verifyUserToken, getProfileCompletionPercent);

export const vendorRoutes = router;
