import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const classLevelOptions = [
  { value: 'o-level', label: 'O-Level' },
  { value: 'igcse', label: 'IGCSE' },
  { value: 'as-level', label: 'AS-Level' },
  { value: 'a2-level', label: 'A2-Level' },
];

const positionOptions = [
  'Principal',
  'Vice Principal',
  'Academic Director',
  'Operations Manager',
  'Finance Manager',
  'HR Manager',
  'IT Manager',
  'Student Affairs Officer',
  'Administrative Assistant',
  'Coordinator',
];

const addManagementSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  position: z.string().min(1, "Position is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  isAlsoTeacher: z.boolean().default(false),
  teacherClassLevels: z.array(z.string()).optional(),
  teacherSubjects: z.array(z.string()).optional(),
  payoutPercentage: z.number().min(0).max(100).optional(),
});

type AddManagementForm = z.infer<typeof addManagementSchema>;

interface AddManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddManagementModal({ open, onOpenChange }: AddManagementModalProps) {
  const [selectedClassLevels, setSelectedClassLevels] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddManagementForm>({
    resolver: zodResolver(addManagementSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      hireDate: "",
      isAlsoTeacher: false,
      teacherClassLevels: [],
      teacherSubjects: [],
      payoutPercentage: 50,
    },
  });

  // Fetch subjects for selection
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
  });

  const addManagementMutation = useMutation({
    mutationFn: async (data: AddManagementForm) => {
      const managementData = {
        ...data,
        role: 'management',
        isSuperAdmin: true,
        isTeacher: data.isAlsoTeacher,
        isActive: true,
      };
      return await apiRequest('POST', '/api/management', managementData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Management Account Created Successfully",
        description: (
          <div>
            Management account created with temporary password: <strong>{data.tempPassword}</strong>. Share this with the manager for their first login.
          </div>
        ),
        className: "max-w-md",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      form.reset();
      setSelectedClassLevels([]);
      setSelectedSubjects([]);
      setIsTeacher(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create management account",
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

  const onSubmit = (data: AddManagementForm) => {
    addManagementMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Management Account</DialogTitle>
          <DialogDescription>
            Create a new management account. If they also teach, they will be given super admin teacher privileges.
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
                  data-testid="input-firstName"
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
                  data-testid="input-lastName"
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
                  placeholder="admin@primax.edu"
                  data-testid="input-email"
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
                  data-testid="input-phone"
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
                <Label htmlFor="position">Position *</Label>
                <Select
                  value={form.watch("position")}
                  onValueChange={(value) => form.setValue("position", value)}
                >
                  <SelectTrigger data-testid="select-position">
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

              <div>
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  {...form.register("hireDate")}
                  data-testid="input-hireDate"
                />
                {form.formState.errors.hireDate && (
                  <p className="text-sm text-red-600">{form.formState.errors.hireDate.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAlsoTeacher"
                checked={isTeacher}
                onCheckedChange={handleTeacherCheckboxChange}
                data-testid="checkbox-isAlsoTeacher"
              />
              <Label htmlFor="isAlsoTeacher" className="text-sm font-medium">
                This person is also a teacher (Super Admin Teacher privileges)
              </Label>
            </div>
          </div>

          {/* Teaching Information - Only show if they are also a teacher */}
          {isTeacher && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Teaching Information</h3>
              
              <div>
                <Label>Class Levels *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {classLevelOptions.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`classLevel-${level.value}`}
                        checked={selectedClassLevels.includes(level.value)}
                        onCheckedChange={(checked) => handleClassLevelChange(level.value, !!checked)}
                        data-testid={`checkbox-classLevel-${level.value}`}
                      />
                      <Label htmlFor={`classLevel-${level.value}`} className="text-sm">
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.teacherClassLevels && (
                  <p className="text-sm text-red-600">{form.formState.errors.teacherClassLevels.message}</p>
                )}
              </div>

              <div>
                <Label>Subjects *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {subjects?.filter((subject: any) => 
                    subject.classLevels.some((level: string) => selectedClassLevels.includes(level))
                  ).map((subject: any) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={(checked) => handleSubjectChange(subject.id, !!checked)}
                        data-testid={`checkbox-subject-${subject.id}`}
                      />
                      <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                        {subject.name} ({subject.code})
                      </Label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.teacherSubjects && (
                  <p className="text-sm text-red-600">{form.formState.errors.teacherSubjects.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="payoutPercentage">Payout Percentage *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="payoutPercentage"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register("payoutPercentage", { valueAsNumber: true })}
                    className="w-24"
                    data-testid="input-payoutPercentage"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                {form.formState.errors.payoutPercentage && (
                  <p className="text-sm text-red-600">{form.formState.errors.payoutPercentage.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addManagementMutation.isPending}
              data-testid="button-submit"
            >
              {addManagementMutation.isPending ? "Creating..." : "Create Management Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}