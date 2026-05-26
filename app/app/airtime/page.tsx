import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function AirtimeRecharge() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/airtime/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="airtime"
      title="Buy Airtime"
      identifierLabel="Phone number"
      identifierPlaceholder="08012345678"
      identifierPattern="[0-9]{11}"
      amountQuickChips={[100, 200, 500, 1000, 2000, 5000]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
