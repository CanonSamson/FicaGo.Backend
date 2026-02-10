import express from "express";
import { verifyUserToken } from "../../middlewares/authMiddleware.js";
import {
  initiatePlanPayment,
  paymentCallback,
  checkPlanPaymentStatus,
} from "../../controllers/vendor/plans/vendorPlansController.js";

const router = express.Router();

router.post("/plans/initiate-payment", verifyUserToken, initiatePlanPayment);
router.post("/plans/payment-callback", paymentCallback);
router.post(
  "/plans/check-status/:transactionId",
  verifyUserToken,
  checkPlanPaymentStatus,
);

export { router as vendorPlansRoutes };
