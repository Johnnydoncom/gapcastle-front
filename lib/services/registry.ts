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
    // Covers DSTV/GOTV/Startimes (smartcard + bouquet) and Showmax (streaming:
    // delivered to a phone, pick a package). `providerSlug` is injected by
    // DynamicFormFields so the fields/schema can branch on Showmax.
    schema: z.object({
      providerId: z.number({ message: "Please select a provider" }),
      providerSlug: z.string().optional(),
      identifier: z.string().optional(),   // smartcard (TV only)
      phone: z.string().optional(),        // delivery phone (Showmax only)
      planId: z.number().optional(),
      period: z.union([z.number(), z.string()]).optional(),
      amount: z.union([z.number(), z.string()]).optional(),
      planName: z.string().optional(),
      variationCode: z.string().optional(),
    }).superRefine((data, ctx) => {
      // Showmax: package + delivery phone, no smartcard/bouquet.
      if (data.providerSlug === "showmax") {
        if (data.planId == null) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a Showmax package.", path: ["planId"] });
        }
        if (!data.phone || data.phone.replace(/\D/g, "").length < 10) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter the phone number for delivery.", path: ["phone"] });
        }
        return;
      }
      // DSTV/GOTV/Startimes: verify smartcard then select a bouquet.
      if (!data.identifier || data.identifier.length < 4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter your smartcard number.", path: ["identifier"] });
      }
      const amt = Number(data.amount);
      if (!data.variationCode && (!amt || amt < 50)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please verify your smartcard and select a bouquet.", path: ["identifier"] });
      }
    }),
    defaultValues: { providerId: undefined, identifier: "", phone: "", period: 1, amount: "" },
    fields: [
      { name: "providerId", label: "Cable Provider", type: "provider_grid" },
      { name: "identifier", label: "Smartcard Number", type: "verify_input", placeholder: "Enter smartcard number", isHidden: (vals) => vals.providerSlug === "showmax" },
      { name: "phone", label: "Phone Number (for delivery)", type: "phone", placeholder: "08012345678", isHidden: (vals) => vals.providerSlug !== "showmax" },
      // Showmax uses DB products (static catalogue); DSTV/GOTV/Startimes bouquets
      // come from the V-TV validation response rendered inline below the verify field.
      { name: "planId", label: "Bouquet / Package", type: "plan_grid", isHidden: (vals) => vals.providerSlug !== "showmax" },
      { name: "period", label: "Duration (Months)", type: "number", placeholder: "1", isHidden: (vals) => vals.providerSlug === "showmax" },
      { name: "amount", label: "Amount (₦)", type: "number", readonly: true, isHidden: (vals) => vals.providerSlug === "showmax" },
    ],
  },
  electricity: {
    slug: "electricity",
    title: "Electricity Bill",
    schema: z.object({
      providerId: z.number({ message: "Please select a provider" }),
      meterType: z.enum(["prepaid", "postpaid"], { message: "Select meter type" }),
      identifier: meterNumberSchema,
      phone: phoneSchema,
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, meterType: "prepaid", identifier: "", phone: "", amount: "" },
    fields: [
      { name: "providerId", label: "Distribution Company (Disco)", type: "provider_grid" },
      { name: "meterType", label: "Meter Type", type: "radio", options: [{ label: "Prepaid", value: "prepaid" }, { label: "Postpaid", value: "postpaid" }] },
      { name: "identifier", label: "Meter Number", type: "verify_input", placeholder: "Enter meter number" },
      { name: "phone", label: "Phone Number (for token & receipt)", type: "phone", placeholder: "08012345678" },
      { name: "amount", label: "Amount (₦)", type: "number", placeholder: "0.00" },
    ],
  },
  internet: {
    slug: "internet",
    title: "Internet Subscription",
    // Ringo supports three internet purchase shapes:
    //  - Smile "bundle": pick a data plan (P-Internet)
    //  - Smile "recharge": top up the account by amount (SRP)
    //  - Spectranet: buy access PINs by amount + quantity (P-Internet)
    // `providerSlug` is injected into the form by DynamicFormFields when a
    // provider is chosen, so the conditional fields below can branch on it.
    schema: z.object({
      providerId: z.number({ message: "Please select an ISP" }),
      providerSlug: z.string().optional(),
      internet_type: z.enum(["bundle", "recharge"]).optional(),
      identifier: z.string().optional(),
      planId: z.number().optional(),
      // Spectranet delivers the PIN by SMS; VTPass sends it as billersCode.
      phone: z.string().optional(),
      quantity: z.number().min(1).max(20).optional(),
      amount: z.union([z.number(), z.string()]).optional(),
      planName: z.string().optional(),
      variationCode: z.string().optional(),
      allowance: z.string().optional(),
      validity: z.string().optional(),
      accountId: z.string().optional(),
    }).superRefine((data, ctx) => {
      const isSpectranet = data.providerSlug === "spectranet";
      const isSmile = data.providerSlug === "smile";
      // Spectranet sells fixed PIN denominations to a phone number, not to an
      // account, so it needs no identifier.
      if (!isSpectranet && (data.identifier ?? "").length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account ID is required.", path: ["identifier"] });
      }
      if (isSpectranet) {
        // The denomination carries the price — VTPass ignores any amount sent.
        if (data.planId == null) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a PIN denomination.", path: ["planId"] });
        }
        if (!data.phone || data.phone.replace(/\D/g, "").length < 10) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter the phone number for PIN delivery.", path: ["phone"] });
        }
      } else if (isSmile && data.planId == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please verify your account and select a plan.", path: ["planId"] });
      } else if (!isSmile && !isSpectranet && data.planId == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select a data plan.", path: ["planId"] });
      }
    }),
    defaultValues: { providerId: undefined, internet_type: "bundle", planId: undefined, identifier: "", phone: "", quantity: 1, amount: "", accountId: "" },
    fields: [
      { name: "providerId", label: "ISP Provider", type: "provider_grid" },
      { name: "internet_type", label: "Purchase Type", type: "radio", options: [{ label: "Data Bundle", value: "bundle" }, { label: "Recharge", value: "recharge" }], isHidden: (vals) => vals.providerSlug !== "smile" },
      { name: "identifier", label: "Smile Email / Account ID", type: "verify_input", placeholder: "Enter Email or Account ID", isHidden: (vals) => vals.providerSlug === "spectranet" },
      // plan_grid serves every provider: Smile plans come from SRV/V-Internet
      // validation, Spectranet's fixed denominations from the variation codes
      // endpoint, and the rest from stored products.
      { name: "planId", label: "Data Plan", type: "plan_grid" },
      { name: "phone", label: "Phone Number (for PIN delivery)", type: "phone", placeholder: "08012345678", isHidden: (vals) => vals.providerSlug !== "spectranet" },
      { name: "quantity", label: "Number of PINs", type: "number", isHidden: (vals) => vals.providerSlug !== "spectranet" },
      // amount is derived from the chosen denomination × quantity; VTPass
      // ignores whatever amount is sent, so it must never be free-form.
      { name: "amount", label: "Amount (₦)", type: "number", readonly: true, isHidden: (vals) => vals.providerSlug !== "spectranet" },
    ],
  },
  education: {
    slug: "education",
    title: "Education Services",
    schema: z.object({
      providerId: z.number({ message: "Please select an Institution" }),
      providerSlug: z.string().optional(),
      planId: z.number({ message: "Please select a Product" }),
      // JAMB vends against a candidate's profile ID; WAEC PINs need none.
      identifier: z.string().optional(),
      // The PIN is delivered by SMS, so a real number is required.
      phone: phoneSchema,
      quantity: z.number().min(1).max(20),
      amount: amountSchema,
      planName: z.string().optional(),
      variationCode: z.string().optional(),
    }).superRefine((data, ctx) => {
      if (data.providerSlug === "jamb" && (data.identifier ?? "").trim().length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter and verify your JAMB Profile ID.",
          path: ["identifier"],
        });
      }
    }),
    defaultValues: { providerId: undefined, providerSlug: "", planId: undefined, identifier: "", phone: "", quantity: 1, amount: "" },
    fields: [
      { name: "providerId", label: "Institution / Exam Body", type: "provider_grid" },
      { name: "planId", label: "Product / Variation", type: "plan_grid" },
      { name: "identifier", label: "JAMB Profile ID", type: "verify_input", placeholder: "Enter your JAMB profile ID", isHidden: (vals) => vals.providerSlug !== "jamb" },
      { name: "phone", label: "Phone Number (for PIN delivery)", type: "phone", placeholder: "08012345678" },
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
