import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLanguageStore } from "@/lib/stores/language.store";

export const useReadingMaterial = () => {
  const authUser = useAuthStore((state) => state.user);
  const activeTargetLanguage = useLanguageStore(
    (state) => state.activeTargetLanguage,
  );

  return useQuery({
    queryKey: ["readingMaterial", authUser?.id, activeTargetLanguage],
    queryFn: () =>
      apiClient.user.getReadingMaterial({
        targetLanguage: activeTargetLanguage!,
      }),
    enabled: !!authUser && !!activeTargetLanguage,
    retry: false, // Don't retry on 404s for missing content
  });
};