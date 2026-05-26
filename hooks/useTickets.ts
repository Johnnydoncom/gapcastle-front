import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchApi } from "./useGapcastle";
import { Ticket } from "@/types/support";

export const useTickets = (status?: string) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["tickets", status],
    enabled: !!token,
    queryFn: async () => {
      const query = status && status !== "all" ? `?status=${status}` : "";
      const data = await fetchApi(`/tickets${query}`, token as string);
      let tickets = data.data || data;
      if (tickets && !Array.isArray(tickets) && Array.isArray(tickets.data)) {
        tickets = tickets.data;
      }
      return (Array.isArray(tickets) ? tickets : []) as Ticket[];
    },
  });
};

export const useTicket = (id: string | number) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["ticket", id],
    enabled: !!token && !!id,
    queryFn: async () => {
      const data = await fetchApi(`/tickets/${id}`, token as string);
      return (data.data || data) as Ticket;
    },
  });
};

export const useCreateTicket = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      if (!token) throw new Error("No token");
      // Need to use native fetch for FormData since fetchApi sets Content-Type: application/json
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          // Don't set Content-Type, browser will set it with boundary for FormData
        },
        body: formData,
      });
      
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

export const useReplyToTicket = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: number | string; formData: FormData }) => {
      if (!token) throw new Error("No token");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";
      const res = await fetch(`${API_URL}/tickets/${id}/reply`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
        body: formData,
      });
      
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};

export const useCloseTicket = () => {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const data = await fetchApi(`/tickets/${id}/close`, token as string, { method: "POST" });
      return data.data || data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};
