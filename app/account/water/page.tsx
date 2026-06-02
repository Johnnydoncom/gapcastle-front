import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function Water() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/water/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="water"
      title="Water Bill"
      identifierLabel="Account number"
      identifierPlaceholder="Account number"
      amountQuickChips={[1000, 2500, 5000, 10000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
