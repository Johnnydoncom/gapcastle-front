import { KycFlow } from "@/components/KycFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function KYC() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/kyc/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return <KycFlow initialProviders={providers} initialWallet={wallet} />;
}
