// custom-types.d.ts
import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    id?: string;
    role?: "VENDOR" | "USER";
    planId?: string | null;
  }
}
