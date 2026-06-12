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
  | "select";

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
      phone: phoneSchema,
    }),
    defaultValues: { providerId: undefined, meterType: "prepaid", identifier: "", amount: "", phone: "" },
    fields: [
      { name: "providerId", label: "Distribution Company (Disco)", type: "provider_grid" },
      { name: "meterType", label: "Meter Type", type: "radio", options: [{ label: "Prepaid", value: "prepaid" }, { label: "Postpaid", value: "postpaid" }] },
      { name: "identifier", label: "Meter Number", type: "verify_input", placeholder: "Enter meter number" },
      { name: "amount", label: "Amount (₦)", type: "number", placeholder: "0.00" },
      { name: "phone", label: "Phone Number (for token delivery)", type: "phone", placeholder: "08012345678" },
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
    }),
    defaultValues: { providerId: undefined, planId: undefined, identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "ISP Provider", type: "provider_grid" },
      { name: "planId", label: "Data Plan", type: "plan_grid" },
      { name: "identifier", label: "Account / Device ID", type: "text", placeholder: "Enter Account ID" },
    ],
  },
  pin: {
    slug: "pin",
    title: "PIN Services",
    schema: z.object({
      providerId: z.number({ message: "Please select an Exam Type" }),
      quantity: z.number().min(1).max(20),
      identifier: phoneSchema,
      amount: amountSchema,
      planId: z.number().optional(), // For auto-calc
    }),
    defaultValues: { providerId: undefined, quantity: 1, identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "Exam Type", type: "provider_grid" },
      { name: "quantity", label: "Quantity", type: "number" },
      { name: "identifier", label: "Phone Number (for PIN delivery)", type: "phone", placeholder: "08012345678" },
    ],
  },
  education: {
    slug: "education",
    title: "Education Services",
    schema: z.object({
      providerId: z.number({ message: "Please select an Institution" }),
      planId: z.number({ message: "Please select a Product" }),
      quantity: z.number().min(1).max(20),
      studentName: z.string().min(2, "Student Name is required"),
      identifier: phoneSchema,
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, planId: undefined, quantity: 1, studentName: "", identifier: "", amount: "" },
    fields: [
      { name: "providerId", label: "Institution / Exam Body", type: "provider_grid" },
      { name: "planId", label: "Product / Variation", type: "plan_grid" },
      { name: "quantity", label: "Quantity", type: "number" },
      { name: "studentName", label: "Student Name", type: "text", placeholder: "Full Name" },
      { name: "identifier", label: "Phone Number (for PIN delivery)", type: "phone", placeholder: "08012345678" },
    ],
  },
  insurance: {
    slug: "insurance",
    title: "Insurance",
    schema: z.object({
      providerId: z.number({ message: "Please select an insurance provider" }),
      planId: z.number({ message: "Please select a plan" }),
      identifier: z.string().min(2, "Full Name is required"), // Customer name
      phone: phoneSchema,
      dob: z.string().optional(),
      address: z.string().optional(),
      nextOfKinName: z.string().optional(),
      nextOfKinPhone: z.string().optional(),
      businessOccupation: z.string().optional(),
      insuranceType: z.enum(["private", "commercial"]).optional(),
      plateNumber: z.string().optional(),
      engineNumber: z.string().optional(),
      chassisNumber: z.string().optional(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      vehicleColor: z.string().optional(),
      yearOfManufacture: z.string().optional(),
      amount: amountSchema,
    }),
    defaultValues: { providerId: undefined, planId: undefined, identifier: "", phone: "", amount: "" },
    fields: [
      { name: "providerId", label: "Insurance Provider", type: "provider_grid" },
      { name: "planId", label: "Insurance Plan", type: "plan_grid" },
      { name: "identifier", label: "Full Name", type: "text", placeholder: "Insured Name" },
      { name: "phone", label: "Phone Number", type: "phone", placeholder: "08012345678" },
      // The rest are dynamic based on provider (Personal vs Third Party Auto). 
      // We will handle dynamic rendering of these in DynamicFormFields by checking provider slug.
      { name: "dob", label: "Date of Birth", type: "date", isHidden: (vals) => vals.providerSlug === "third-party-motor" },
      { name: "address", label: "Contact Address", type: "textarea", placeholder: "Full Address" },
      { name: "nextOfKinName", label: "Next of Kin Name", type: "text", isHidden: (vals) => vals.providerSlug === "third-party-motor" },
      { name: "nextOfKinPhone", label: "Next of Kin Phone", type: "phone", isHidden: (vals) => vals.providerSlug === "third-party-motor" },
      { name: "businessOccupation", label: "Business Occupation", type: "text", isHidden: (vals) => vals.providerSlug === "third-party-motor" },
      { name: "insuranceType", label: "Insurance Type", type: "radio", options: [{ label: "Private", value: "private" }, { label: "Commercial", value: "commercial" }], isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
      { name: "plateNumber", label: "Plate Number", type: "text", isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
      { name: "engineNumber", label: "Engine Number", type: "text", isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
      { name: "chassisNumber", label: "Chassis Number", type: "text", isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
      { name: "vehicleMake", label: "Vehicle Make", type: "select", options: [{ label: "Toyota", value: "Toyota" }, { label: "Honda", value: "Honda" }, { label: "Mercedes-Benz", value: "Mercedes-Benz" }, { label: "Ford", value: "Ford" }, { label: "Other", value: "Other" }], isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
      { name: "vehicleModel", label: "Vehicle Model", type: "text", isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
      { name: "vehicleColor", label: "Vehicle Color", type: "text", isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
      { name: "yearOfManufacture", label: "Year of Manufacture", type: "number", isHidden: (vals) => vals.providerSlug !== "third-party-motor" },
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
