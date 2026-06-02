import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function Collection() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/collection/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="collection"
      title="Agency Collections"
      identifierLabel="Reference / Invoice number"
      identifierPlaceholder="Reference number"
      amountQuickChips={[1000, 5000, 10000, 50000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
