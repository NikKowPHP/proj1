import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";

export const useJournalHistory = () => {
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );
  return useQuery({
    queryKey: ["journals", authUser?.id, activeTargetLanguage],
    queryFn: () =>
      apiClient.journal.getAll({ targetLanguage: activeTargetLanguage! }),
    enabled: !!authUser && !!activeTargetLanguage,
  });
};
