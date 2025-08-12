import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";

export const useJournalEntry = (id: string) => {
  return useQuery({
    queryKey: ["journal", id],
    queryFn: () => apiClient.journal.getById(id),
    enabled: !!id,
  });
};
