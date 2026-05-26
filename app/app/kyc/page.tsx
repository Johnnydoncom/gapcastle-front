import { ServiceFlow } from "@/components/ServiceFlow";
import { fetchServerApi } from "@/lib/server-api";

export default async function KYC() {
  const [providers, wallet] = await Promise.all([
    fetchServerApi("/services/kyc/providers").catch(() => []),
    fetchServerApi("/wallet/balance").catch(() => null),
  ]);

  return (
    <ServiceFlow
      category="kyc"
      title="KYC Verification"
      identifierLabel="NIN / BVN"
      identifierPlaceholder="Identification number"
      amountQuickChips={[100, 200, 500]}
      initialProviders={providers}
      initialWallet={wallet}
    />
  );
}
