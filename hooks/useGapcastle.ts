import { useQuery } from "@tanstack/react-query";
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

export const useTransactionDetail = (transactionId: number | null) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["transactionDetail", transactionId],
    enabled: !!token && !!transactionId,
    queryFn: async () => {
      const data = await fetchApi(`/transactions/${transactionId}`, token as string);
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
  });
};
