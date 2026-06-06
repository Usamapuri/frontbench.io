import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranches, useSetActiveBranch } from "@/hooks/useBranches";
import { useToast } from "@/hooks/use-toast";

/**
 * Lets head-office (management / super_admin) users choose the active branch — the
 * branch new records are stamped to and the default filter for lists.
 */
export default function BranchSwitcher() {
  const { user } = useAuth() as { user: any };
  const { branches } = useBranches();
  const setActive = useSetActiveBranch();
  const { toast } = useToast();

  const isHeadOffice = ["management", "super_admin"].includes(user?.role);
  // Only useful once there is more than one branch.
  if (!isHeadOffice || branches.length < 2) return null;

  const onChange = (branchId: string) => {
    setActive.mutate(branchId, {
      onSuccess: () => {
        const name = branches.find((b) => b.id === branchId)?.name;
        toast({ title: "Branch switched", description: `Now working in ${name}.` });
      },
      onError: (e: any) => toast({ title: "Couldn't switch branch", description: e?.message, variant: "destructive" }),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-500" />
      <Select value={user?.branchId ?? undefined} onValueChange={onChange} disabled={setActive.isPending}>
        <SelectTrigger className="w-[180px]" data-testid="select-active-branch">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}{b.isMain ? " (Main)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
