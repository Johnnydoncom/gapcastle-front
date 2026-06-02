import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function Insurance() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/insurance/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="insurance"
      title="Insurance Premium"
      identifierLabel="Policy number"
      identifierPlaceholder="Policy number"
      amountQuickChips={[1000, 5000, 10000, 25000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
