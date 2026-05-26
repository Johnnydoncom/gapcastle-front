import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function Gas() {
  // Fetch initial data securely on the server
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/gas/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="gas"
      title="Gas Bill"
      identifierLabel="Account / Meter number"
      identifierPlaceholder="Account number"
      amountQuickChips={[2000, 5000, 10000, 15000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
