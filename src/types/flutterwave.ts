import { Request } from 'express'
import { PrismaClient } from '@prisma/client'

export interface CustomRequest extends Request {
  prisma: PrismaClient
}

export interface PaymentInitializationData {
  amount: number
  currency?: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  tenantId: string
  redirectUrl: string
  payment_plan?: string
  payment_options?: string
  metadata?: Record<string, any>
  reference?: string
  title?: string
  description?: string
  logo?: string
}

export interface FlutterwaveInitializeResponse {
  status: string
  message: string
  data: {
    link: string
    id: number
  }
}



export interface FlutterwaveVerificationResponse {
  status: string
  message: string
  data: {
    id: number
    tx_ref: string
    amount: number
    currency: string
    status: string
    customer: {
      email: string
      name: string
      phone_number?: string
    }
    created_at: string
  }
}


export type FlutterwaveVerificationWithReferenceResponseData = FlutterwaveVerificationWithReferenceResponse['data']
export interface FlutterwaveVerificationWithReferenceResponse {
  status: string
  message: string
  data: {
    id: number
    tx_ref: string
    flw_ref: string
    device_fingerprint: string
    amount: number
    currency: string
    charged_amount: number
    app_fee: number
    merchant_fee: number
    processor_response: string
    auth_model: string
    ip: string
    narration: string
    status: string
    payment_type: string
    created_at: string
    account_id: number
    card: {
      first_6digits: string
      last_4digits: string
      issuer: string
      country: string
      type: string
      token: string
      expiry: string
    }
    meta: any
    amount_settled: number
    customer: {
      id: number
      name: string
      phone_number: string
      email: string
      created_at: string
    }
  }
}

export interface PaymentNotificationData {
  transactionId: string
  status: string
  amount: number
  currency: string
  tenantId: string
  paymentMethod: string
  verificationData?: any
  webhookData?: any
  refundData?: any
}

export interface AccountingNotificationData {
  transactionId: string
  amount: number
  currency: string
  tenantId: string
  type: 'payment' | 'refund'
  paymentMethod: string
}

export interface WebhookPayload {
  event: string
  data: {
    id: number
    tx_ref: string
    amount: number
    currency: string
    status: string
    customer: {
      email: string
      name: string
      phone_number?: string
    }
    created_at: string
  }
}

// Subscription Types

export type PaymentInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface CreatePaymentPlanData {
  amount: number;
  name: string;
  interval: PaymentInterval;
  duration?: number;
}

export interface PaymentPlanResponse {
  status: string;
  message: string;
  data: {
    id: number;
    name: string;
    amount: number;
    interval: string;
    duration: number;
    status: string;
    currency: string;
    plan_token: string;
    created_at: string;
  }
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface SubscriptionResponse {
  status: string;
  message: string;
  data: {
    id: number;
    amount: number;
    customer: {
      id: number;
      customer_email: string;
    };
    plan: number;
    status: SubscriptionStatus;
    created_at: string;
  }
}

export interface ActivateSubscriptionResponse {
    status: string;
    message: string;
    data: {
        id: number;
        status: string;
    }
}

export interface FetchSubscriptionsResponse {
  status: string;
  message: string;
  meta: {
    page_info: {
      total: number;
      current_page: number;
      total_pages: number;
    }
  }
  data: Array<{
    id: number;
    amount: number;
    customer: {
      id: number;
      customer_email: string;
    };
    plan: number;
    status: string;
    created_at: string;
  }>
}
