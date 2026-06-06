import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Logo from "@/components/Logo";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [schoolName, setSchoolName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainEdited, setSubdomainEdited] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const onSchoolName = (v: string) => {
    setSchoolName(v);
    if (!subdomainEdited) setSubdomain(slugify(v));
  };

  const register = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tenants/register", {
        schoolName,
        subdomain,
        adminName,
        adminEmail,
        adminPassword,
        confirmPassword,
        phone: phone || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "School created", description: "You can now sign in with your admin account." });
      setLocation("/login");
    },
    onError: (err: any) => {
      toast({
        title: "Registration failed",
        description: err?.message?.replace(/^\d+:\s*/, "") || "Please check your details and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || subdomain.length < 3 || !adminName || !adminEmail || adminPassword.length < 8) {
      toast({
        title: "Missing information",
        description: "Fill in all fields. Subdomain ≥3 chars and password ≥8 chars.",
        variant: "destructive",
      });
      return;
    }
    if (adminPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Re-enter your password to confirm.", variant: "destructive" });
      return;
    }
    register.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="text-2xl" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Start your free trial</h1>
            <p className="text-gray-600 text-sm">Create your school workspace in a minute.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="schoolName">School name</Label>
              <Input id="schoolName" value={schoolName} onChange={(e) => onSchoolName(e.target.value)}
                placeholder="Greenfield Academy" data-testid="input-school-name" />
            </div>

            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <div className="flex items-center">
                <Input id="subdomain" value={subdomain}
                  onChange={(e) => { setSubdomainEdited(true); setSubdomain(slugify(e.target.value)); }}
                  placeholder="greenfield" className="rounded-r-none" data-testid="input-subdomain" />
                <span className="inline-flex h-10 items-center rounded-r-md border border-l-0 border-input bg-gray-50 px-3 text-sm text-gray-500">
                  .frontbench.io
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="adminName">Your name</Label>
              <Input id="adminName" value={adminName} onChange={(e) => setAdminName(e.target.value)}
                placeholder="Ayesha Khan" data-testid="input-admin-name" />
            </div>

            <div>
              <Label htmlFor="adminEmail">Admin email</Label>
              <Input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@greenfield.edu.pk" data-testid="input-admin-email" />
            </div>

            <div>
              <Label htmlFor="adminPassword">Password</Label>
              <Input id="adminPassword" type="password" value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)} placeholder="At least 8 characters"
                data-testid="input-admin-password" />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                data-testid="input-confirm-password" />
            </div>

            <div>
              <Label htmlFor="phone">Phone <span className="text-gray-400">(optional)</span></Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="03xx-xxxxxxx" data-testid="input-phone" />
            </div>

            <Button type="submit" className="w-full" disabled={register.isPending} data-testid="button-register">
              {register.isPending ? "Creating…" : "Create school"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button onClick={() => setLocation("/login")} className="font-medium text-blue-600 hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
