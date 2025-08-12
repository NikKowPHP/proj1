import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";

interface StudyDeckOptions {
  includeAll?: boolean;
}

export const useStudyDeck = (options: StudyDeckOptions = {}) => {
  const { includeAll = false } = options;
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );
  return useQuery({
    queryKey: ["studyDeck", authUser?.id, activeTargetLanguage, { includeAll }],
    queryFn: () =>
      apiClient.srs.getDeck({ targetLanguage: activeTargetLanguage!, includeAll }),
    enabled: !!authUser && !!activeTargetLanguage,
    // Ensure data is always fresh on this page, as new cards can become "due"
    // just by time passing.
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};