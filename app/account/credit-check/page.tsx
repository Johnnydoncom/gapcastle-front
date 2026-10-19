import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function CreditCheck() {
  const [providers, apis, wallet] = await Promise.all([
    fetchServerApi("/services/credit_check/providers").catch(() => []),
    // The bureaux (bill APIs) the customer chooses between.
    fetchServerApi("/services/credit_check/apis").catch(() => []),
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
      initialApis={Array.isArray(apis) ? apis : []}
      initialWallet={wallet}
    />
  );
}
