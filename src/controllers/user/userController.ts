import { Request, Response } from "express";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import logger from "../../utils/logger.js";
import prisma from "../../../prisma/prisma.js";
import { jwtService, TokenPayload } from "../../services/jwt/jwtService.js";
import { userService } from "../../services/userService.js";

export const onboardUser = asyncWrapper(async (req: Request, res: Response) => {
  const { fullName, email, mobileNumber, dateOfBirth } = req.body;

  try {
    const { user, token } = await userService.createUser({
      fullName,
      email,
      mobileNumber,
      dateOfBirth,
    });

    res.status(201).json({
      success: true,
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

    logger.error("Failed to onboard user", {
      error,
      body: req.body,
    });
    res
      .status(500)
      .json({ success: false, message: "Failed to onboard user", error });
  }
});

export const updateUserProfile = asyncWrapper(async (req: Request, res: Response) => {
  const id = (req as any).id; 
  const { fullName, gender, dateOfBirth } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Failed to update user profile", {
      userId: id,
      error,
    });
    res.status(500).json({ success: false, message: "Failed to update profile", error });
  }
});
