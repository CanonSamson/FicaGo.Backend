import express from "express";
import { verifyUserToken } from "../../middlewares/authMiddleware.js";
import {
  initiatePlanPayment,
  paymentCallback,
} from "../../controllers/vendor/plans/vendorPlansController.js";

const router = express.Router();

router.post("/plans/initiate-payment", verifyUserToken, initiatePlanPayment);
router.post("/plans/payment-callback", paymentCallback);

export { router as vendorPlansRoutes };
