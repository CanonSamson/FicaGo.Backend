import { NextFunction, Request, Response } from 'express'
import asyncWrapper from '../middlewares/asyncWrapper.js'
import logger from '../utils/logger.js'
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'
import { uploadFileService } from '../services/uploadFileService.js'


export const uploadFile = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      const url = await uploadFileService.uploadFile(req.file)

      res.status(200).json({
        success: true,
        message: 'Uploaded successfully',
        url: url,
        file: {
          url: url,
          originalname: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error uploading group icon',
        error: error
      })
    }
  }
)

export const uploadFiles = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        })
      }

      const uploadedFiles = await Promise.all(
        (req.files as Express.Multer.File[]).map(async file => {
          const url = await uploadFileService.uploadFile(file)
          return {
            originalName: file.originalname,
            url: url,
            size: file.size
          }
        })
      )

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        files: uploadedFiles
      })
    } catch (error: any) {
      logger.error('Error uploading files', {
        error: error
      })
      res.status(500).json({
        success: false,
        message: error.message || 'Error uploading files',
        error: error
      })
    }
  }
)

export const downloadFile = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error: any) {}
  }
)

export const getSignedUrl = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { publicId, resourceType = 'raw' } = req.body

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'publicId is required'
        })
      }

      // Verify the resource exists before generating signed URL
      try {
        await cloudinary.api.resource(publicId, { resource_type: resourceType })
      } catch (error: any) {
        logger.error('Resource not found in Cloudinary', {
          publicId,
          error: error.message
        })
        return res.status(404).json({
          success: false,
          message: 'Resource not found in Cloudinary',
          publicId,
          error: error.message
        })
      }

      const signedUrl = cloudinary.utils.private_download_url(
        publicId.toString(),
        '',
        { resource_type: resourceType.toString() }
      )

      res.json({
        success: true,
        url: signedUrl
      })
    } catch (error: any) {
      logger.error('Error generating signed URL', {
        error: error
      })
      res.status(500).json({
        success: false,
        message: error.message || 'Error generating signed URL',
        error: error
      })
    }
  }
)
