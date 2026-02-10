import { Request, Response } from "express";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import logger from "../../utils/logger.js";
import prisma from "../../../prisma/prisma.js";

export const getCurrentVendor = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    try {
      const vendor = await prisma.vendor.findUnique({
        where: {
          id: vendorId,
        },
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

      logger.info("Current vendor fetched successfully", { vendorId });

      res.status(200).json({
        success: true,
        message: "Vendor profile fetched successfully",
        data: vendor,
      });
    } catch (error: any) {
      logger.error("Error fetching current vendor:", {
        error: error.message,
        stack: error.stack,
        vendorId,
      });
      res.status(500).json({
        success: false,
        message: "Failed to fetch vendor profile",
      });
    }
  },
);
