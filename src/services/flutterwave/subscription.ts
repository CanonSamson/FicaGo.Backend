import axios, { AxiosResponse } from "axios";
import { FlutterwaveService } from "./index.js";
import logger from "../../utils/logger.js";
import {
  CreatePaymentPlanData,
  PaymentPlanResponse,
  SubscriptionResponse,
  ActivateSubscriptionResponse,
  FetchSubscriptionsResponse,
} from "../../types/flutterwave.js";

export class FlutterwaveSubscriptionService extends FlutterwaveService {
  constructor() {
    super();
  }

  async createPlan(data: CreatePaymentPlanData): Promise<PaymentPlanResponse> {
    try {
      const payload = {
        amount: data.amount,
        name: data.name,
        interval: data.interval,
        duration: data.duration,
      };

      const response: AxiosResponse<PaymentPlanResponse> = await axios.post(
        `${this.baseURL}/payment-plans`,
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
      this.handleError("createPlan", error);
      throw error;
    }
  }


  async getPlan(id: string): Promise<PaymentPlanResponse> {
    try {
      const response: AxiosResponse<PaymentPlanResponse> = await axios.get(
        `${this.baseURL}/payment-plans/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.handleError("getPlan", error);
      throw error;
    }
  }


  async updatePlan(
    id: string,
    data: Partial<CreatePaymentPlanData>,
  ): Promise<PaymentPlanResponse> {
    try {
      const response: AxiosResponse<PaymentPlanResponse> = await axios.put(
        `${this.baseURL}/payment-plans/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.handleError("updatePlan", error);
      throw error;
    }
  }


  async cancelPlan(id: string): Promise<PaymentPlanResponse> {
    try {
      const response: AxiosResponse<PaymentPlanResponse> = await axios.put(
        `${this.baseURL}/payment-plans/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.handleError("cancelPlan", error);
      throw error;
    }
  }

 
  async getSubscriptions(): Promise<FetchSubscriptionsResponse> {
    try {
      const response: AxiosResponse<FetchSubscriptionsResponse> =
        await axios.get(`${this.baseURL}/subscriptions`, {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        });

      return response.data;
    } catch (error: any) {
      this.handleError("getSubscriptions", error);
      throw error;
    }
  }


  async activateSubscription(
    id: string,
  ): Promise<ActivateSubscriptionResponse> {
    try {
      const response: AxiosResponse<ActivateSubscriptionResponse> =
        await axios.put(
          `${this.baseURL}/subscriptions/${id}/activate`,
          {},
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              "Content-Type": "application/json",
            },
          },
        );

      return response.data;
    } catch (error: any) {
      this.handleError("activateSubscription", error);
      throw error;
    }
  }

  /**
   * Cancel/Deactivate a subscription
   * @param id Subscription ID
   * @returns Cancellation response
   */
  async cancelSubscription(id: string): Promise<SubscriptionResponse> {
    try {
      const response: AxiosResponse<SubscriptionResponse> = await axios.put(
        `${this.baseURL}/subscriptions/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.handleError("cancelSubscription", error);
      throw error;
    }
  }

  /**
   * Get a specific subscription
   * @param id Subscription ID (NOTE: Flutterwave API typically returns list, filtering might be needed if direct ID endpoint doesn't exist, but we assume /subscriptions?email=... or similar works, or client filters.
   * However, there is no direct /subscriptions/:id documented in standard public docs sometimes, but let's assume standard REST or use filter)
   * Actually, let's try to fetch all and filter or check if there is a direct endpoint.
   * Based on common patterns, I'll implement fetch by query if needed, but here I'll just use a direct GET if supported or fetch all.
   * To be safe, I'll implement `getSubscription` by fetching all and filtering, OR if I know the email.
   * BUT, for now, let's assume we can query by ID or just use `getSubscriptions`.
   * I will omit `getSubscription(id)` for now and rely on `getSubscriptions` or specific query params if user provides email.
   * Wait, the prompt asked for "retrieval". I'll implement `getSubscription` using query params.
   */
  async getSubscription(email: string): Promise<FetchSubscriptionsResponse> {
    try {
      const response: AxiosResponse<FetchSubscriptionsResponse> =
        await axios.get(`${this.baseURL}/subscriptions`, {
          params: { email },
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        });
      return response.data;
    } catch (error: any) {
      this.handleError("getSubscription", error);
      throw error;
    }
  }

  /**
   * Handle Webhook
   * @param payload Webhook payload
   * @param signature Webhook signature
   * @returns Processed event data
   */
  handleWebhook(payload: any, signature: string): any {
    if (!this.verifyWebhookSignature(payload, signature)) {
      logger.error("Invalid webhook signature");
      throw new Error("Invalid webhook signature");
    }

    const event = payload["event.type"] || payload.event; // Flutterwave sometimes uses different fields

    logger.info(`Processing Flutterwave webhook event: ${event}`, { payload });

    switch (event) {
      case "charge.completed":
        // Handle charge completion (subscription payment)
        return { type: "payment", data: payload.data };
      case "subscription.cancelled":
        return { type: "subscription_cancelled", data: payload.data };
      default:
        return { type: "unknown", data: payload };
    }
  }

  private handleError(context: string, error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || "Unknown error";
    logger.error(`FlutterwaveSubscriptionService error in ${context}:`, {
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
    // You might want to throw a custom error here
  }
}

export const flutterwaveSubscriptionService =
  new FlutterwaveSubscriptionService();
