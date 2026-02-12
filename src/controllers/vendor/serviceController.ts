import { Request, Response } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import prisma from '../../../prisma/prisma.js';

export const createService = asyncWrapper(async (req: Request, res: Response) => {
  const vendorId = (req as any).id; // Extracted from verifyUserToken
  const { title, description, averagePrice, category, imageUrl } = req.body;

  if (!vendorId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Basic validation
  if (!title || !description || !averagePrice || !category || !imageUrl) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
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

  res.status(201).json({ success: true, message: 'Service created successfully', data: service });
});

export const getServices = asyncWrapper(async (req: Request, res: Response) => {
  const vendorId = (req as any).id;

  if (!vendorId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const services = await prisma.service.findMany({
    where: { vendorId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, data: services });
});
