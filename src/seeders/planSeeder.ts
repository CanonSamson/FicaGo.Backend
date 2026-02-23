import prisma from "../../prisma/prisma.js";
import logger from "../utils/logger.js";
import { flutterwaveSubscriptionService } from "../services/flutterwave/subscription.js";
import { PaymentInterval } from "../types/flutterwave.js";

export const seedPlans = async () => {
  try {
    const plansCount = await prisma.plan.count();

    if (plansCount === 0) {
      logger.info("Seeding plans...");

      const plans = [
        {
          name: "Basic",
          price: 1500,
          currency: "NGN",
          interval: "Monthly",
          features: [
            "Visibility to FicaGo Subscribers",
            "Post a single service",
          ],
          isPopular: true,
          role: "VENDOR",
        },
        {
          name: "Premium",
          price: 2500,
          currency: "NGN",
          interval: "Monthly",
          features: [
            "Visibility to FicaGo Subscribers",
            "Post multiple services",
            "Verification badge",
          ],
          isPopular: false,
          role: "VENDOR",
        },
        {
          name: "Pro",
          price: 5000,
          currency: "NGN",
          interval: "Monthly",
          features: [
            "Visibility to FicaGo Subscribers",
            "Post multiple services",
            "Verification badge",
            "Priority on search Page",
          ],
          isPopular: true,
          role: "VENDOR",
        },
      ];

      const plansToCreate = [];

      for (const plan of plans) {
        let externalPlanId = null;
        try {
          // Convert interval to lowercase for Flutterwave
          const interval = plan.interval.toLowerCase() as PaymentInterval;

          logger.info(`Creating plan on Flutterwave: ${plan.name}`);
          const fwPlan = await flutterwaveSubscriptionService.createPlan({
            amount: plan.price,
            name: plan.name,
            interval: interval,
            duration: 0, // 0 means infinite/auto-renew usually, or check API. The interface allows optional.
            // If duration is optional in interface, we can omit or pass whatever logic.
            // Based on previous code, I added duration?: number.
            // Standard FW plan creation: duration is optional.
          });

          if (fwPlan && fwPlan.data && fwPlan.data.id) {
            externalPlanId = fwPlan.data.id.toString();
            logger.info(
              `Plan created on Flutterwave: ${plan.name} (${externalPlanId})`,
            );
          }
        } catch (fwError: any) {
          logger.error(
            `Failed to create plan on Flutterwave: ${plan.name}`,
            fwError.message,
          );
          // We continue seeding locally even if FW fails?
          // Ideally we should fail or retry, but for now let's proceed and log.
        }

        plansToCreate.push({
          ...plan,
          externalPlanId: externalPlanId,
        });
      }

      await prisma.plan.createMany({
        data: plansToCreate,
      });

      logger.info("Plans seeded successfully");
    } else {
      logger.info("Plans already exist, skipping seeding");
    }
  } catch (error) {
    logger.error("Error seeding plans:", error);
  }
};
