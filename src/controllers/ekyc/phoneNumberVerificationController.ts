import asyncWrapper from "../../middlewares/asyncWrapper.js";
import logger from "../../utils/logger.js";
import prisma from "../../../prisma/prisma.js";
import { generateOTP } from "../../utils/generateOTP.js";
import moment from "moment";
import { ekycService } from "../../services/ekycService.js";
import { jwtService } from "../../services/jwt/jwtService.js";

export const sendOtp = asyncWrapper(async (req, res) => {
  const { email, phoneNumber, type } = req.body;

  if (!phoneNumber || !type) {
    return res.status(400).json({
      success: false,
      message: "Phone number and type are required",
    });
  }

  // Check if user exists based on type
  if (type === "VENDOR_REGISTRATION" || type === "VENDOR_LOGIN") {
    const userCheck = await ekycService.checkUserExists(
      email || undefined,
      phoneNumber,
    );

    if (userCheck.code !== 200) {
      return res.status(userCheck.code).json({
        success: false,
        message: userCheck.message,
        error: userCheck.error,
      });
    }

    if (type === "VENDOR_REGISTRATION" && userCheck.data?.exists) {
      return res.status(400).json({
        success: false,
        message:
          userCheck.data?.field === "email"
            ? "User with this email already exists"
            : "User with this phone number already exists",
      });
    }

    if (type === "VENDOR_LOGIN" && !userCheck.data?.exists) {
      return res.status(400).json({
        success: false,
        message: "User with this phone number does not exist",
      });
    }
  }

  try {
    const otp = generateOTP();
    // Set expiry to 10 minutes from now
    const expiresAt = moment().add(10, "minutes").toDate();

    // Upsert the OTP record: update if exists for this phone+type, otherwise create
    const otpRecord = await prisma.otp.upsert({
      where: {
        phoneNumber_type: {
          phoneNumber,
          type,
        },
      },
      update: {
        otp,
        expiresAt,
        updatedAt: new Date(),
      },
      create: {
        phoneNumber,
        type,
        otp,
        expiresAt,
      },
    });

    logger.info("OTP generated and stored", {
      otpId: otpRecord.id,
      phoneNumber,
      type,
    });

    // In a real scenario, we would send the OTP via SMS here.
    // For now, we return it in the response as requested.

    res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      data: {
        otp, // Returned for testing/verification purposes
        phoneNumber,
        type,
        expiresAt,
      },
    });
  } catch (error) {
    logger.error("Failed to generate OTP", {
      error,
      body: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Failed to generate OTP",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export const verifyOtp = asyncWrapper(async (req, res) => {
  const { phoneNumber, otp, type } = req.body;

  if (!phoneNumber || !otp || !type) {
    return res.status(400).json({
      success: false,
      message: "Phone number, OTP, and type are required",
    });
  }

  try {
    const otpRecord = await prisma.otp.findUnique({
      where: {
        phoneNumber_type: {
          phoneNumber,
          type,
        },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or phone number",
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (moment().isAfter(otpRecord.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // OTP is valid. Delete it to prevent reuse.
    await prisma.otp.delete({
      where: {
        id: otpRecord.id,
      },
    });

    logger.info("OTP verified successfully", {
      phoneNumber,
      type,
    });

    // If this OTP is for login, issue JWT token
    const isLogin = String(type).toUpperCase().includes("VENDOR_LOGIN");
    if (isLogin) {
      const vendor = await prisma.vendor.findFirst({
        where: { mobileNumber: String(phoneNumber) },
        include: {
          currentPlan: true,
        },
      });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      const token = jwtService.generateToken({
        id: vendor.id,
        role: "VENDOR",
        planId: vendor.currentPlan?.id || null,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          vendor: vendor,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    logger.error("Failed to verify OTP", {
      error,
      body: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
