import prisma from "../../../prisma/prisma.js";
import logger from "../../utils/logger.js";
import { sendEmail } from "../../services/emailService.js";
import moment from "moment";

export class SubscriptionService {
  async activateSubscription(
    vendorId: string,
    planId: string,
    requestId?: string,
  ) {
    if (!vendorId || !planId) {
      logger.warn(
        "Subscription activation failed: Missing vendorId or planId",
        {
          requestId,
          vendorId,
          planId,
        },
      );
      return null;
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    const plan = await prisma.plan.findUnique({ where: { id: planId } });

    if (!vendor || !plan) {
      logger.warn("Subscription activation failed: Vendor or Plan not found", {
        requestId,
        vendorId,
        planId,
        vendorFound: !!vendor,
        planFound: !!plan,
      });
      return null;
    }

    // Calculate expiration
    let expiresAt = moment().add(1, "month").toDate(); // Default
    if (plan.interval === "YEARLY" || plan.interval === "annually") {
      expiresAt = moment().add(1, "year").toDate();
    } else if (plan.interval === "WEEKLY") {
      expiresAt = moment().add(1, "week").toDate();
    }

    // Create subscription
    const subscription = await prisma.vendorSubscription.create({
      data: {
        vendorId: vendor.id,
        planId: plan.id,
        status: "ACTIVE",
        startedAt: new Date(),
        expiresAt: expiresAt,
      },
    });

    // Update Vendor
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        currentPlanId: plan.id,
        planStartedAt: new Date(),
        planExpiresAt: expiresAt,
      },
    });

    // Send Email
    try {
      await sendEmail(
        vendor.email,
        `Subscription Confirmed: ${plan.name}`,
        "default", // Using default template for now, or create a specific one
        {
          title: "Subscription Activated",
          text: `Your subscription to ${plan.name} has been successfully activated. It will expire on ${moment(expiresAt).format("MMMM Do YYYY")}.`,
        },
        "ficago" as any, // Assuming 'ficago' is a valid 'from' or generic
      );
      logger.info("Vendor subscription email sent", {
        requestId,
        vendorId: vendor.id,
      });
    } catch (emailError) {
      logger.error("Failed to send subscription email", {
        requestId,
        error: emailError,
      });
    }

    return subscription;
  }
}

export const subscriptionService = new SubscriptionService();
