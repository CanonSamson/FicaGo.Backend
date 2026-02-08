import { Request, Response } from 'express'
import logger from '../utils/logger.js'
import prisma from '../../prisma/prisma.js'
import { flutterwaveService } from '../services/flutterwave/index.js'
import { WebhookPayload } from '../types/flutterwave.js'

// Handle Flutterwave webhook
export const handleFlutterwaveWebhook = async (req: Request, res: Response) => {
  const startTime = Date.now()
  const requestId = `webhook_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 6)}`

  logger.info('Webhook request received', {
    requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    hasSignature: !!req.headers['verif-hash']
  })

  try {
    const signature = req.headers['verif-hash'] as string
    logger.info('Verifying webhook signature', {
      requestId
    })

    if (!flutterwaveService.verifyWebhookSignature(req.body, signature)) {
      logger.warn('Invalid webhook signature', {
        requestBody: req.body,
        requestId,
        hasSignature: !!signature
      })
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    logger.info('web-hook-body', {
      data: req.body
    })

    const { event, data }: WebhookPayload = req.body
    logger.info('Webhook payload parsed', {
      requestId,
      event,
      tx_ref: data?.tx_ref,
      status: data?.status,
      amount: data?.amount,
      currency: data?.currency
    })

    if (event === 'charge.completed') {
      logger.info('Processing charge.completed event', {
        requestId,
        tx_ref: data.tx_ref
      })

      // Using findFirst because reference is not marked as @unique in the schema
      const transaction = await prisma.transaction.findFirst({
        where: { reference: data.tx_ref }
      })

      if (transaction) {
        logger.info('Transaction found for webhook', {
          requestId,
          reference: data.tx_ref,
          transactionId: transaction.id,
          currentStatus: transaction.status
        })

        const status = data.status === 'successful' ? 'SUCCESSFUL' : 'FAILED'

        logger.info('Derived status from webhook', {
          requestId,
          reference: data.tx_ref,
          webhookStatus: data.status,
          derivedStatus: status
        })

        // Update transaction status and store webhook data in metadata
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: status,
            metadata: data as any
          }
        })

        logger.info('Updated transaction with webhook data', {
          requestId,
          transactionId: transaction.id,
          reference: data.tx_ref,
          status
        })

        // Queue for processing
        // await paymentQueue.add('processWebhookPayment', {
        //   transactionId: transaction.id,
        //   status: status,
        //   webhookData: data
        // })
      } else {
        logger.warn('Transaction not found for webhook reference', {
          requestId,
          reference: data.tx_ref
        })
      }
    }

    const processingTime = Date.now() - startTime
    logger.info('Webhook processed successfully', {
      requestId,
      event,
      processingTimeMs: processingTime
    })
    res.json({ success: true })
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    logger.error('Webhook processing failed', {
      requestId,
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime
    })
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
