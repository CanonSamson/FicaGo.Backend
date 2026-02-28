import prisma from "../../prisma/prisma.js";
import { jwtService, TokenPayload } from "./jwt/jwtService.js";
import logger from "../utils/logger.js";

export const userService = {
  async createUser(data: {
    fullName: string;
    email: string;
    mobileNumber: string;
    dateOfBirth?: string | Date;
  }) {
    const { fullName, email, mobileNumber, dateOfBirth } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobileNumber }],
      },
    });

    if (existingUser) {
      logger.warn("User creation failed: User already exists", {
        email,
        mobileNumber,
      });
      throw new Error("User with this email or mobile number already exists");
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        mobileNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    logger.info("Successfully created user", {
      userId: newUser.id,
      email,
    });

    // Generate JWT token
    const tokenPayload: TokenPayload = {
      id: newUser.id,
      role: "USER",
    };
    const token = jwtService.generateToken(tokenPayload);

    return {
      user: newUser,
      token,
    };
  },
};
