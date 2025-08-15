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
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
