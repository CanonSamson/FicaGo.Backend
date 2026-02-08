import axios from "axios";
import { FlutterwaveSubscriptionService } from "../subscription.js";
import { CreatePaymentPlanData } from "../../../types/flutterwave.js";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock("../../../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("FlutterwaveSubscriptionService", () => {
  let service: FlutterwaveSubscriptionService;

  beforeAll(() => {
    process.env.FLUTTERWAVE_PUBLIC_KEY = "test_public_key";
    process.env.FLUTTERWAVE_SECRET_KEY = "test_secret_key";
    process.env.FLUTTERWAVE_WEBHOOK_SECRET = "test_webhook_secret";
  });

  beforeEach(() => {
    service = new FlutterwaveSubscriptionService();
    jest.clearAllMocks();
  });

  describe("createPlan", () => {
    it("should create a payment plan successfully", async () => {
      const planData: CreatePaymentPlanData = {
        amount: 5000,
        name: "Monthly Plan",
        interval: "monthly",
        duration: 24,
      };

      const mockResponse = {
        data: {
          status: "success",
          message: "Payment plan created",
          data: {
            id: 123,
            name: "Monthly Plan",
            amount: 5000,
            interval: "monthly",
            duration: 24,
            status: "active",
            currency: "NGN",
            plan_token: "rpp_123",
            created_at: "2023-01-01T00:00:00.000Z",
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.createPlan(planData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/payment-plans"),
        planData,
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle errors during plan creation", async () => {
      const planData: CreatePaymentPlanData = {
        amount: 5000,
        name: "Monthly Plan",
        interval: "monthly",
      };

      const mockError = {
        response: {
          data: { message: "Plan creation failed" },
          status: 400,
        },
        message: "Request failed",
      };

      mockedAxios.post.mockRejectedValue(mockError);

      await expect(service.createPlan(planData)).rejects.toEqual(mockError);
    });
  });

  describe("activateSubscription", () => {
    it("should activate a subscription successfully", async () => {
      const subId = "123";
      const mockResponse = {
        data: {
          status: "success",
          message: "Subscription activated",
          data: {
            id: 123,
            status: "active",
          },
        },
      };

      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await service.activateSubscription(subId);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining(`/subscriptions/${subId}/activate`),
        {},
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("handleWebhook", () => {
    it("should process charge.completed event", () => {
      const payload = {
        "event.type": "charge.completed",
        data: { id: 1, amount: 5000 },
      };
      // Mock verifyWebhookSignature to return true
      jest.spyOn(service, "verifyWebhookSignature").mockReturnValue(true);

      const result = service.handleWebhook(payload, "valid_signature");

      expect(result).toEqual({ type: "payment", data: payload.data });
    });

    it("should throw error for invalid signature", () => {
      const payload = { event: "charge.completed" };
      jest.spyOn(service, "verifyWebhookSignature").mockReturnValue(false);

      expect(() => service.handleWebhook(payload, "invalid")).toThrow(
        "Invalid webhook signature",
      );
    });
  });
});
