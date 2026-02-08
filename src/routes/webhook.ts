import { Router } from "express";
import { handleFlutterwaveWebhook } from "../controllers/webhookController.js";

const router = Router();

// Flutterwave webhook endpoint
router.post("/", handleFlutterwaveWebhook);
router.post("/failed", handleFlutterwaveWebhook);

export const webhookRoutes = router;
