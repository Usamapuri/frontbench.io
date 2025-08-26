import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertStudentSchema } from "@shared/schema";
import type { z } from "zod";
import { ChevronRight, User, Phone, Mail, MapPin, Users, GraduationCap, FileText } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  classLevels: string[];
  baseFee: string;
  description: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

interface RollNumberResponse {
  classLevel: string;
  nextRollNumber: string;
  format: string;
  example: string;
}

interface EnrollmentFormData {
  // Student Personal Info
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  classLevels: string[];
  rollNumber: string;
  
  // Contact Info
  studentPhone: string;
  studentEmail: string;
  homeAddress: string;
  
  // Parent/Guardian Info
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  
  // Additional Parent/Guardian
  additionalParentName: string;
  additionalParentPhone: string;
  additionalParentEmail: string;
  
  // Enrollment Details
  selectedSubjects: string[];
  addOns: string[];
}

const classLevelOptions = [
  { value: 'o-level', label: 'O-Level', color: 'bg-blue-100 text-blue-800' },
  { value: 'igcse', label: 'IGCSE', color: 'bg-green-100 text-green-800' },
  { value: 'as-level', label: 'AS-Level', color: 'bg-purple-100 text-purple-800' },
  { value: 'a2-level', label: 'A2-Level', color: 'bg-orange-100 text-orange-800' },
];

export default function EnrollmentNew() {
  const [formData, setFormData] = useState<Partial<EnrollmentFormData>>({
    classLevels: [],
    selectedSubjects: [],
    addOns: [],
  });
  const [currentStep, setCurrentStep] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: currentStep >= 2,
  });

  // Auto-generate roll number when class level is selected
  const { data: nextRollNumberData } = useQuery<RollNumberResponse>({
    queryKey: ['/api/roll-numbers/next', formData.classLevels?.[0]],
    enabled: !!(formData.classLevels && formData.classLevels.length > 0),
  });

  // Update roll number when class level changes
  useEffect(() => {
    if (nextRollNumberData?.nextRollNumber && formData.classLevels && formData.classLevels.length > 0) {
      updateFormData('rollNumber', nextRollNumberData.nextRollNumber);
    }
  }, [nextRollNumberData, formData.classLevels]);

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/enrollments', data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Success!",
        description: `Student enrolled successfully! ${response.invoice ? `Invoice ${response.invoice.invoiceNumber} created for Rs.${response.summary.total}` : ''}`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      // Reset form
      setFormData({ classLevels: [], selectedSubjects: [], addOns: [] });
      setCurrentStep(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to enroll student: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    },
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'studentPhone', 'studentEmail', 'parentName', 'parentPhone'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof EnrollmentFormData]);
        
        if (!formData.classLevels || formData.classLevels.length === 0) {
          missingFields.push('classLevels');
        }
        
        if (missingFields.length > 0) {
          toast({
            title: "Missing Information",
            description: `Please fill in: ${missingFields.join(', ')}`,
            variant: "destructive",
          });
          return false;
        }
        return true;
        
      case 2:
        if (!formData.selectedSubjects || formData.selectedSubjects.length === 0) {
          toast({
            title: "No Subjects Selected",
            description: "Please select at least one subject",
            variant: "destructive",
          });
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = () => {
    try {
      const studentData = insertStudentSchema.parse({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        classLevels: formData.classLevels,
        rollNumber: formData.rollNumber,
        studentPhone: formData.studentPhone,
        studentEmail: formData.studentEmail,
        homeAddress: formData.homeAddress,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentEmail: formData.parentEmail,
        additionalParentName: formData.additionalParentName,
        additionalParentPhone: formData.additionalParentPhone,
        additionalParentEmail: formData.additionalParentEmail,
      });
      
      const enrollmentData = {
        student: studentData,
        selectedSubjects: formData.selectedSubjects?.map(subjectId => ({
          subjectId,
          discountType: 'none',
          discountValue: 0,
          discountReason: ''
        })) || [],
        addOns: formData.addOns || [],
      };

      createEnrollmentMutation.mutate(enrollmentData);
    } catch (error: any) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: "Please check all required fields",
        variant: "destructive",
      });
    }
  };

  const filteredSubjects = subjects?.filter(s => 
    formData.classLevels && formData.classLevels.some(level => 
      s.classLevels && s.classLevels.includes(level)
    )
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">New Student Enrollment</h1>
          <p className="text-gray-600 mt-2">Create a new student profile and enroll them in subjects</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[1, 2, 3].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {index < 2 && (
                  <ChevronRight className={`w-5 h-5 mx-2 ${
                    step < currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2 max-w-md mx-auto">
            <span>Student Info</span>
            <span>Subjects</span>
            <span>Review</span>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Step 1: Student Information */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Student Information
                  </h2>
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter first name"
                        value={formData.firstName || ''}
                        onChange={(e) => updateFormData('firstName', e.target.value)}
                        className="mt-1 placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter last name"
                        value={formData.lastName || ''}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        className="mt-1 placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Gender *</Label>
                      <Select onValueChange={(value) => updateFormData('gender', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Class Levels */}
                  <div className="mb-8">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      <GraduationCap className="w-4 h-4 inline mr-1" />
                      Class Level(s) *
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {classLevelOptions.map((option) => (
                        <label key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <Checkbox
                            checked={formData.classLevels?.includes(option.value) || false}
                            onCheckedChange={(checked) => {
                              const currentLevels = formData.classLevels || [];
                              if (checked) {
                                updateFormData('classLevels', [...currentLevels, option.value]);
                              } else {
                                updateFormData('classLevels', currentLevels.filter(l => l !== option.value));
                              }
                            }}
                          />
                          <Badge variant="secondary" className={option.color}>
                            {option.label}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Roll Number */}
                  {formData.classLevels && formData.classLevels.length > 0 && (
                    <div className="mb-8">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Roll Number (Auto-Generated)</Label>
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        {formData.rollNumber ? (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-semibold text-blue-700">{formData.rollNumber}</div>
                              <div className="text-sm text-blue-600">Generated for {formData.classLevels[0]?.toUpperCase()}</div>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Confirmed</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="text-blue-600">Generating roll number...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator className="my-6" />

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Student Phone *</Label>
                        <Input
                          placeholder="+92 300 1234567"
                          value={formData.studentPhone || ''}
                          onChange={(e) => updateFormData('studentPhone', e.target.value)}
                          className="mt-1 placeholder:text-gray-400"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Student Email *</Label>
                        <Input
                          type="email"
                          placeholder="student@example.com"
                          value={formData.studentEmail || ''}
                          onChange={(e) => updateFormData('studentEmail', e.target.value)}
                          className="mt-1 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <Label className="text-sm font-medium text-gray-700">Home Address</Label>
                      <Input
                        placeholder="Enter complete home address"
                        value={formData.homeAddress || ''}
                        onChange={(e) => updateFormData('homeAddress', e.target.value)}
                        className="mt-1 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Parent/Guardian Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Parent/Guardian Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Parent/Guardian Name *</Label>
                        <Input
                          placeholder="Enter parent/guardian name"
                          value={formData.parentName || ''}
                          onChange={(e) => updateFormData('parentName', e.target.value)}
                          className="mt-1 placeholder:text-gray-400"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contact Number *</Label>
                        <Input
                          placeholder="+92 300 1234567"
                          value={formData.parentPhone || ''}
                          onChange={(e) => updateFormData('parentPhone', e.target.value)}
                          className="mt-1 placeholder:text-gray-400"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                        <Input
                          type="email"
                          placeholder="parent@example.com"
                          value={formData.parentEmail || ''}
                          onChange={(e) => updateFormData('parentEmail', e.target.value)}
                          className="mt-1 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    
                    {/* Additional Parent/Guardian (Optional) */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Parent/Guardian (Optional)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Name</Label>
                          <Input
                            placeholder="Additional parent/guardian name"
                            value={formData.additionalParentName || ''}
                            onChange={(e) => updateFormData('additionalParentName', e.target.value)}
                            className="mt-1 placeholder:text-gray-400"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Contact Number</Label>
                          <Input
                            placeholder="+92 300 1234567"
                            value={formData.additionalParentPhone || ''}
                            onChange={(e) => updateFormData('additionalParentPhone', e.target.value)}
                            className="mt-1 placeholder:text-gray-400"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                          <Input
                            type="email"
                            placeholder="additional.parent@example.com"
                            value={formData.additionalParentEmail || ''}
                            onChange={(e) => updateFormData('additionalParentEmail', e.target.value)}
                            className="mt-1 placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Subject Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Select Subjects
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSubjects.map((subject) => (
                    <label key={subject.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={formData.selectedSubjects?.includes(subject.id) || false}
                        onCheckedChange={(checked) => {
                          const current = formData.selectedSubjects || [];
                          if (checked) {
                            updateFormData('selectedSubjects', [...current, subject.id]);
                          } else {
                            updateFormData('selectedSubjects', current.filter(id => id !== subject.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{subject.name}</div>
                        <div className="text-sm text-gray-600">{subject.code}</div>
                        <div className="text-sm font-medium text-green-600">Rs. {subject.baseFee}/month</div>
                        {subject.description && (
                          <div className="text-xs text-gray-500 mt-1">{subject.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {filteredSubjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No subjects available for the selected class levels.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Review & Confirm</h2>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Student Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                        <div><strong>Roll Number:</strong> {formData.rollNumber}</div>
                        <div><strong>Date of Birth:</strong> {formData.dateOfBirth}</div>
                        <div><strong>Gender:</strong> {formData.gender}</div>
                        <div><strong>Class Levels:</strong> 
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.classLevels?.map(level => (
                              <Badge key={level} variant="secondary" className="text-xs">
                                {classLevelOptions.find(opt => opt.value === level)?.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Selected Subjects ({formData.selectedSubjects?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {formData.selectedSubjects?.map(subjectId => {
                          const subject = subjects?.find(s => s.id === subjectId);
                          return subject ? (
                            <div key={subjectId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium">{subject.name}</div>
                                <div className="text-sm text-gray-600">{subject.code}</div>
                              </div>
                              <div className="text-sm font-medium text-green-600">Rs. {subject.baseFee}/month</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={createEnrollmentMutation.isPending}
                >
                  {createEnrollmentMutation.isPending ? 'Creating...' : 'Create Student'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}