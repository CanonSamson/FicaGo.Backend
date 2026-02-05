import { scheduleJob, Job } from 'node-schedule'
import logger from './logger.js'


const restoredJobs: Record<string, Job> = {}

export const restoreUnSeenMessageJobs = async (): Promise<void> => {

}

// Schedule a 10-minute check for a pending consultation transaction
export const schedulePendingTransactionCheck = async (
  transactionId: string
): Promise<void> => {

}

// Schedule a job to expire a pending consultation transaction at virtual account's expiry time
export const schedulePendingTransactionExpiryCheck = async (
  transactionId: string
): Promise<void> => {

}

export const restorePendingTransactionExpiryJobs = async (): Promise<void> => {

}