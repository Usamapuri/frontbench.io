import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear(); // Clear all cached data
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Force page reload to reset any localStorage state
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Logout Error",
        description: error.message || "Failed to logout properly",
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}