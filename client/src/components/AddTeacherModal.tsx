import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const classLevelOptions = [
  { value: 'o-level', label: 'O-Level' },
  { value: 'igcse', label: 'IGCSE' },
  { value: 'as-level', label: 'AS-Level' },
  { value: 'a2-level', label: 'A2-Level' },
];

const addTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  teacherClassLevels: z.array(z.string()).min(1, "At least one class level is required"),
  teacherSubjects: z.array(z.string()).min(1, "At least one subject is required"),
  payoutPercentage: z.number().min(0).max(100),
});

type AddTeacherForm = z.infer<typeof addTeacherSchema>;

interface AddTeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTeacherModal({ open, onOpenChange }: AddTeacherModalProps) {
  const [selectedClassLevels, setSelectedClassLevels] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddTeacherForm>({
    resolver: zodResolver(addTeacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      hireDate: "",
      teacherClassLevels: [],
      teacherSubjects: [],
      payoutPercentage: 50,
    },
  });

  // Fetch subjects for selection
  const { data: subjects } = useQuery({
    queryKey: ['/api/subjects'],
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (data: AddTeacherForm) => {
      const teacherData = {
        ...data,
        role: 'teacher',
        isTeacher: true,
        isActive: true,
      };
      return await apiRequest('POST', '/api/teachers', teacherData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher has been added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      onOpenChange(false);
      form.reset();
      setSelectedClassLevels([]);
      setSelectedSubjects([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add teacher",
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

  const onSubmit = (data: AddTeacherForm) => {
    createTeacherMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new teacher to the system with their personal information, teaching assignments, and payout details.
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
                  placeholder="teacher@primax.edu"
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

          {/* Teaching Information */}
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
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              {form.formState.errors.payoutPercentage && (
                <p className="text-sm text-red-600">{form.formState.errors.payoutPercentage.message}</p>
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
              disabled={createTeacherMutation.isPending}
            >
              {createTeacherMutation.isPending ? "Adding..." : "Add Teacher"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}