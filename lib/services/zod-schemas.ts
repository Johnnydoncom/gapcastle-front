import { z } from "zod";

// Nigerian Phone Number: 11 digits starting with 080, 081, 090, 091, 070
export const phoneSchema = z
  .string()
  .regex(/^0(80|81|90|91|70)\d{8}$/, "Invalid Nigerian phone number");

export const amountSchema = z
  .number({ message: "Amount must be a number" })
  .min(50, "Amount must be at least ₦50");

export const meterNumberSchema = z
  .string()
  .min(6, "Meter number is too short")
  .max(15, "Meter number is too long");

export const smartcardNumberSchema = z
  .string()
  .min(10, "Smartcard number must be at least 10 digits");

export const emailSchema = z.string().email("Invalid email address").optional().or(z.literal(""));

export const bvnSchema = z
  .string()
  .regex(/^\d{11}$/, "BVN must be exactly 11 digits");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
