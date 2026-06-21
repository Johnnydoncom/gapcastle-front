import { z } from "zod";
import { phoneSchema, amountSchema, meterNumberSchema, smartcardNumberSchema, emailSchema, bvnSchema, dateSchema } from "./zod-schemas";

export type FieldType =
  | "provider_grid"
  | "plan_grid"
  | "text"
  | "number"
  | "email"
  | "phone"
  | "verify_input"
  | "radio"
  | "textarea"
  | "date"
  | "amount_quick_select"
  | "select"
  | "insurance_fields";

export interface ServiceFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { label: string; value: string | number }[]; 
  readonly?: boolean; 
  isHidden?: (values: any) => boolean; 
}

export interface ServiceConfig {
  slug: string;
  title: string;
  schema: z.ZodObject<any>;
  fields: ServiceFieldConfig[];
  defaultValues: Record<string, any>;
}

export const serviceRegistry: Record<string, ServiceConfig> = {
  airtime: {
    slug: "airtime",
    title: "Buy Airtime",
    schema: z.object({
      providerId: z.number({ message: "Please select a provider" }),
      identifier: phoneSchema,
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "Network Provider", type: "provider_grid" },
      { name: "identifier", label: "Phone Number", type: "phone", placeholder: "08012345678" },
      { name: "amount", label: "Amount (₦)", type: "amount_quick_select" },
    ],
  },
  data: {
    slug: "data",
    title: "Buy Data Bundle",
    schema: z.object({
      providerId: z.number({ message: "Please select a provider" }),
      planId: z.number({ message: "Please select a data plan" }),
      identifier: phoneSchema,
      amount: amountSchema,
      planName: z.string().optional(),
      variationCode: z.string().optional(),
    }),
    defaultValues: { providerId: undefined, planId: undefined, identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "Network Provider", type: "provider_grid" },
      { name: "planId", label: "Data Plan", type: "plan_grid" },
      { name: "identifier", label: "Phone Number", type: "phone", placeholder: "08012345678" },
    ],
  },
  cable: {
    slug: "cable",
    title: "Cable TV Subscription",
    schema: z.object({
      providerId: z.number({ message: "Please select a provider" }),
      identifier: smartcardNumberSchema,
      transactionType: z.enum(["renew", "change"], { message: "Select transaction type" }),
      planId: z.number().optional(),
      amount: z.union([z.number(), z.string()]).optional(),
      planName: z.string().optional(),
      variationCode: z.string().optional(),
    }).superRefine((data, ctx) => {
      const amt = Number(data.amount);
      if (data.transactionType === "renew" && (!amt || amt < 50)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please click 'Verify' to fetch your renewal amount.",
          path: ["identifier"],
        });
      }
      if (data.transactionType === "change" && (!amt || amt < 50)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid bouquet plan.",
          path: ["planId"],
        });
      }
    }),
    defaultValues: { providerId: undefined, identifier: "", transactionType: "change", amount: "" },
    fields: [
      { name: "providerId", label: "Cable Provider", type: "provider_grid" },
      { name: "identifier", label: "Smartcard Number", type: "verify_input", placeholder: "Enter smartcard number" },
      { name: "transactionType", label: "Transaction Type", type: "radio", options: [{ label: "Change Bouquet", value: "change" }, { label: "Renew Current Bouquet", value: "renew" }] },
      { name: "planId", label: "Bouquet / Plan", type: "plan_grid", isHidden: (vals) => vals.transactionType === "renew" },
      { name: "amount", label: "Amount (₦)", type: "number", readonly: true, isHidden: (vals) => vals.transactionType === "renew" },
    ],
  },
  electricity: {
    slug: "electricity",
    title: "Electricity Bill",
    schema: z.object({
      providerId: z.number({ message: "Please select a provider" }),
      meterType: z.enum(["prepaid", "postpaid"], { message: "Select meter type" }),
      identifier: meterNumberSchema,
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, meterType: "prepaid", identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "Distribution Company (Disco)", type: "provider_grid" },
      { name: "meterType", label: "Meter Type", type: "radio", options: [{ label: "Prepaid", value: "prepaid" }, { label: "Postpaid", value: "postpaid" }] },
      { name: "identifier", label: "Meter Number", type: "verify_input", placeholder: "Enter meter number" },
      { name: "amount", label: "Amount (₦)", type: "number", placeholder: "0.00" },
    ],
  },
  internet: {
    slug: "internet",
    title: "Internet Subscription",
    schema: z.object({
      providerId: z.number({ message: "Please select an ISP" }),
      planId: z.number({ message: "Please select a plan" }),
      identifier: z.string().min(3, "Account ID is required"),
      amount: amountSchema,
      planName: z.string().optional(),
      variationCode: z.string().optional(),
      accountId: z.string().optional(), // Used by Smile
    }),
    defaultValues: { providerId: undefined, planId: undefined, identifier: "", amount: "", accountId: "" },
    fields: [
      { name: "providerId", label: "ISP Provider", type: "provider_grid" },
      { name: "identifier", label: "Smile Email / Account ID", type: "verify_input", placeholder: "Enter Email or Account ID" },
      { name: "planId", label: "Data Plan", type: "plan_grid" },
    ],
  },
  pin: {
    slug: "pin",
    title: "PIN Services",
    schema: z.object({
      providerId: z.number({ message: "Please select an Exam Type" }),
      quantity: z.number().min(1).max(20),
      amount: amountSchema,
      planId: z.number().optional(),
    }),
    defaultValues: { providerId: undefined, quantity: 1, amount: "" },
    fields: [
      { name: "providerId", label: "Exam Type", type: "provider_grid" },
      { name: "quantity", label: "Quantity", type: "number" },
    ],
  },
  education: {
    slug: "education",
    title: "Education Services",
    schema: z.object({
      providerId: z.number({ message: "Please select an Institution" }),
      planId: z.number({ message: "Please select a Product" }),
      quantity: z.number().min(1).max(20),
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, planId: undefined, quantity: 1, amount: "" },
    fields: [
      { name: "providerId", label: "Institution / Exam Body", type: "provider_grid" },
      { name: "planId", label: "Product / Variation", type: "plan_grid" },
      { name: "quantity", label: "Quantity", type: "number" },
    ],
  },
  insurance: {
    slug: "insurance",
    title: "Insurance",
    schema: z.object({
      providerId: z.number({ message: "Please select an insurance provider" }),
      planId: z.number({ message: "Please select a plan" }),
      identifier: z.string().min(2, "Plate number is required"), // billersCode = Plate_Number
      phone: phoneSchema,
      email: emailSchema,
      // VTPass motor insurance fields
      Insured_Name: z.string().min(2, "Insured name is required"),
      Plate_Number: z.string().min(3, "Plate number is required"),
      Chasis_Number: z.string().min(3, "Chassis number is required"),
      YearofMake: z.string().min(4, "Year of manufacture is required"),
      engine_capacity: z.string().min(1, "Engine capacity is required"),
      vehicle_make: z.string().min(1, "Vehicle make is required"),
      vehicle_model: z.string().min(1, "Vehicle model is required"),
      vehicle_color: z.string().min(1, "Vehicle colour is required"),
      state: z.string().min(1, "State is required"),
      lga: z.string().min(1, "LGA is required"),
      amount: amountSchema,
    }),
    defaultValues: {
      providerId: undefined,
      planId: undefined,
      identifier: "",
      phone: "",
      email: "",
      Insured_Name: "",
      Plate_Number: "",
      Chasis_Number: "",
      YearofMake: "",
      engine_capacity: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_color: "",
      state: "",
      lga: "",
      amount: "",
    },
    fields: [
      { name: "providerId", label: "Insurance Provider", type: "provider_grid" },
      { name: "planId", label: "Insurance Plan (Vehicle Type)", type: "plan_grid" },
      { name: "phone", label: "Phone Number", type: "phone", placeholder: "08012345678" },
      // Sentinel field — renders the full InsuranceFields component
      { name: "insurance_fields", label: "", type: "insurance_fields" },
    ],
  },

  kyc: {
    slug: "kyc",
    title: "KYC Verification",
    schema: z.object({
      providerId: z.number({ message: "Please select KYC Type" }),
      identifier: z.string().min(5, "Verification ID is required"),
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "KYC Type", type: "provider_grid" },
      { name: "identifier", label: "BVN / NIN / RC Number", type: "text", placeholder: "Enter details" },
    ],
  },
  "credit_check": {
    slug: "credit_check",
    title: "Credit Check",
    schema: z.object({
      providerId: z.number({ message: "Please select Credit Bureau" }),
      planId: z.number({ message: "Please select a Report Type" }),
      requestType: z.enum(["consumer", "commercial"], { message: "Select entity type" }),
      identifier: z.string().min(5, "Identifier is required"),
      consumer_name: z.string().optional(),
      date_of_birth: z.string().optional(),
      business_name: z.string().optional(),
      account_no: z.string().optional(),
      phone: phoneSchema.optional().or(z.literal("")),
      amount: amountSchema,
      planName: z.string().optional(),
    }),
    defaultValues: { providerId: undefined, planId: undefined, requestType: "consumer", identifier: "", consumer_name: "", date_of_birth: "", business_name: "", account_no: "", phone: "", amount: "" },
    fields: [
      { name: "providerId", label: "Credit Bureau", type: "provider_grid" },
      { name: "requestType", label: "Entity Type", type: "radio", options: [{ label: "Individual", value: "consumer" }, { label: "Business", value: "commercial" }] },
      { name: "planId", label: "Report Type", type: "plan_grid" },
      { name: "identifier", label: "BVN / RC Number", type: "text", placeholder: "Enter BVN or RC Number" },
      { name: "consumer_name", label: "Consumer Name (Optional)", type: "text", placeholder: "Full Name", isHidden: (vals) => vals.requestType === "commercial" },
      { name: "date_of_birth", label: "Date of Birth (Optional)", type: "date", isHidden: (vals) => vals.requestType === "commercial" },
      { name: "business_name", label: "Business Name (Optional)", type: "text", placeholder: "Company Name", isHidden: (vals) => vals.requestType === "consumer" },
      { name: "account_no", label: "Account Number (Optional)", type: "text", placeholder: "Account Number" },
      { name: "phone", label: "Phone Number (Optional)", type: "phone", placeholder: "08012345678" },
      { name: "amount", label: "Amount (₦)", type: "number", readonly: true },
    ],
  },
  water: {
    slug: "water",
    title: "Water Bill",
    schema: z.object({
      providerId: z.number({ message: "Please select Water Board" }),
      identifier: z.string().min(3, "Account ID is required"),
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "Water Board", type: "provider_grid" },
      { name: "identifier", label: "Customer / Account ID", type: "verify_input", placeholder: "Enter ID" },
      { name: "amount", label: "Amount (₦)", type: "number", placeholder: "0.00" },
    ],
  },
  gas: {
    slug: "gas",
    title: "Gas Bill",
    schema: z.object({
      providerId: z.number({ message: "Please select Gas Provider" }),
      identifier: z.string().min(3, "Account Number is required"),
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "Gas Provider", type: "provider_grid" },
      { name: "identifier", label: "Account / Meter Number", type: "verify_input", placeholder: "Enter Number" },
      { name: "amount", label: "Amount (₦)", type: "number", placeholder: "0.00" },
    ],
  },
  collection: {
    slug: "collection",
    title: "Collections & Levies",
    schema: z.object({
      providerId: z.number({ message: "Please select an Organisation" }),
      identifier: z.string().min(2, "Payer Name is required"),
      email: emailSchema,
      phone: phoneSchema,
      reference: z.string().optional(),
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, identifier: "", email: "", phone: "", amount: "", reference: "" },
    fields: [
      { name: "providerId", label: "Organisation / Institution", type: "provider_grid" },
      { name: "identifier", label: "Payer Name", type: "text", placeholder: "Full Name" },
      { name: "email", label: "Payer Email", type: "email", placeholder: "email@example.com" },
      { name: "phone", label: "Payer Phone", type: "phone", placeholder: "08012345678" },
      { name: "reference", label: "Payment Reference (Optional)", type: "text", placeholder: "Ref Number" },
      { name: "amount", label: "Amount (₦)", type: "number", placeholder: "0.00" },
    ],
  },
};
