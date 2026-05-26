import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function CreditCheck() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/credit_check/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="credit_check"
      title="Credit Check"
      identifierLabel="BVN / Phone number"
      identifierPlaceholder="Identifier"
      amountQuickChips={[500, 1000, 2000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
