import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/services/api-client.service";
import { useAuthStore } from "@/lib/stores/auth.store";

export const useUserProfile = () => {
  const authUser = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: ["userProfile", authUser?.id],
    queryFn: apiClient.profile.get,
    enabled: !!authUser,
  });
};
