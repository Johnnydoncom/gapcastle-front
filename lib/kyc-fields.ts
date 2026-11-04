/**
 * The input form of a KYC product, as the API declares it in
 * `product.metadata.fields` (see the backend's KycProductFields).
 *
 * Cleaning and validation mirror the server's, so the customer sees a
 * mistake beside the field instead of a refusal after pressing Pay. The
 * server still checks everything again before charging.
 */

export type KycFieldType = "text" | "digits" | "alnum" | "phone" | "date" | "select" | "bank" | "image";

export interface KycField {
  name: string;
  label: string;
  type: KycFieldType;
  required: boolean;
  min: number | null;
  max: number | null;
  placeholder: string | null;
  hint: string | null;
  options: { value: string; label: string }[];
  transform: string | null;
}

interface KycProductLike {
  name?: string;
  metadata?: {
    fields?: Partial<KycField>[] | null;
    label_name?: string[] | null;
  } | null;
}

const humanise = (name: string) =>
  name.replace(/[_-]+/g, " ").replace(/(?<!^)([A-Z])/g, " $1").trim().replace(/^\w/, (c) => c.toUpperCase());

/** The product's fields; products that predate the schema list only names. */
export function kycFieldsFor(product: KycProductLike | null | undefined): KycField[] {
  const declared = product?.metadata?.fields;

  if (Array.isArray(declared) && declared.length > 0) {
    return declared
      .filter((field): field is Partial<KycField> & { name: string } => typeof field?.name === "string")
      .map((field) => ({
        name: field.name,
        label: field.label ?? humanise(field.name),
        type: (field.type ?? "text") as KycFieldType,
        required: field.required ?? true,
        min: field.min ?? null,
        max: field.max ?? null,
        placeholder: field.placeholder ?? null,
        hint: field.hint ?? null,
        options: field.options ?? [],
        transform: field.transform ?? null,
      }));
  }

  return (product?.metadata?.label_name ?? []).map((name) => ({
    name,
    label: humanise(name),
    type: "text",
    required: true,
    min: null,
    max: null,
    placeholder: null,
    hint: null,
    options: [],
    transform: null,
  }));
}

/** Tidied the way the server tidies it: spaces out of numbers, +234 to 0, upper-cased codes. */
export function cleanKycValue(field: KycField, raw: string | undefined): string {
  let value = (raw ?? "").trim();

  if (field.type === "digits" || field.type === "bank") value = value.replace(/[\s-]+/g, "");
  if (field.type === "alnum") value = value.replace(/\s+/g, "");
  if (field.type === "phone") {
    value = value.replace(/\D+/g, "");
    if (value.startsWith("234") && value.length === 13) value = `0${value.slice(3)}`;
  }
  if (field.transform === "upper") value = value.toUpperCase();

  return value;
}

/** Why the value would be refused, or null when it is acceptable. */
export function kycFieldError(field: KycField, raw: string | undefined): string | null {
  const value = cleanKycValue(field, raw);
  const { label, min, max } = field;

  if (value === "") return field.required ? `${label} is required.` : null;

  switch (field.type) {
    case "digits":
      if (!/^\d+$/.test(value)) return `${label} must contain digits only.`;
      if (min !== null && min === max && value.length !== min) return `${label} must be exactly ${min} digits.`;
      break;
    case "alnum":
      if (!/^[A-Za-z0-9]+$/.test(value)) return `${label} must contain letters and numbers only.`;
      break;
    case "phone":
      if (!/^0[7-9][01]\d{8}$/.test(value)) return "Enter a valid 11-digit Nigerian phone number.";
      break;
    case "bank":
      if (!/^\d{3,6}$/.test(value)) return "Choose the bank.";
      break;
    case "date": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return `Enter ${label.toLowerCase()} as a date.`;
      if (value >= new Date().toISOString().slice(0, 10)) return `${label} must be in the past.`;
      break;
    }
    case "select":
      if (!field.options.some((option) => option.value === value)) return `Choose ${label.toLowerCase()}.`;
      break;
    case "image":
      if (!/^https?:\/\//.test(value)) return `Upload ${label.toLowerCase()}.`;
      break;
  }

  if (field.type !== "date" && field.type !== "select") {
    if (min !== null && value.length < min) return `${label} must be at least ${min} characters.`;
    if (max !== null && value.length > max) return `${label} must be at most ${max} characters.`;
  }

  return null;
}

/** The first typed value identifies the request; a photo's URL means nothing on a receipt. */
export function kycCustomer(fields: KycField[], values: Record<string, string>, fallback: string): string {
  for (const field of fields) {
    const value = cleanKycValue(field, values[field.name]);
    if (field.type !== "image" && value !== "") return value;
  }
  return fallback;
}

/** How a value reads on the review screen. */
export function kycDisplayValue(field: KycField, value: string, banks: { code: string; name: string }[] = []): string {
  if (field.type === "image") return value ? "✓ Uploaded" : "";
  if (field.type === "select") return field.options.find((option) => option.value === value)?.label ?? value;
  if (field.type === "bank") return banks.find((bank) => bank.code === value)?.name ?? value;
  return cleanKycValue(field, value);
}
