import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editManagementSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  position: z.string().min(1, "Position is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  isAlsoTeacher: z.boolean().default(false),
  teacherSubjects: z.array(z.string()).default([]),
  teacherClassLevels: z.array(z.string()).default([]),
  payoutPercentage: z.number().min(0).max(100).optional(),
});

type EditManagementForm = z.infer<typeof editManagementSchema>;

interface EditManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  management: any;
}

const classLevelOptions = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th'];

export default function EditManagementModal({ open, onOpenChange, management }: EditManagementModalProps) {
  const [selectedClassLevels, setSelectedClassLevels] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditManagementForm>({
    resolver: zodResolver(editManagementSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      hireDate: "",
      isAlsoTeacher: false,
      teacherSubjects: [],
      teacherClassLevels: [],
      payoutPercentage: 50,
    },
  });

  // Fetch subjects for selection
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
  });

  const updateManagementMutation = useMutation({
    mutationFn: async (data: EditManagementForm) => {
      const managementData = {
        ...data,
        role: 'management',
        isSuperAdmin: true,
        isTeacher: data.isAlsoTeacher,
        isActive: true,
      };
      return await apiRequest('PUT', `/api/management/${management.id}`, managementData);
    },
    onSuccess: () => {
      toast({
        title: "Management Account Updated Successfully",
        description: "The management account has been updated with the new information.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update management account",
        variant: "destructive",
      });
    },
  });

  const handleClassLevelChange = (classLevel: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedClassLevels, classLevel]
      : selectedClassLevels.filter(level => level !== classLevel);
    
    setSelectedClassLevels(updated);
    form.setValue('teacherClassLevels', updated);
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    const updated = checked 
      ? [...selectedSubjects, subjectId]
      : selectedSubjects.filter(id => id !== subjectId);
    
    setSelectedSubjects(updated);
    form.setValue('teacherSubjects', updated);
  };

  const handleTeacherCheckboxChange = (checked: boolean) => {
    setIsTeacher(checked);
    form.setValue('isAlsoTeacher', checked);
    if (!checked) {
      setSelectedClassLevels([]);
      setSelectedSubjects([]);
      form.setValue('teacherClassLevels', []);
      form.setValue('teacherSubjects', []);
    }
  };

  // Reset form when management data changes
  useEffect(() => {
    if (management && open) {
      const formData = {
        firstName: management.firstName || '',
        lastName: management.lastName || '',
        email: management.email || '',
        phone: management.phone || '',
        position: management.position || '',
        hireDate: management.hireDate?.split('T')[0] || '',
        isAlsoTeacher: management.isTeacher || false,
        teacherSubjects: management.teacherSubjects || [],
        teacherClassLevels: management.teacherClassLevels || [],
        payoutPercentage: management.payoutPercentage || 50,
      };
      
      form.reset(formData);
      setIsTeacher(management.isTeacher || false);
      setSelectedSubjects(management.teacherSubjects || []);
      setSelectedClassLevels(management.teacherClassLevels || []);
    }
  }, [management, open, form]);

  const onSubmit = (data: EditManagementForm) => {
    updateManagementMutation.mutate(data);
  };

  if (!management) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Management Account</DialogTitle>
          <DialogDescription>
            Update the management account information. If they also teach, they will maintain super admin teacher privileges.
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
                  placeholder="Enter email address"
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
                  placeholder="Enter phone number"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Job Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  {...form.register("position")}
                  placeholder="e.g., Principal, Director, Manager"
                />
                {form.formState.errors.position && (
                  <p className="text-sm text-red-600">{form.formState.errors.position.message}</p>
                )}
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
          </div>

          {/* Teacher Privileges */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Teaching Privileges</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAlsoTeacher"
                checked={isTeacher}
                onCheckedChange={handleTeacherCheckboxChange}
              />
              <Label htmlFor="isAlsoTeacher" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                This person also teaches (Super Admin Teacher privileges)
              </Label>
            </div>

            {isTeacher && (
              <>
                <div>
                  <Label className="text-sm font-medium">Class Levels *</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {classLevelOptions.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={level}
                          checked={selectedClassLevels.includes(level)}
                          onCheckedChange={(checked) => handleClassLevelChange(level, !!checked)}
                        />
                        <Label htmlFor={level} className="text-sm">{level}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Subjects *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                    {subjects?.map((subject: any) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={subject.id}
                          checked={selectedSubjects.includes(subject.id)}
                          onCheckedChange={(checked) => handleSubjectChange(subject.id, !!checked)}
                        />
                        <Label htmlFor={subject.id} className="text-sm">{subject.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="payoutPercentage">Payout Percentage (%) *</Label>
                  <Input
                    id="payoutPercentage"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register("payoutPercentage", { valueAsNumber: true })}
                    placeholder="Enter payout percentage (0-100)"
                  />
                  {form.formState.errors.payoutPercentage && (
                    <p className="text-sm text-red-600">{form.formState.errors.payoutPercentage.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateManagementMutation.isPending}
              data-testid="button-update-management"
            >
              {updateManagementMutation.isPending ? "Updating..." : "Update Management Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}