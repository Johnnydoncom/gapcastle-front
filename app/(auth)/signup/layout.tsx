import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Create a Free Account",
  description: "Open a free Gap Castle account in under a minute to pay bills, buy airtime and data, and earn cashback on every payment in Nigeria.",
  path: "/signup",
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
