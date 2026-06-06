import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface Branch {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  isMain?: boolean;
  isActive?: boolean;
}

export function useBranches() {
  const { data, isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    retry: false,
  });
  const branches = data ?? [];
  const byId = (id?: string | null) => branches.find((b) => b.id === id);
  const nameOf = (id?: string | null) => byId(id)?.name ?? (id ? "—" : "All branches");
  return { branches, isLoading, byId, nameOf };
}

/** Switch the active branch (head office). Updates the session, then refreshes user + lists. */
export function useSetActiveBranch() {
  return useMutation({
    mutationFn: async (branchId: string | null) => {
      const res = await apiRequest("POST", "/api/branches/active", { branchId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Refresh data that depends on the active branch
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
  });
}
