import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
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
      localStorage.removeItem('selectedRole');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Redirect to login page
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Logout Error", 
        description: error.message || "Failed to logout properly",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: handleLogout,
    isLoggingOut: logoutMutation.isPending,
  };
}