import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    throw new Error(`API Error: ${res.status}`);
  }
  return res.json();
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
    staleTime: 5 * 60 * 1000, // 5 minutes — backend caches for 24h, refetch on remount at most every 5 min
  });
};

export const useProviders = (serviceSlug?: string, initialData?: any[]) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["providers", serviceSlug],
    enabled: !!token,
    queryFn: async () => {
      const endpoint = serviceSlug ? `/services/${serviceSlug}/providers` : "/services";
      const data = await fetchApi(endpoint, token as string);
      const providers = data.data || data;
      return Array.isArray(providers) ? providers : [];
    },
    initialData: initialData,
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
