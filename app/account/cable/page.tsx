import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function CableTV() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/cable/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="cable"
      title="Cable TV Subscription"
      identifierLabel="Smartcard / IUC number"
      identifierPlaceholder="1234567890"
      usePlans
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
