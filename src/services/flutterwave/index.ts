import axios, { AxiosResponse } from "axios";
import crypto from "crypto";
import {
  FlutterwaveInitializeResponse,
  FlutterwaveVerificationResponse,
  FlutterwaveVerificationWithReferenceResponse,
  FlutterwaveVerificationWithReferenceResponseData,
  PaymentInitializationData,
} from "../../types/flutterwave.js";

import Flutterwave from "flutterwave-node-v3";
import dotenv from "dotenv";
import logger from "../../utils/logger.js";

dotenv.config();

if (
  !process.env.FLUTTERWAVE_PUBLIC_KEY ||
  !process.env.FLUTTERWAVE_SECRET_KEY
) {
  console.log("Flutterwave API keys are not configured");

  process.exit(1);
}

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY,
);

export default flw;

export class FlutterwaveService {
  protected baseURL: string;
  protected publicKey: string;
  protected secretKey: string;
  protected webhookSecret: string;

  constructor() {
    this.baseURL = "https://api.flutterwave.com/v3";
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY as string
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY as string
    this.webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET as string
  }

  async initializePayment(
    paymentData: PaymentInitializationData,
  ): Promise<FlutterwaveInitializeResponse> {
    try {
      const payload = {
        tx_ref: paymentData.reference!,
        amount: paymentData.amount,
        currency: paymentData.currency || "NGN",
        redirect_url: paymentData.redirectUrl,
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: paymentData.customerEmail,
          name: paymentData.customerName,
          phonenumber: paymentData.customerPhone,
        },
        customizations: {
          title: paymentData.title || "Payment",
          description: paymentData.description || "Payment for services",
          logo: paymentData.logo,
        },
        meta: paymentData.metadata || {},
      };

      const response: AxiosResponse<FlutterwaveInitializeResponse> =
        await axios.post(`${this.baseURL}/payments`, payload, {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        });

      return response.data;
    } catch (error: any) {
      logger.error(
        "Flutterwave initialization error:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to initialize payment with Flutterwave");
    }
  }

  async verifyPayment(
    transactionId: string,
  ): Promise<FlutterwaveVerificationResponse> {
    try {
      console.log(transactionId, "transactionId");

      const response = await flw.Transaction.verify({
        id: parseInt(transactionId as string),
      });

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      logger.error("Flutterwave verification error:", {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(
        `Failed to verify payment with Flutterwave: ${errorMessage}`,
      );
    }
  }

  async verifyPaymentWithReference(
    tx_ref: string,
  ): Promise<FlutterwaveVerificationWithReferenceResponseData> {
    try {
      const response: AxiosResponse<FlutterwaveVerificationWithReferenceResponse> =
        await axios.get(`${this.baseURL}/transactions/verify_by_reference`, {
          params: { tx_ref },
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        });

      return response.data.data;
    } catch (error: any) {
      logger.error("Flutterwave verification error:", error);
      throw new Error("Failed to verify payment with Flutterwave");
    }
  }

  async refundPayment(transactionId: string, amount: number): Promise<any> {
    try {
      const payload = {
        amount: amount,
      };

      const response: AxiosResponse = await axios.post(
        `${this.baseURL}/transactions/${transactionId}/refund`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      logger.error(
        "Flutterwave refund error:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to process refund with Flutterwave");
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return signature === expectedSignature;
  }
}

export const flutterwaveService = new FlutterwaveService();
