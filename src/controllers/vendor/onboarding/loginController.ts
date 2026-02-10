import { Request, Response } from "express";
import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import logger from "../../../utils/logger.js";
import prisma from "../../../../prisma/prisma.js";
import { generateOTP } from "../../../utils/generateOTP.js";
import moment from "moment";
import { jwtService } from "../../../services/jwt/jwtService.js";

export const sendLoginOtp = asyncWrapper(
  async (req: Request, res: Response) => {
    const { phoneNumber: rawPhoneNumber } = req.body;

    if (!rawPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const phoneNumber = String(rawPhoneNumber);

    if (!/^\d+$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a number",
      });
    }

    try {
      // Check if vendor exists
      const vendor = await prisma.vendor.findFirst({
        where: {
          mobileNumber: phoneNumber,
        },
      });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found with this phone number",
        });
      }

      const otp = generateOTP();
      // Set expiry to 10 minutes from now
      const expiresAt = moment().add(10, "minutes").toDate();
      const type = "vendor_login";

      // Upsert the OTP record
      await prisma.otp.upsert({
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

      logger.info("Vendor login OTP generated", {
        phoneNumber,
        type,
      });

      res.status(200).json({
        success: true,
        message: "OTP generated successfully",
        data: {
          otp, // Returned for testing purposes
          phoneNumber,
        },
      });
    } catch (error) {
      logger.error("Failed to generate vendor login OTP", {
        error,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Failed to generate OTP",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export const verifyLoginOtp = asyncWrapper(
  async (req: Request, res: Response) => {
    const { phoneNumber: rawPhoneNumber, otp } = req.body;

    if (!rawPhoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const phoneNumber = String(rawPhoneNumber);

    if (!/^\d+$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a number",
      });
    }

    const type = "vendor_login";

    try {
      // Find OTP record
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

      // OTP is valid, fetch vendor
      const vendor = await prisma.vendor.findFirst({
        where: {
          mobileNumber: phoneNumber,
        },
        include: {
          currentPlan: true,
        },
      });

      if (!vendor) {
        // This shouldn't happen if sendOtp checked, but good for safety
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }

      // Delete used OTP
      await prisma.otp.delete({
        where: {
          id: otpRecord.id,
        },
      });

      // Generate Token
      const token = jwtService.generateToken({
        id: vendor.id,
        role: "VENDOR",
        planId: vendor.currentPlan?.id || null,
      });

      logger.info("Vendor logged in successfully", {
        vendorId: vendor.id,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          vendor: {
            id: vendor.id,
            firstName: vendor.firstName,
            lastName: vendor.lastName,
            email: vendor.email,
            mobileNumber: vendor.mobileNumber,
            businessType: vendor.businessType,
          },
        },
      });
    } catch (error) {
      logger.error("Failed to verify vendor login OTP", {
        error,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Failed to verify OTP",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);
