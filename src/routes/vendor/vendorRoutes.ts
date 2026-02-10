import express from "express";

import { getCurrentVendor } from "../../controllers/vendor/vendorController.js";
import { verifyUserToken } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", verifyUserToken, getCurrentVendor);

export const vendorRoutes = router;
