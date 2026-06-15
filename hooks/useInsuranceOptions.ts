import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/hooks/useGapcastle";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://gapcastle.test/api/v1";

function useInsuranceQuery<T>(key: string[], endpoint: string, enabled = true) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  return useQuery<T[]>({
    queryKey: key,
    enabled: !!token && enabled,
    staleTime: 60 * 60 * 1000, // 1 hour — option lists change very rarely
    queryFn: async () => {
      const data = await fetchApi(endpoint, token!);
      return data.data ?? [];
    },
  });
}

/** Nigerian states */
export const useInsuranceStates = () =>
  useInsuranceQuery(["insurance-states"], "/insurance/options?type=state");

/** Vehicle brands / makes */
export const useInsuranceBrands = () =>
  useInsuranceQuery(["insurance-brands"], "/insurance/options?type=brand");

/** Vehicle colour codes */
export const useInsuranceColors = () =>
  useInsuranceQuery(["insurance-colors"], "/insurance/options?type=color");

/** Engine capacity codes */
export const useInsuranceEngineCapacities = () =>
  useInsuranceQuery(
    ["insurance-engine-capacities"],
    "/insurance/options?type=engine-capacity"
  );

/** LGAs for a given StateCode — only fetched when stateCode is set */
export const useInsuranceLgas = (stateCode?: string) =>
  useInsuranceQuery(
    ["insurance-lgas", stateCode ?? ""],
    `/insurance/options/lga?state=${stateCode}`,
    !!stateCode
  );

/** Vehicle models for a given BrandCode — only fetched when brandCode is set */
export const useInsuranceModels = (brandCode?: string) =>
  useInsuranceQuery(
    ["insurance-models", brandCode ?? ""],
    `/insurance/options/model?brand=${brandCode}`,
    !!brandCode
  );
