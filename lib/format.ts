export const formatNaira = (amount: number | string | null | undefined) => {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(n);
};

export const formatDate = (d: string | Date) => {
  return new Date(d).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const detectNetwork = (phone: string): string | null => {
  const p = phone.replace(/\D/g, "").replace(/^234/, "0");
  if (!/^0\d{10}$/.test(p)) return null;
  const prefix = p.slice(0, 4);
  const map: Record<string, string> = {
    "0803": "mtn", "0806": "mtn", "0810": "mtn", "0813": "mtn", "0814": "mtn", "0816": "mtn", "0903": "mtn", "0906": "mtn", "0913": "mtn", "0916": "mtn", "0703": "mtn", "0704": "mtn", "0706": "mtn",
    "0802": "airtel", "0808": "airtel", "0812": "airtel", "0701": "airtel", "0708": "airtel", "0902": "airtel", "0904": "airtel", "0907": "airtel", "0901": "airtel", "0912": "airtel",
    "0805": "glo", "0807": "glo", "0815": "glo", "0811": "glo", "0905": "glo", "0915": "glo", "0705": "glo",
    "0809": "9mobile", "0817": "9mobile", "0818": "9mobile", "0819": "9mobile", "0908": "9mobile", "0909": "9mobile",
  };
  return map[prefix] ?? null;
};
