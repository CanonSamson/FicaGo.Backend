import { Request, Response } from "express";
import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import prisma from "../../../../prisma/prisma.js";
import logger from "../../../utils/logger.js";
import { transactionService } from "../../../services/transactionService.js";
import { subscriptionService } from "../../../services/vendor/subscriptionService.js";
import { flutterwaveService } from "../../../services/flutterwave/index.js";
import { PaymentInitializationData } from "../../../types/flutterwave.js";

export const initiatePlanPayment = asyncWrapper(
  async (req: Request, res: Response) => {
    const { planId } = req.body || {};

    if (!planId || typeof planId !== "string") {
      res.status(400).json({ success: false, message: "planId is required" });
      return;
    }

    try {
      const vendorId = req?.id as string;
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        res.status(404).json({ success: false, message: "Vendor not found" });
        return;
      }

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.externalPlanId) {
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
        gateway: "FLUTTERWAVE",
        metadata: {
          planId: plan.id,
          vendorId: vendor.id,
        },
      });

      if (!txResponse.success || !txResponse.data) {
        logger.error("Failed to create transaction record", {
          vendorId: vendor.id,
          error: txResponse.error,
        });
        res.status(500).json({
          success: false,
          message: "Failed to create transaction record",
        });
        return;
      }

      const createdTx = txResponse.data;

      const paymentData: PaymentInitializationData = {
        amount: plan.price,
        currency: plan.currency || "NGN",
        customerEmail: vendor.email,
        customerName: `${vendor.firstName} ${vendor.lastName}`,
        customerPhone: vendor.mobileNumber,
        tenantId: vendor.id, // Using vendorId as tenantId
        redirectUrl: `${process.env.FRONTEND_URL}/payment/callback`,
        reference: orderId,
        payment_plan: plan.externalPlanId,
        title: `Subscription to ${plan.name}`,
        description: description,
        metadata: {
          vendorId: vendor.id,
          planId: plan.id,
          transactionId: createdTx.id,
        },
      };

      let result;
      try {
        result = await flutterwaveService.initializePayment(paymentData);
      } catch (error: any) {
        logger.error("Failed to generate payment link for plan payment", {
          vendorId: vendor.id,
          planId: plan.id,
          error: error.message,
        });
        await transactionService.update(createdTx.id, {
          status: "FAILED",
          metadata: { error: error.message },
        });
        res.status(400).json({
          success: false,
          message: error.message || "Failed to initiate payment",
        });
        return;
      }

      await transactionService.update(createdTx.id, {
        metadata: { ...createdTx.metadata, flutterwaveData: result.data },
      });

      res.status(200).json({
        success: true,
        message: "Payment link generated successfully",
        data: {
          link: result.data.link,
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
    const { transactionId, tx_ref } = req.body || {};

    if (!tx_ref && !transactionId) {
      res.status(400).json({
        success: false,
        message: "tx_ref or transactionId is required",
      });
      return;
    }

    try {
      logger.info("Received plan payment callback", { transactionId, tx_ref });

      let verificationData;

      if (tx_ref) {
        verificationData =
          await flutterwaveService.verifyPaymentWithReference(tx_ref);
      } else {
        // Fallback if we only have numeric transaction ID from FW (unlikely in this context but good to have)
        // But the prompt specifically asked to use verifyPaymentWithReference.
        // If we only have transactionId (numeric ID from FW), we can't use verifyPaymentWithReference easily unless we know it's a ref.
        // Assuming tx_ref is passed. If not, and we have transactionId, we might need to use verifyPayment.
        // However, the prompt emphasized using the reference method.
        verificationData =
          await flutterwaveService.verifyPayment(transactionId);
      }

      if (!verificationData || verificationData.status !== "successful") {
        logger.warn("Callback verification failed", {
          transactionId,
          tx_ref,
          status: verificationData?.status,
        });
        res.status(400).json({
          success: false,
          message: "Callback verification failed or payment not successful",
        });
        return;
      }

      const status = verificationData.status;
      const isValidated = status === "successful";

      logger.info("Plan payment status confirmed", {
        tx_ref,
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
          transaction: verificationData,
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

export const checkPlanPaymentStatus = asyncWrapper(
  async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const requestId = Math.random().toString(36).substring(7);

    logger.info("Transaction status confirmation request initiated", {
      requestId,
      transactionId,
      timestamp: new Date().toISOString(),
    });

    // Validate transaction ID
    if (
      !transactionId ||
      typeof transactionId !== "string" ||
      transactionId.trim().length === 0
    ) {
      logger.warn(
        "Transaction status confirmation failed - invalid transaction ID",
        {
          requestId,
          transactionId,
          providedType: typeof transactionId,
        },
      );
      return res.status(400).json({
        success: false,
        message: "Valid transaction ID is required",
        requestId,
      });
    }

    try {
      // Check if transaction exists in Prisma
      let transactionRecord = await prisma.transaction.findFirst({
        where: {
          OR: [
            { id: transactionId },
            { externalReference: transactionId },
            { reference: transactionId }, // orderId
          ],
        },
      });

      if (!transactionRecord) {
        logger.warn(
          "Transaction status confirmation failed - transaction not found",
          {
            requestId,
            transactionId,
          },
        );
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
          requestId,
        });
      }

      // Check if transaction is already processed
      if (
        transactionRecord.status === "SUCCESSFUL" ||
        transactionRecord.status === "COMPLETED" ||
        transactionRecord.status === "PAID"
      ) {
        logger.info("Transaction status is already processed", {
          requestId,
          transactionId,
          status: transactionRecord.status,
        });
        return res.status(200).json({
          success: true,
          message: "Transaction status is already processed",
          requestId,
          data: transactionRecord,
        });
      }

      // Call Flutterwave service to confirm transaction status using reference
      const txRef = transactionRecord.reference; // This corresponds to orderId/tx_ref sent to FW

      if (!txRef) {
        logger.warn("Transaction record missing reference", {
          requestId,
          transactionId,
        });
        return res.status(400).json({
          success: false,
          message: "Transaction reference missing, cannot verify status",
          requestId,
        });
      }

      logger.debug("Calling Flutterwave service for transaction status", {
        requestId,
        txRef,
      });

      let result;
      try {
        // Use verifyPaymentWithReference as requested
        result = await flutterwaveService.verifyPaymentWithReference(txRef);
      } catch (error: any) {
        logger.warn(
          "Flutterwave service returned error for transaction status",
          {
            requestId,
            transactionId,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        );

        // Update DB with failed status check
        const updateData = {
          metadata: {
            ...(transactionRecord.metadata as object),
            statusCheckFailed: true,
            statusCheckError: error.message,
            lastStatusCheckAt: new Date().toISOString(),
          },
        };

        await prisma.transaction.update({
          where: { id: transactionRecord.id },
          data: updateData,
        });

        return res.status(400).json({
          success: false,
          message: "Failed to verify transaction status",
          error: error.message,
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      if (result && result.status === "successful") {
        const newStatus = "SUCCESSFUL"; // Flutterwave status is lowercase 'successful'
        const updateData: any = {
          status: newStatus,
          updatedAt: new Date(),
          metadata: {
            ...(transactionRecord.metadata as object),
            flutterwaveResponse: result,
            paymentConfirmedAt: new Date().toISOString(),
          },
        };

        // Update transaction in DB
        await prisma.transaction.update({
          where: { id: transactionRecord.id },
          data: updateData,
        });

        logger.info("Transaction record updated successfully", {
          requestId,
          transactionId: transactionRecord.id,
          newStatus,
          timestamp: new Date().toISOString(),
        });

        // If payment is successful, activate plan for vendor
        let subscription = null;
        const vendorId = transactionRecord.userId;
        const meta = transactionRecord.metadata as any;
        const planId = meta?.planId;

        if (vendorId && planId) {
          subscription = await subscriptionService.activateSubscription(
            vendorId,
            planId,
            requestId,
          );
        }

        res.status(200).json({
          success: true,
          message: "Transaction status retrieved successfully",
          data: {
            ...result,
            transactionRecord: {
              ...transactionRecord,
              ...updateData,
            },
            subscription,
          },
          requestId,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Handle pending or failed status
        const currentStatus = result.status.toUpperCase();

        // Update DB
        await prisma.transaction.update({
          where: { id: transactionRecord.id },
          data: {
            status: currentStatus === "SUCCESSFUL" ? "SUCCESSFUL" : "PENDING", // Map to internal status if needed, or keep PENDING
            // If failed, maybe update to FAILED
          },
        });

        res.status(400).json({
          success: false,
          message:
            "Your transaction is being processed or failed. Please check again.",
          data: result,
          requestId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      logger.error("Unexpected error during transaction status confirmation", {
        requestId,
        transactionId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      return res.status(500).json({
        success: false,
        message: "Internal server error during transaction status confirmation",
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  },
);
