import { Request, Response } from "express";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import logger from "../../utils/logger.js";
import prisma from "../../../prisma/prisma.js";
import { generateOTP } from "../../utils/generateOTP.js";
import moment from "moment";
import { jwtService } from "../../services/jwt/jwtService.js";
import { userService } from "../../services/userService.js";

export const sendAuthOtp = asyncWrapper(
  async (req: Request, res: Response) => {
    const { phoneNumber: rawPhoneNumber, type = "USER_LOGIN" } = req.body;

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

    if (type !== "USER_LOGIN" && type !== "USER_REGISTRATION") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP type",
      });
    }

    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: {
          mobileNumber: phoneNumber,
        },
      });

      if (type === "USER_LOGIN") {
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found with this phone number",
          });
        }
      } else if (type === "USER_REGISTRATION") {
        if (user) {
          return res.status(409).json({
            success: false,
            message: "User with this phone number already exists",
          });
        }
      }

      const otp = generateOTP();
      // Set expiry to 10 minutes from now
      const expiresAt = moment().add(10, "minutes").toDate();

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

      logger.info(`User ${type} OTP generated`, {
        phoneNumber,
        type,
      });

      res.status(200).json({
        success: true,
        message: "OTP generated successfully",
        data: {
          otp, // Returned for testing purposes
          phoneNumber,
          expiresAt: expiresAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error(`Failed to generate user ${type} OTP`, {
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

export const verifyAuthOtp = asyncWrapper(
  async (req: Request, res: Response) => {
    const { phoneNumber: rawPhoneNumber, otp, type = "USER_LOGIN" } = req.body;

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

    if (type !== "USER_LOGIN" && type !== "USER_REGISTRATION") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP type",
      });
    }

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

      // Delete used OTP
      await prisma.otp.delete({
        where: {
          id: otpRecord.id,
        },
      });

      if (type === "USER_LOGIN") {
        // OTP is valid, fetch user
        const user = await prisma.user.findUnique({
          where: {
            mobileNumber: phoneNumber,
          },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        // Generate Token
        const token = jwtService.generateToken({
          id: user.id,
          role: "USER",
        });

        logger.info("User logged in successfully", {
          userId: user.id,
        });

        res.status(200).json({
          success: true,
          message: "Login successful",
          data: {
            token,
            user,
          },
        });
      } else if (type === "USER_REGISTRATION") {
        const { fullName, email, dateOfBirth } = req.body;
        
        logger.info("User phone number verified, proceeding to create user", {
          phoneNumber,
        });

        try {
          const { user, token } = await userService.createUser({
            fullName,
            email,
            mobileNumber: phoneNumber,
            dateOfBirth,
          });

          res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
              token,
              user,
            },
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes("User with this email or mobile number already exists")) {
            return res.status(409).json({
              success: false,
              message: error.message,
            });
          }
          throw error;
        }
      }
    } catch (error) {
      logger.error(`Failed to verify user ${type} OTP`, {
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
