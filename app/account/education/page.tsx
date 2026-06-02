import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function EducationPayments() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/education/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="education"
      title="Education Payments"
      identifierLabel="Profile / Candidate ID"
      identifierPlaceholder="Candidate or profile ID"
      amountQuickChips={[2000, 4500, 7500, 15000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
