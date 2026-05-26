import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function Electricity() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/electricity/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="electricity"
      title="Pay Electricity Bill"
      identifierLabel="Meter number"
      identifierPlaceholder="1234567890123"
      amountQuickChips={[1000, 2000, 5000, 10000, 20000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
