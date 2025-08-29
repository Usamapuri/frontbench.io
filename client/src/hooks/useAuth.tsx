import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const { toast } = useToast();

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      return response;
    },
    onSuccess: () => {
      // Clear local storage
      localStorage.removeItem('selectedRole');
      // Clear query cache
      queryClient.clear();
      // Show success message
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error", 
        description: "Failed to logout properly",
        variant: "destructive",
      });
    },
  });

  // Simple logout function
  const logout = async () => {
    try {
      logoutMutation.mutate();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    refetch,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}