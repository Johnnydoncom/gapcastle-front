import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function InternetSubscription() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/internet/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="internet"
      title="Internet Subscription"
      identifierLabel="Account / Device ID"
      identifierPlaceholder="Account number"
      amountQuickChips={[2500, 5000, 10000, 20000]}
      initialProviders={providers}
      initialWallet={wallet}
      usePlans={true}
    />
  );
}
