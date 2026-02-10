import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import logger from "../../../utils/logger.js";
import prisma from "../../../../prisma/prisma.js";
import { sendEmail } from "../../../services/emailService.js";
import { jwtService, TokenPayload } from "../../../services/jwt/jwtService.js";

export const onBoardVendor = asyncWrapper(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    businessType,
    mobileNumber,
    serviceCategory,
    skills,
  } = req.body;

  try {
    // Check if vendor already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { email },
    });

    if (existingVendor) {
      logger.warn("Vendor onboarding failed: Vendor already exists", { email });
      return res.status(409).json({
        success: false,
        message: "Vendor with this email already exists",
      });
    }

    // Create new vendor
    const newVendor = await prisma.vendor.create({
      data: {
        firstName,
        lastName,
        email,
        businessType,
        mobileNumber,
        serviceCategory,
        skills,
      },
    });

    logger.info("Successfully onboarded vendor", {
      vendorId: newVendor.id,
      email,
    });

    // Generate JWT token
    const tokenPayload: TokenPayload = {
      id: newVendor.id,
      role: "VENDOR",
      planId: "FREE",
    };
    const token = jwtService.generateToken(tokenPayload);

    // Send welcome email (fire and forget or await depending on requirement, using await for reliability here)
    try {
      // await sendEmail(
      //     email,
      //     'Welcome to FicaGo!',
      //     'welcome-email', // Using the existing template
      //     {
      //         name: firstName,
      //         // Add other placeholders if the template expects them
      //     }
      // )
      logger.debug("Welcome email sent to vendor", { email });
    } catch (emailError) {
      // Don't fail the request if email fails, just log it
      logger.error("Failed to send welcome email to vendor", {
        email,
        error: emailError,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        token,
        vendor: newVendor,
      },
    });
  } catch (error) {
    logger.error("Failed to onboard vendor", {
      error,
      body: req.body,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to onboard vendor", error });
  }
});
