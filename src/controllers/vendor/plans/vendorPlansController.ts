import { Request, Response } from "express";
import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import prisma from "../../../../prisma/prisma.js";
import logger from "../../../utils/logger.js";
import { alatPayMockedService } from "../../../services/alatPayMockedService.js";
import { transactionService } from "../../../services/transactionService.js";

export const initiatePlanPayment = asyncWrapper(
  async (req: Request, res: Response) => {
    const { planId } = req.body || {};

    if (!planId || typeof planId !== "string") {
      res.status(400).json({ success: false, message: "planId is required" });
      return;
    }

    try {
      const vendorId = req.id;
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        res.status(404).json({ success: false, message: "Vendor not found" });
        return;
      }

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        res.status(404).json({ success: false, message: "Plan not found" });
        return;
      }

      const orderId = `plan-${plan.id}-${vendor.id}-${Date.now()}`;
      const description = `Subscription to ${plan.name}`;

      logger.info("Initiating vendor plan payment", {
        vendorId: vendor.id,
        planId: plan.id,
        orderId,
        amount: plan.price,
        currency: plan.currency,
      });

      const txResponse = await transactionService.create({
        userId: vendor.id,
        amount: plan.price,
        type: "PLAN_SUBSCRIPTION",
        reference: orderId,
        currency: plan.currency,
        description,
        paymentType: "BANK_TRANSFER",
        transactionType: "SUBSCRIPTION",
        gateway: "ALATPAY",
      });

      if (!txResponse.success || !txResponse.data) {
        logger.error("Failed to create transaction record", {
          vendorId: vendor.id,
          error: txResponse.error,
        });
        res
          .status(500)
          .json({
            success: false,
            message: "Failed to create transaction record",
          });
        return;
      }

      const createdTx = txResponse.data;

      const result = await alatPayMockedService.generateVirtualAccount({
        amount: plan.price,
        currency: plan.currency,
        orderId,
        description,
        customer: {
          email: vendor.email,
          phone: vendor.mobileNumber,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          metadata: { vendorId: vendor.id, planId: plan.id },
        },
      });

      if (!result.success) {
        logger.error("Failed to generate virtual account for plan payment", {
          vendorId: vendor.id,
          planId: plan.id,
          error: result.error,
        });
        await transactionService.update(createdTx.id, {
          status: "FAILED",
          metadata: result.error ? { error: result.error } : undefined,
        });
        res.status(400).json({
          success: false,
          message: result.error || "Failed to initiate payment",
        });
        return;
      }

      await transactionService.update(createdTx.id, {
        externalReference: result.data?.transactionId,
        metadata: result.data,
      });

      res.status(200).json({
        success: true,
        message: "Virtual account generated successfully",
        data: {
          ...result.data,
          callbackEndpoint: "/v1/api/vendor/plans/payment-callback",
          transactionId: createdTx.id,
          reference: orderId,
        },
      });
    } catch (error: any) {
      logger.error("Unexpected error initiating plan payment", {
        error: error.message || error,
      });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
);

export const paymentCallback = asyncWrapper(
  async (req: Request, res: Response) => {
    const { transactionId } = req.body || {};

    if (!transactionId || typeof transactionId !== "string") {
      res
        .status(400)
        .json({ success: false, message: "transactionId is required" });
      return;
    }

    try {
      logger.info("Received plan payment callback", { transactionId });

      const statusResult =
        await alatPayMockedService.confirmTransactionStatus(transactionId);

      if (!statusResult.success) {
        logger.warn("Callback verification failed", {
          transactionId,
          error: statusResult.error,
        });
        res.status(400).json({
          success: false,
          message: statusResult.error || "Callback verification failed",
        });
        return;
      }

      const status = statusResult.data?.status;
      const isValidated = !!statusResult.data?.isCallbackValidated;

      logger.info("Plan payment status confirmed", {
        transactionId,
        status,
        isValidated,
      });

      res.status(200).json({
        success: true,
        message: "Callback received",
        data: {
          status,
          isValidated,
          transaction: statusResult.data,
        },
      });
    } catch (error: any) {
      logger.error("Unexpected error handling payment callback", {
        error: error.message || error,
      });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },
);
