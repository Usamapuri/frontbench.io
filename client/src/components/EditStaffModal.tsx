import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  position: z.string().min(1, "Position is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  role: z.enum(['finance', 'management'], {
    required_error: "Please select a role",
  }),
});

type EditStaffForm = z.infer<typeof editStaffSchema>;

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface EditStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
}

const roleOptions = [
  { value: 'finance', label: 'Finance Staff' },
  { value: 'management', label: 'Management Staff' },
];

const positionOptions = [
  'Front Desk Officer',
  'Finance Manager',
  'Accounts Officer',
  'Receptionist',
  'Administrative Assistant',
  'Operations Manager',
  'Student Affairs Officer',
  'IT Support',
  'HR Manager',
  'Marketing Coordinator',
];

export default function EditStaffModal({ open, onOpenChange, staff }: EditStaffModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditStaffForm>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      hireDate: "",
      role: undefined,
    },
  });

  // Update form when staff changes
  useEffect(() => {
    if (staff && open) {
      const [firstName, lastName] = staff.name.split(' ');
      form.reset({
        firstName: firstName || "",
        lastName: lastName || "",
        email: staff.email,
        phone: staff.phone,
        position: "", // Default position since we don't have it in the staff object
        hireDate: new Date().toISOString().split('T')[0], // Default to today if not available
        role: staff.role as "finance" | "management",
      });
    }
  }, [staff, open, form]);

  const updateStaffMutation = useMutation({
    mutationFn: async (data: EditStaffForm) => {
      const staffData = {
        ...data,
        isTeacher: false,
        isActive: true,
      };
      return await apiRequest('PUT', `/api/staff/${staff?.id}`, staffData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditStaffForm) => {
    updateStaffMutation.mutate(data);
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update the staff member's information, role, and job details.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  placeholder="Enter first name"
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  placeholder="Enter last name"
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="staff@primax.edu"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+92 300 1234567"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Job Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value as "finance" | "management")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={form.watch("position")}
                  onValueChange={(value) => form.setValue("position", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.position && (
                  <p className="text-sm text-red-600">{form.formState.errors.position.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                type="date"
                {...form.register("hireDate")}
              />
              {form.formState.errors.hireDate && (
                <p className="text-sm text-red-600">{form.formState.errors.hireDate.message}</p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateStaffMutation.isPending}
            >
              {updateStaffMutation.isPending ? "Updating..." : "Update Staff Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}