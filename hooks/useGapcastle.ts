import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

export const fetchApi = async (endpoint: string, token: string | null, options: RequestInit = {}) => {
  if (!token) throw new Error("No token provided");
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    }
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    // Prefer the API's own (user-safe) message: the first validation error,
    // then the envelope's message, so callers can show it as-is.
    const body = await res.json().catch(() => null);
    const firstFieldError = body?.errors ? (Object.values(body.errors).flat()[0] as string | undefined) : undefined;
    throw new Error(firstFieldError || body?.message || `API Error: ${res.status}`);
  }
  return res.json();
};

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** A Laravel paginated resource collection, one page at a time. */
const usePaginatedQuery = <T,>(key: unknown[], endpoint: string) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: [...key, session?.user?.id],
    enabled: !!token,
    queryFn: async (): Promise<Paginated<T>> => {
      const data = await fetchApi(endpoint, token as string);
      return {
        items: Array.isArray(data?.data) ? data.data : [],
        meta: {
          current_page: data?.meta?.current_page ?? 1,
          last_page: data?.meta?.last_page ?? 1,
          per_page: data?.meta?.per_page ?? 10,
          total: data?.meta?.total ?? 0,
        },
      };
    },
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
};

export const useWallet = (initialData?: any) => {
  const { data: session } = useSession();
  const user = session?.user;
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      const data = await fetchApi("/wallet/balance", token as string);
      return data.data || data;
    },
    initialData: initialData,
  });
};

export const useProfile = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      const res = await fetch(`${API_URL.replace("/v1", "")}/user`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      if (res.status === 401) {
        if (typeof window !== "undefined") signOut({ callbackUrl: "/login" });
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      return data;
    },
  });
};

export const useTransactions = (limit?: number) => {
  const { data: session } = useSession();
  const user = session?.user;
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["transactions", user?.id, limit],
    enabled: !!user && !!token,
    queryFn: async () => {
      const data = await fetchApi(`/transactions/history${limit ? `?limit=${limit}` : ''}`, token as string);
      let txns = data.data || data;
      // Handle Laravel pagination wrapper
      if (txns && !Array.isArray(txns) && Array.isArray(txns.data)) {
        txns = txns.data;
      }
      return Array.isArray(txns) ? txns : [];
    },
  });
};

export const useTransactionDetail = (reference: string | null) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["transactionDetail", reference],
    enabled: !!token && !!reference,
    queryFn: async () => {
      const data = await fetchApi(`/transactions/${reference}`, token as string);
      return data.data || data;
    },
  });
};

export const useServices = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["services"],
    enabled: !!token,
    queryFn: async () => {
      const data = await fetchApi("/services", token as string);
      const services = data.data || data;
      return Array.isArray(services) ? services : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — the backend drops its cache whenever an admin changes a service
  });
};

/**
 * Providers for a service. `billApiSlug` scopes the list to one bill API on
 * services where the customer chooses it (Credit Check); omitted, the backend
 * lists what its highest-priority API serves.
 */
export const useProviders = (serviceSlug?: string, initialData?: any[], billApiSlug?: string) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["providers", serviceSlug, billApiSlug ?? null],
    enabled: !!token,
    queryFn: async () => {
      const query = billApiSlug ? `?bill_api_slug=${encodeURIComponent(billApiSlug)}` : "";
      const endpoint = serviceSlug ? `/services/${serviceSlug}/providers${query}` : "/services";
      const data = await fetchApi(endpoint, token as string);
      const providers = data.data || data;
      return Array.isArray(providers) ? providers : [];
    },
    initialData: initialData,
  });
};

export interface BillApiOption {
  id: number;
  name: string;
  slug: string;
}

/**
 * The active bill APIs a customer may choose between, in priority order (the
 * first is the default). Only Credit Check offers the choice.
 */
export const useServiceApis = (serviceSlug: string, initialData?: BillApiOption[], enabled = true) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery<BillApiOption[]>({
    queryKey: ["serviceApis", serviceSlug],
    enabled: enabled && !!token,
    queryFn: async () => {
      const data = await fetchApi(`/services/${serviceSlug}/apis`, token as string);
      const apis = data.data || data;
      return Array.isArray(apis) ? apis : [];
    },
    initialData: enabled ? initialData : undefined,
  });
};

export const useVerify = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return {
    verify: async (payload: { service: string; provider_code: string; billers_code: string; type?: string }) => {
      const data = await fetchApi("/validate", token as string, {
        method: "POST",
        body: JSON.stringify({
          bill_service_slug: payload.service,
          bill_provider_slug: payload.provider_code,
          customer: payload.billers_code,
          type: payload.type,
        })
      });
      return data.data || data;
    }
  };
};

export const useProducts = (providerId?: number) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["products", providerId],
    enabled: !!token && !!providerId,
    queryFn: async () => {
      const data = await fetchApi(`/services/providers/${providerId}/products`, token as string);
      const products = data.data || data;
      return Array.isArray(products) ? products : [];
    },
  });
};

export interface PriceQuote {
  /** The plan's price, or the amount the customer typed */
  amount: number;
  /** Any fee shown as its own line; a plan's margin is already in its price */
  fee: number;
  total: number;
  cashback: number;
}

/**
 * The server's price for an order, so the review screen shows exactly what
 * the purchase will charge, or that a plan's price changed since it was listed.
 */
export const usePriceQuote = (order: {
  serviceSlug?: string;
  providerId?: number;
  productId?: number | null;
  amount?: number;
} | null) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery<PriceQuote>({
    queryKey: ["priceQuote", order?.serviceSlug, order?.providerId, order?.productId ?? null, order?.amount],
    enabled: !!token && !!order?.serviceSlug && !!order?.providerId && Number(order?.amount) > 0,
    queryFn: async () => {
      const data = await fetchApi("/transactions/quote", token as string, {
        method: "POST",
        body: JSON.stringify({
          bill_service_slug: order!.serviceSlug,
          bill_provider_id: order!.providerId,
          bill_product_id: order!.productId ?? null,
          amount: Number(order!.amount),
        }),
      });
      return data.data;
    },
    retry: false,
    staleTime: 0,
  });
};

export const usePaymentGateways = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["paymentGateways"],
    enabled: !!token,
    queryFn: async () => {
      const data = await fetchApi(`/payment-gateways`, token as string);
      const gateways = data.data || data;
      return Array.isArray(gateways) ? gateways : [];
    },
    // Gateway config (public keys, contract codes) changes very rarely.
    // Cache for 30 minutes to avoid re-fetching on every component mount.
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

/**
 * A recipient the user has paid before (phone, meter, smartcard, account,
 * vehicle). Created by the API from successful payments only; `details` are
 * the form values needed to repeat the payment.
 */
export interface BillBeneficiary {
  id: number;
  service: string;
  bill_provider_id: number;
  provider?: { id: number; name: string; slug: string; logo: string | null };
  customer: string;
  nickname: string | null;
  customer_name: string | null;
  display_name: string | null;
  details: Record<string, string | number>;
  last_amount: number | null;
  use_count: number;
  last_used_at: string | null;
}

export const useBillBeneficiaries = (serviceSlug?: string) => {
  const { data: session } = useSession();
  const user = session?.user;
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["billBeneficiaries", user?.id, serviceSlug],
    enabled: !!user && !!token && !!serviceSlug,
    queryFn: async (): Promise<{ items: BillBeneficiary[]; supported: boolean }> => {
      const data = await fetchApi(`/bill-beneficiaries?service=${encodeURIComponent(serviceSlug as string)}`, token as string);
      return {
        items: Array.isArray(data?.data) ? data.data : [],
        supported: data?.meta?.supported !== false,
      };
    },
    // Only changes when the user pays, renames or deletes — all of which
    // invalidate this key — so a remount need not refetch.
    staleTime: 5 * 60 * 1000,
  });
};

export const useBillBeneficiaryMutations = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["billBeneficiaries"] });

  const rename = useMutation({
    mutationFn: ({ id, nickname }: { id: number; nickname: string }) =>
      fetchApi(`/bill-beneficiaries/${id}`, token as string, {
        method: "PATCH",
        body: JSON.stringify({ nickname }),
      }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/bill-beneficiaries/${id}`, token as string, { method: "DELETE" }),
    onSuccess: invalidate,
  });

  return { rename, remove };
};

export type RewardType = "cashback" | "referral" | "withdrawal";

export interface RewardsSummary {
  balance: number;
  total_cashback_earned: number;
  total_referral_earned: number;
  total_withdrawn: number;
  referral: {
    code: string;
    link: string;
    total_referred: number;
    total_rewarded: number;
  };
  /** The refer & earn terms an admin has set. */
  program: {
    enabled: boolean;
    reward_amount: number;
    minimum_transaction_amount: number;
  };
}

/** One movement of the rewards (cashback) balance. */
export interface RewardEntry {
  id: number;
  type: RewardType;
  type_label: string;
  direction: "credit" | "debit";
  is_credit: boolean;
  amount: number;
  balance_after: number;
  description: string;
  reference: string;
  transaction_reference: string | null;
  created_at: string;
}

export interface Referral {
  id: number;
  name: string;
  joined_at: string;
  rewarded: boolean;
  rewarded_at: string | null;
}

export const useRewardsSummary = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["rewards", "summary", user?.id],
    enabled: !!user && !!token,
    queryFn: async (): Promise<RewardsSummary> => {
      const data = await fetchApi("/rewards", token as string);
      return data.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useRewardHistory = (page: number, type?: RewardType) => {
  const params = new URLSearchParams({ page: String(page), per_page: "10" });
  if (type) params.set("type", type);

  return usePaginatedQuery<RewardEntry>(["rewards", "history", page, type ?? "all"], `/rewards/history?${params}`);
};

export const useReferrals = (page: number) =>
  usePaginatedQuery<Referral>(["rewards", "referrals", page], `/rewards/referrals?page=${page}&per_page=5`);

/** Move rewards balance into the main wallet. */
export const useWithdrawCashback = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) =>
      fetchApi("/wallet/withdraw-cashback", token as string, {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};
