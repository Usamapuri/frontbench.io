import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStudentSchema, type Subject } from "@shared/schema";
import { formatPKR } from "@/lib/currency";

interface EnrollmentFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  classLevel: 'o-level' | 'a-level';
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  selectedSubjects: string[];
  discounts: string[];
}

export default function Enrollment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<EnrollmentFormData>>({
    selectedSubjects: [],
    discounts: [],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: currentStep >= 2,
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/students', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student enrolled successfully!",
        variant: "success" as any,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      // Reset form
      setFormData({ selectedSubjects: [], discounts: [] });
      setCurrentStep(1);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to enroll student. Please try again.",
        variant: "destructive",
      });
    },
  });

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Validate required fields for Step 1
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'classLevel', 'rollNumber', 'parentName', 'parentPhone'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof EnrollmentFormData]);
        
        if (missingFields.length > 0) {
          toast({
            title: "Required Information Missing",
            description: "Please fill out all required information before moving to the next step",
            variant: "destructive",
          });
          return false;
        }
        
        // Validate date format
        if (formData.dateOfBirth && isNaN(new Date(formData.dateOfBirth).getTime())) {
          toast({
            title: "Invalid Date",
            description: "Please enter a valid date of birth",
            variant: "destructive",
          });
          return false;
        }
        
        return true;
      
      case 2:
        // Validate at least one subject is selected
        if (!formData.selectedSubjects || formData.selectedSubjects.length === 0) {
          toast({
            title: "No Subjects Selected",
            description: "Please select at least one subject to continue",
            variant: "destructive",
          });
          return false;
        }
        return true;
      
      case 3:
        // Step 3 (discounts) is optional, so always valid
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    try {
      const studentData = insertStudentSchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        classLevel: formData.classLevel,
        rollNumber: formData.rollNumber,
      });
      
      createStudentMutation.mutate(studentData);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const progressPercent = (currentStep / 4) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>New Student Enrollment</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Step</span>
              <span className="text-sm font-semibold text-blue-600">{currentStep}</span>
              <span className="text-sm text-gray-600">of 4</span>
            </div>
          </div>
          <Progress value={progressPercent} className="w-full" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Student Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Student Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">Full Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="First Name"
                    value={formData.firstName || ''}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={!formData.firstName ? "border-gray-300 focus:border-blue-500" : "border-green-300 focus:border-green-500"}
                    data-testid="input-first-name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Last Name"
                    value={formData.lastName || ''}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={!formData.lastName ? "border-gray-300 focus:border-blue-500" : "border-green-300 focus:border-green-500"}
                    data-testid="input-last-name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    data-testid="input-date-of-birth"
                  />
                </div>
                
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => updateFormData('gender', value)}>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="classLevel">Class Level *</Label>
                  <Select onValueChange={(value) => updateFormData('classLevel', value)}>
                    <SelectTrigger data-testid="select-class-level">
                      <SelectValue placeholder="Select class level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="o-level">O-Level</SelectItem>
                      <SelectItem value="a-level">A-Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rollNumber">Roll Number *</Label>
                  <Input
                    id="rollNumber"
                    placeholder="Enter roll number"
                    value={formData.rollNumber || ''}
                    onChange={(e) => updateFormData('rollNumber', e.target.value)}
                    data-testid="input-roll-number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                  <Input
                    id="parentName"
                    placeholder="Enter parent's name"
                    value={formData.parentName || ''}
                    onChange={(e) => updateFormData('parentName', e.target.value)}
                    data-testid="input-parent-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="parentPhone">Contact Number *</Label>
                  <Input
                    id="parentPhone"
                    placeholder="+92 300 1234567"
                    value={formData.parentPhone || ''}
                    onChange={(e) => updateFormData('parentPhone', e.target.value)}
                    data-testid="input-parent-phone"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="parentEmail">Email Address</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.parentEmail || ''}
                    onChange={(e) => updateFormData('parentEmail', e.target.value)}
                    data-testid="input-parent-email"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Subject Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Select Subjects</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects?.filter(s => s.classLevel === formData.classLevel).map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id={subject.id}
                      checked={formData.selectedSubjects?.includes(subject.id) || false}
                      onChange={(e) => {
                        const current = formData.selectedSubjects || [];
                        if (e.target.checked) {
                          updateFormData('selectedSubjects', [...current, subject.id]);
                        } else {
                          updateFormData('selectedSubjects', current.filter(id => id !== subject.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600"
                      data-testid={`checkbox-subject-${subject.code}`}
                    />
                    <label htmlFor={subject.id} className="flex-1">
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-sm text-gray-600">{formatPKR(subject.baseFee)}/month</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Discounts */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Apply Discounts</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="sibling-discount"
                    className="w-4 h-4 text-blue-600"
                    data-testid="checkbox-sibling-discount"
                  />
                  <label htmlFor="sibling-discount" className="flex-1">
                    <div className="font-medium">Sibling Discount (10%)</div>
                    <div className="text-sm text-gray-600">For families with multiple children</div>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="referral-discount"
                    className="w-4 h-4 text-blue-600"
                    data-testid="checkbox-referral-discount"
                  />
                  <label htmlFor="referral-discount" className="flex-1">
                    <div className="font-medium">Referral Discount (5%)</div>
                    <div className="text-sm text-gray-600">For students referred by existing families</div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Review & Confirm</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                <div><strong>Roll Number:</strong> {formData.rollNumber}</div>
                <div><strong>Class:</strong> {formData.classLevel?.toUpperCase()}</div>
                <div><strong>Parent:</strong> {formData.parentName}</div>
                <div><strong>Contact:</strong> {formData.parentPhone}</div>
                <div><strong>Subjects:</strong> {formData.selectedSubjects?.length || 0} selected</div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              data-testid="button-previous"
            >
              Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button onClick={handleNext} data-testid="button-next">
                Next: {currentStep === 1 ? 'Select Subjects' : currentStep === 2 ? 'Apply Discounts' : 'Review'}
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={createStudentMutation.isPending}
                data-testid="button-submit-enrollment"
              >
                {createStudentMutation.isPending ? 'Enrolling...' : 'Complete Enrollment'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
