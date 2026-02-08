import { v4 as uuidv4 } from 'uuid';
import prisma from '../../prisma/prisma.js';

export interface ServiceResponse<T> {
  data: T | null;
  error: any | null;
  message: string;
  code: number;
  success: boolean;
}

export interface CreateTransactionDto {
  userId: string;
  amount: number;
  type: string;
  currency: string;
  reference?: string;
  description?: string;
  paymentType?: string;
  metadata?: any;
  transactionType?: string;
  externalReference?: string;
  gateway?: string;
  chargeAmount?: number;
  transactionId?: string;
}

export interface UpdateTransactionDto {
  status?: string;
  reference?: string;
  description?: string;
  metadata?: any;
  externalReference?: string;
  gateway?: string;
  chargeAmount?: number;
  transactionId?: string;
}

export class TransactionService {
  async create(data: CreateTransactionDto): Promise<ServiceResponse<any>> {
    try {
      const transaction = await prisma.transaction.create({
        data: {
          ...data,
          status:  'PENDING',
          uuid: uuidv4(),
        },
      });

      return {
        data: transaction,
        error: null,
        message: 'Transaction created successfully',
        code: 201,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error,
        message: 'Failed to create transaction',
        code: 500,
        success: false,
      };
    }
  }

  async update(id: string, data: UpdateTransactionDto): Promise<ServiceResponse<any>> {
    try {
      const exists = await this.checkIfExist(id);
      if (!exists.success || !exists.data) {
        return {
          data: null,
          error: 'Transaction not found',
          message: 'Transaction not found',
          code: 404,
          success: false,
        };
      }

      // Filter out undefined values to avoid overwriting with null/undefined if that's a concern,
      // though Prisma handles undefined gracefully by ignoring it.
      // Explicitly destructuring to ensure only allowed fields are passed, 
      // even if 'data' contained extra properties at runtime.
      const { 
        status, 
        reference, 
        description, 
        metadata, 
        externalReference, 
        gateway, 
        chargeAmount, 
        transactionId 
      } = data;

      const transaction = await prisma.transaction.update({
        where: { id },
        data: {
          status, 
          reference, 
          description, 
          metadata, 
          externalReference, 
          gateway, 
          chargeAmount, 
          transactionId
        },
      });

      return {
        data: transaction,
        error: null,
        message: 'Transaction updated successfully',
        code: 200,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error,
        message: 'Failed to update transaction',
        code: 500,
        success: false,
      };
    }
  }

  async get(id: string): Promise<ServiceResponse<any>> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        return {
          data: null,
          error: 'Transaction not found',
          message: 'Transaction not found',
          code: 404,
          success: false,
        };
      }

      return {
        data: transaction,
        error: null,
        message: 'Transaction retrieved successfully',
        code: 200,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error,
        message: 'Failed to retrieve transaction',
        code: 500,
        success: false,
      };
    }
  }

  async checkStatus(id: string): Promise<ServiceResponse<string>> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!transaction) {
        return {
          data: null,
          error: 'Transaction not found',
          message: 'Transaction not found',
          code: 404,
          success: false,
        };
      }

      return {
        data: transaction.status,
        error: null,
        message: 'Transaction status retrieved successfully',
        code: 200,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error,
        message: 'Failed to check transaction status',
        code: 500,
        success: false,
      };
    }
  }

  async checkIfExist(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        select: { id: true },
      });

      return {
        data: !!transaction,
        error: null,
        message: transaction ? 'Transaction exists' : 'Transaction does not exist',
        code: 200,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error,
        message: 'Failed to check if transaction exists',
        code: 500,
        success: false,
      };
    }
  }
}
export const transactionService = new TransactionService();
