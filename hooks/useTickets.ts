import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchApi } from "./useGapcastle";
import { Ticket } from "@/types/support";

export const useTickets = (status?: string) => {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ["tickets", status ?? "", session?.user?.id],
    enabled: !!token,
    queryFn: async () => {
      const params = new URLSearchParams({ per_page: "50" });
      if (status && status !== "all") params.set("status", status);
      const data = await fetchApi(`/tickets?${params}`, token as string);
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
    queryKey: ["ticket", String(id), session?.user?.id],
    enabled: !!token && !!id,
    // A missing or someone else's ticket will not appear on retry.
    retry: 1,
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
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const data = await fetchApi("/tickets", token, { method: "POST", body: formData });
      return data.data as Ticket;
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
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      return fetchApi(`/tickets/${id}/reply`, token, { method: "POST", body: formData });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ticket", String(variables.id)] });
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
      if (!token) throw new Error("Your session has expired. Please sign in again.");
      const data = await fetchApi(`/tickets/${id}/close`, token, { method: "POST" });
      return (data.data || data) as Ticket;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["ticket", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
};
