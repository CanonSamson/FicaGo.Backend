import { Request, Response } from "express";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import prisma from "../../../prisma/prisma.js";

export const createService = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req?.id as string; // Extracted from verifyUserToken
    const { title, description, averagePrice, category, imageUrl } = req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Basic validation
    if (!title || !description || !averagePrice || !category || !imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const service = await prisma.service.create({
      data: {
        vendorId,
        title,
        description,
        averagePrice: parseFloat(averagePrice),
        category,
        imageUrl,
      },
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  },
);

export const getServices = asyncWrapper(async (req: Request, res: Response) => {
  const vendorId = req?.id as string;

  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const services = await prisma.service.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ success: true, data: services });
});

export const getServiceById = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req?.id as string;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const service = await prisma.service.findFirst({
      where: { id, vendorId },
    });

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    res.status(200).json({ success: true, data: service });
  },
);

export const updateService = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req?.id as string;
    const { id } = req.params;
    const { title, description, averagePrice, category, imageUrl, isActive } =
      req.body;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const existing = await prisma.service.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const data: any = {};
    if (typeof title === "string") data.title = title;
    if (typeof description === "string") data.description = description;
    if (typeof averagePrice !== "undefined")
      data.averagePrice = parseFloat(averagePrice);
    if (typeof category === "string") data.category = category;
    if (typeof imageUrl === "string") data.imageUrl = imageUrl;
    if (typeof isActive !== "undefined") data.isActive = !!isActive;

    const updated = await prisma.service.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updated,
    });
  },
);

export const deleteService = asyncWrapper(
  async (req: Request, res: Response) => {
    const vendorId = req?.id as string;
    const { id } = req.params;

    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const existing = await prisma.service.findFirst({
      where: { id, vendorId },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    await prisma.service.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ success: true, message: "Service deleted successfully" });
  },
);
