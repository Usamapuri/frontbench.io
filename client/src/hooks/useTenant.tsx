import { useQuery } from "@tanstack/react-query";

export interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  timezone?: string;
  currency?: string;
}

/**
 * Current tenant (school) for the logged-in user. Use for school-specific display
 * such as the name printed on invoices/receipts. Returns undefined when unauthenticated.
 */
export function useTenant() {
  const { data: tenant, isLoading } = useQuery<TenantInfo | null>({
    queryKey: ["/api/tenant"],
    retry: false,
    refetchOnWindowFocus: false,
  });
  return { tenant: tenant ?? null, isLoading };
}
