import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function RechargePIN() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/pin/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="pin"
      title="Buy Recharge PINs"
      identifierLabel="Email for delivery"
      identifierPlaceholder="you@example.com"
      amountQuickChips={[500, 1000, 2000, 5000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
