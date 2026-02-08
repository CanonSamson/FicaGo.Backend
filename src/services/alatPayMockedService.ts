import logger from '../utils/logger.js'
import { VirtualAccountRequestBody } from '../controllers/alatPayController.js'


interface VirtualAccountResponse {
  success: boolean
  data?: {
    id: string
    merchantId: string
    virtualBankCode: string
    virtualBankAccountNumber: string
    businessBankAccountNumber: string | null
    businessBankCode: string
    transactionId: string
    status: string
    expiredAt: string
    settlementType: string | null
    createdAt: string
    businessId: string
    amount: number
    currency: string
    orderId: string
    description: string
    subBusinessCode: string | null
    customer: {
      email: string
      phone: string
      firstName: string
      lastName: string
      metadata: string
    }
    // Legacy fields for backward compatibility
    virtualAccountNumber?: string
    bankName?: string
    accountName?: string
    expiryTime?: string
    reference?: string
  }
  message?: string
  error?: string
}

interface TransactionStatusResponse {
  success: boolean
  data?: {
    amount: number
    orderId: string
    description: string
    paymentMethodId: number
    sessionId: string
    isAmountDiscrepant: boolean
    amountSent: number
    nipTransaction: {
      id: string
      requestdate: string | null
      nibssresponse: string | null
      sendstatus: string | null
      sendresponse: string | null
      transactionId: string
      transactionStatus: string
      log: string
      createdAt: string
      isCallbackValidated: boolean
      originatoraccountnumber: string
      originatorname: string
      bankname: string | null
      bankcode: string
      amount: number
      narration: string | null
      craccountname: string | null
      craccount: string
      paymentreference: string | null
      sessionid: string
    }
    virtualAccount: {
      id: string
      merchantId: string
      virtualBankCode: string
      virtualBankAccountNumber: string
      businessBankAccountNumber: string | null
      businessBankCode: string
      transactionId: string
      status: string
      expiredAt: string
      settlementType: string | null
      createdAt: string
      businessId: string
      amount: number
      currency: string
      orderId: string
      description: string
      subBusinessCode: string | null
      customer: any | null
    }
    customer: {
      id: string
      transactionId: string
      createdAt: string
      email: string
      phone: string
      firstName: string
      lastName: string
      metadata: string
    }
    subBusinessCode: string | null
    isCallbackValidated: boolean
    id: string
    merchantId: string
    businessId: string
    channel: string | null
    callbackUrl: string | null
    feeAmount: number
    businessName: string
    currency: string
    status: string
    statusReason: string | null
    settlementType: string | null
    createdAt: string
    updatedAt: string
    ngnVirtualBankAccountNumber: string | null
    ngnVirtualBankCode: string | null
    usdVirtualAccountNumber: string | null
    usdVirtualBankCode: string | null
  }
  message?: string
  error?: string
  requestId?: string
  timestamp?: string
}

export class AlatPayMockedService {
  private initialize () {
    logger.info('AlatPay Mocked Service initialized')
  }

  /**
   * Confirm transaction status for bank transfer payments
   */
  async confirmTransactionStatus(transactionId: string): Promise<TransactionStatusResponse> {
    this.initialize(); // Ensure service is initialized
    
    logger.info("Confirming transaction status (MOCKED)", { 
      transactionId
    });

    // Mock successful response
    return {
      success: true,
      data: {
        amount: 5000,
        orderId: `MOCK_ORDER_${Math.floor(Math.random() * 10000)}`,
        description: "Mock Payment Description",
        paymentMethodId: 1,
        sessionId: `MOCK_SESSION_${Date.now()}`,
        isAmountDiscrepant: false,
        amountSent: 5000,
        nipTransaction: {
          id: `NIP_${Date.now()}`,
          requestdate: new Date().toISOString(),
          nibssresponse: "00",
          sendstatus: "00",
          sendresponse: "00",
          transactionId: transactionId,
          transactionStatus: "successful",
          log: "Mock log",
          createdAt: new Date().toISOString(),
          isCallbackValidated: true,
          originatoraccountnumber: "1234567890",
          originatorname: "John Doe",
          bankname: "Mock Bank",
          bankcode: "000",
          amount: 5000,
          narration: "Payment for order",
          craccountname: "Merchant Name",
          craccount: "0987654321",
          paymentreference: `REF_${Date.now()}`,
          sessionid: `SESSION_${Date.now()}`
        },
        virtualAccount: {
          id: `VA_${Date.now()}`,
          merchantId: "MOCK_MERCHANT",
          virtualBankCode: "999",
          virtualBankAccountNumber: "9990001112",
          businessBankAccountNumber: "8887776665",
          businessBankCode: "058",
          transactionId: transactionId,
          status: "successful",
          expiredAt: new Date(Date.now() + 86400000).toISOString(),
          settlementType: "instant",
          createdAt: new Date().toISOString(),
          businessId: "MOCK_BIZ_ID",
          amount: 5000,
          currency: "NGN",
          orderId: `ORDER_${Date.now()}`,
          description: "Mock VA Description",
          subBusinessCode: null,
          customer: null
        },
        customer: {
          id: `CUST_${Date.now()}`,
          transactionId: transactionId,
          createdAt: new Date().toISOString(),
          email: "mock@example.com",
          phone: "08012345678",
          firstName: "Mock",
          lastName: "User",
          metadata: "{}"
        },
        subBusinessCode: null,
        isCallbackValidated: true,
        id: `TX_${Date.now()}`,
        merchantId: "MOCK_MERCHANT",
        businessId: "MOCK_BIZ",
        channel: "bank_transfer",
        callbackUrl: "https://example.com/callback",
        feeAmount: 50,
        businessName: "Mock Business",
        currency: "NGN",
        status: "successful",
        statusReason: "Payment received",
        settlementType: "instant",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ngnVirtualBankAccountNumber: "9990001112",
        ngnVirtualBankCode: "999",
        usdVirtualAccountNumber: null,
        usdVirtualBankCode: null
      },
      message: "Transaction confirmed successfully (MOCKED)"
    };
  }

  /**
   * Generate a virtual account for bank transfer payments
   * @param request - Virtual account request data
   * @returns Promise<VirtualAccountResponse>
   */
  async generateVirtualAccount (
    request: VirtualAccountRequestBody
  ): Promise<VirtualAccountResponse> {
    this.initialize() // Ensure service is initialized

    logger.info('Generating virtual account (MOCKED)', {
      amount: request.amount,
      currency: request.currency,
      orderId: request.orderId,
      customerEmail: request.customer.email
    })

    return {
      success: true,
      data: {
        id: `VA_${Date.now()}`,
        merchantId: "MOCK_MERCHANT",
        virtualBankCode: "999",
        virtualBankAccountNumber: "1234567890",
        businessBankAccountNumber: "0987654321",
        businessBankCode: "058",
        transactionId: `TX_REQ_${Date.now()}`,
        status: "active",
        expiredAt: new Date(Date.now() + 86400000).toISOString(), // 24h from now
        settlementType: "instant",
        createdAt: new Date().toISOString(),
        businessId: "MOCK_BIZ_ID",
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        description: "Mock Virtual Account",
        subBusinessCode: null,
        customer: {
          email: request.customer.email,
          phone: request.customer.phone,
          firstName: request.customer.firstName,
          lastName: request.customer.lastName,
          metadata: request.customer.metadata ? JSON.stringify(request.customer.metadata) : ""
        },
        // Legacy fields
        virtualAccountNumber: "1234567890",
        bankName: "Mock Bank",
        accountName: "FicaGo Mock Account",
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        reference: `REF_${request.orderId}`
      },
      message: "Virtual account generated successfully (MOCKED)"
    }
  }

  /**
   * Validate required environment variables
   */
  static validateConfig (): boolean {
    // Always valid in mock mode
    return true
  }

  /**
   * Get service configuration status
   */
  getConfigStatus () {
    this.initialize() // Ensure service is initialized

    return {
      baseUrl: "http://mock-alatpay",
      hasSubscriptionKey: true,
      isConfigured: true
    }
  }
}

export const alatPayMockedService = new AlatPayMockedService()
