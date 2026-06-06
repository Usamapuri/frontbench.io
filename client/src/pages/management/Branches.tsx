import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBranches, type Branch } from "@/hooks/useBranches";

const empty = { name: "", code: "", address: "", phone: "" };

export default function Branches() {
  const { branches, isLoading } = useBranches();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(empty);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({ name: b.name, code: b.code ?? "", address: b.address ?? "", phone: b.phone ?? "" });
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `/api/branches/${editing.id}` : "/api/branches";
      const res = await apiRequest(method, url, form);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: editing ? "Branch updated" : "Branch created" });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async (b: Branch) => (await apiRequest("PUT", `/api/branches/${b.id}`, { isActive: !b.isActive })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/branches"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Branches</h2>
          <p className="text-sm text-gray-500">Manage your school's campuses / locations.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} data-testid="button-add-branch"><Plus className="mr-2 h-4 w-4" />Add Branch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit branch" : "Add branch"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label htmlFor="b-name">Name</Label>
                <Input id="b-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="DHA Campus" data-testid="input-branch-name" /></div>
              <div><Label htmlFor="b-code">Code <span className="text-gray-400">(optional)</span></Label>
                <Input id="b-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="DHA" /></div>
              <div><Label htmlFor="b-address">Address <span className="text-gray-400">(optional)</span></Label>
                <Input id="b-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label htmlFor="b-phone">Phone <span className="text-gray-400">(optional)</span></Label>
                <Input id="b-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <Button className="w-full" disabled={!form.name || save.isPending} onClick={() => save.mutate()} data-testid="button-save-branch">
                {save.isPending ? "Saving…" : editing ? "Save changes" : "Create branch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All branches</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="divide-y">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3" data-testid={`row-branch-${b.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2"><Building2 className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {b.name}{" "}
                        {b.isMain && <Badge variant="secondary" className="ml-1">Main</Badge>}
                        {!b.isActive && <Badge variant="outline" className="ml-1 text-gray-500">Inactive</Badge>}
                      </div>
                      <div className="text-xs text-gray-500">{[b.code, b.address, b.phone].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!b.isMain && (
                      <Button variant="ghost" size="sm" onClick={() => toggleActive.mutate(b)}>
                        {b.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
