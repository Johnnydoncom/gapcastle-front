"use client";
import { useParams } from "next/navigation";
import { ServiceFlow } from "@/components/ServiceFlow";

export default function ServiceDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) return null;

  return <ServiceFlow category={id} />;
}
