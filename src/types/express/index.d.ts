import { Plan, Role } from "@prisma/client";
import { Express } from "express";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      role?: Role;
      plan?: Plan;
    }
  }
}
