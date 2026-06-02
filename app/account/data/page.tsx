import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function DataBundle() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/data/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="data"
      title="Buy Data"
      identifierLabel="Phone number"
      identifierPlaceholder="08012345678"
      identifierPattern="[0-9]{11}"
      usePlans
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
