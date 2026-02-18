import { Request, Response } from "express";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import logger from "../../utils/logger.js";
import prisma from "../../../prisma/prisma.js";
import { computeOnboardingFlags } from "../../services/vendorOnboardingService.js";

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
          bankAccount: true,
          services: true,
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

export const updateVendorDetails = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;
    const {
      firstName,
      lastName,
      mobileNumber,
      businessType,
      vendorType,
      serviceCategory,
      skills,
    } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    try {
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (mobileNumber !== undefined) updateData.mobileNumber = mobileNumber;
      if (businessType !== undefined) updateData.businessType = businessType;
      if (vendorType !== undefined) updateData.vendorType = vendorType;
      if (serviceCategory !== undefined)
        updateData.serviceCategory = serviceCategory;
      if (skills !== undefined) updateData.skills = skills;

      const updatedVendor = await prisma.vendor.update({
        where: {
          id: vendorId,
        },
        data: updateData,
      });

      logger.info("Vendor details updated successfully", { vendorId });

      res.status(200).json({
        success: true,
        message: "Vendor details updated successfully",
        data: updatedVendor,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }
      logger.error("Error updating vendor details:", {
        error: error.message,
        stack: error.stack,
        vendorId,
      });
      res.status(500).json({
        success: false,
        message: "Failed to update vendor details",
      });
    }
  },
);

export const upgradeToRegisteredVendor = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;
    const {
      cacCertificate,
      registrationType,
      rcNumber,
      registeredBusinessName,
      taxIdentificationNumber,
    } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    try {
      const updatedVendor = await prisma.vendor.update({
        where: {
          id: vendorId,
        },
        data: {
          vendorType: "registered",
          cacCertificateUrl: cacCertificate,
          registrationType,
          rcNumber,
          registeredBusinessName,
          taxIdentificationNumber,
        },
      });

      logger.info("Vendor upgraded to registered successfully", { vendorId });

      res.status(200).json({
        success: true,
        message: "Vendor upgraded to registered successfully",
        data: updatedVendor,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }
      logger.error("Error upgrading vendor:", {
        error: error.message,
        stack: error.stack,
        vendorId,
      });
      res.status(500).json({
        success: false,
        message: "Failed to upgrade vendor",
      });
    }
  },
);

export const setupBankAccount = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;
    const { bankName, accountNumber, accountName } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    try {
      const bankAccount = await prisma.vendorBankAccount.upsert({
        where: {
          vendorId: vendorId,
        },
        update: {
          bankName,
          accountNumber,
          accountName,
        },
        create: {
          vendorId,
          bankName,
          accountNumber,
          accountName,
        },
      });

      logger.info("Vendor bank account set up successfully", { vendorId });

      res.status(200).json({
        success: true,
        message: "Bank account details saved successfully",
        data: bankAccount,
      });
    } catch (error: any) {
      logger.error("Error setting up bank account:", {
        error: error.message,
        stack: error.stack,
        vendorId,
      });
      res.status(500).json({
        success: false,
        message: "Failed to set up bank account",
      });
    }
  },
);

export const completeVendorProfile = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;
    const {
      vendorType,
      selfieImage,
      identificationType,
      identificationNumber,
      taxIdentificationNumber,
      gender,
    } = req.body;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    try {
      const updatedVendor = await prisma.vendor.update({
        where: {
          id: vendorId,
        },
        data: {
          vendorType,
          selfieImage,
          identificationType,
          identificationNumber,
          taxIdentificationNumber,
          gender,
        },
      });

      logger.info("Vendor profile completed successfully", { vendorId });

      res.status(200).json({
        success: true,
        message: "Vendor profile completed successfully",
        data: updatedVendor,
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }
      logger.error("Error completing vendor profile:", {
        error: error.message,
        stack: error.stack,
        vendorId,
      });
      res.status(500).json({
        success: false,
        message: "Failed to complete vendor profile",
      });
    }
  },
);

export const submitOnboardingForReview = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    // Optional: basic guard rails to ensure steps completed
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { bankAccount: true, services: true },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const {
      hasProfile,
      hasBank,
      hasServices,
      hasVerification,
    } = computeOnboardingFlags(vendor);

    if (!(hasProfile && hasBank && hasServices && hasVerification)) {
      return res.status(400).json({
        success: false,
        message: "Onboarding not completed. Please complete all steps before submitting for review.",
        data: {
          hasProfile,
          hasBank,
          hasServices,
          hasVerification,
        },
      });
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { onboardingStatus: "submitted_for_review" },
    });

    res.status(200).json({
      success: true,
      message: "Submitted for review successfully",
      data: updated,
    });
  },
);





export const getOnboardingStatus = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;

    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { bankAccount: true, services: true },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const {
      hasProfile,
      hasBank,
      hasServices,
      requiresVerification,
      hasVerification,
    } = computeOnboardingFlags(vendor);

    res.status(200).json({
      success: true,
      data: {
        hasProfile,
        hasBank,
        hasServices,
        requiresVerification,
        hasVerification,
        onboardingStatus: vendor.onboardingStatus,
      },
    });
  },
);

export const getOnboardingStepStatuses = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;
    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { bankAccount: true, services: true },
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const profileFields = [
      vendor.vendorType,
      vendor.selfieImage,
      vendor.identificationType,
      vendor.identificationNumber,
      vendor.taxIdentificationNumber,
      vendor.gender,
    ];
    const profileAll = profileFields.every(Boolean);
    const profileAny = profileFields.some(Boolean);

    const bankFields = [
      vendor.bankAccount?.bankName,
      vendor.bankAccount?.accountName,
      vendor.bankAccount?.accountNumber,
    ];
    const bankAll = bankFields.every(Boolean);
    const bankAny = bankFields.some(Boolean);

    const verificationFields = [
      vendor.cacCertificateUrl,
      vendor.registrationType,
      vendor.rcNumber,
      vendor.registeredBusinessName,
      vendor.taxIdentificationNumber,
    ];
    const isRegistered = vendor.vendorType === "registered";
    const verificationAll = isRegistered ? verificationFields.every(Boolean) : true;
    const verificationAny = isRegistered ? verificationFields.some(Boolean) : true;

    const servicesCount = vendor.services?.length ?? 0;

    const status = (all: boolean, any: boolean) =>
      all ? "complete" : any ? "started" : "not_started";

    const steps = {
      account_created: "complete" as const,
      verify_business: status(verificationAll, verificationAny),
      complete_profile: status(profileAll, profileAny),
      settlement_account: status(bankAll, bankAny),
      add_services: servicesCount > 0 ? "complete" : "not_started",
    };

    const allDone =
      steps.complete_profile === "complete" &&
      steps.settlement_account === "complete" &&
      steps.add_services === "complete" &&
      (isRegistered ? steps.verify_business === "complete" : true);

    res.status(200).json({
      success: true,
      message: "Onboarding step statuses fetched",
      data: {
        steps,
        allDone,
        onboardingStatus: vendor.onboardingStatus,
      },
    });
  }
);

export const getProfileCompletionPercent = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req.id;
    if (!vendorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Vendor ID not found in token",
      });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    const fields = [
      vendor.vendorType,
      vendor.selfieImage,
      vendor.identificationType,
      vendor.identificationNumber,
      vendor.taxIdentificationNumber,
      vendor.gender,
    ];

    const total = fields.length;
    const completed = fields.filter(Boolean).length;
    const percentage = Math.max(
      0,
      Math.min(100, Math.round((completed / total) * 100)),
    );

    res.status(200).json({
      success: true,
      message: "Profile completion percentage fetched",
      data: {
        percentage,
        totalFields: total,
        completedFields: completed,
      },
    });
  }
);
