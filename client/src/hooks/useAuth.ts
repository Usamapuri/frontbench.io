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
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
