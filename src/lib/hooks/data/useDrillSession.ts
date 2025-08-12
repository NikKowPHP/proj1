import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";
import type { SrsDrillItem } from "@/lib/types";

export const useDrillSession = (enabled: boolean, drillKey: number) => {
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );

  return useQuery<SrsDrillItem[]>({
    queryKey: ["srsDrill", authUser?.id, activeTargetLanguage, drillKey],
    queryFn: () =>
      apiClient.srs.getDrill({ targetLanguage: activeTargetLanguage! }),
    enabled: enabled && !!authUser && !!activeTargetLanguage,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};