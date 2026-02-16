import twilio from "twilio";
import logger from "../../utils/logger.js";

export class TwilioService {
  private client: twilio.Twilio | null = null;
  private verifyServiceSid: string | null = null;

  private initialize() {
    if (this.client) return;
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || null;

    if (!accountSid || !authToken) {
      logger.warn("Twilio credentials not configured", {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
      });
      return;
    }

    this.client = twilio(accountSid, authToken);

    if (!this.verifyServiceSid) {
      logger.warn("TWILIO_VERIFY_SERVICE_SID is not set");
    }
  }

  async sendVerificationCode(
    phoneNumber: string,
    channel: "sms" | "call" = "sms",
  ) {
    this.initialize();
    if (!this.client) {
      throw new Error("Twilio not configured");
    }
    if (!this.verifyServiceSid) {
      throw new Error("Twilio Verify Service SID is required");
    }

    const verification = await this.client.verify.v2
      .services(this.verifyServiceSid)
      .verifications.create({ to: phoneNumber, channel });

    logger.info("Twilio verification sent", {
      to: phoneNumber,
      status: verification.status,
    });

    return verification;
  }

  async checkVerificationCode(phoneNumber: string, code: string) {
    this.initialize();
    if (!this.client) {
      throw new Error("Twilio not configured");
    }
    if (!this.verifyServiceSid) {
      throw new Error("Twilio Verify Service SID is required");
    }

    const result = await this.client.verify.v2
      .services(this.verifyServiceSid)
      .verificationChecks.create({ to: phoneNumber, code });

    logger.info("Twilio verification checked", {
      to: phoneNumber,
      status: result.status,
      valid: result.valid,
    });

    return result;
  }

  static validateConfig(): boolean {
    const required = [
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_VERIFY_SERVICE_SID",
    ];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
      logger.error("Missing Twilio environment variables", { missing });
      return false;
    }
    return true;
  }

  getConfigStatus() {
    return {
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasVerifyServiceSid: !!process.env.TWILIO_VERIFY_SERVICE_SID,
      isConfigured: TwilioService.validateConfig(),
    };
  }
}

export const twilioService = new TwilioService();
