import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: 'teacher' | 'finance' | 'parent' | 'management';
  isSuperAdmin: boolean;
  isTeacher: boolean;
  teacherSubjects: string[];
  accessibleDashboards: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export function useAuth() {
  // Include the current role from URL params in the query key to trigger refresh on role change
  const urlParams = new URLSearchParams(window.location.search);
  const currentRole = urlParams.get('role') || 'finance';
  
  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user", currentRole],
    queryFn: async () => {
      const response = await fetch(`/api/auth/user?role=${currentRole}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    retry: false,
    staleTime: 0, // Always refetch when query key changes
    gcTime: 0, // Don't cache the result
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
