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
  subjectDiscounts: Record<string, {
    discountType: 'none' | 'percentage' | 'fixed';
    discountValue: number;
    discountReason: string;
  }>;
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
    subjectDiscounts: {},
  });
  const [currentStep, setCurrentStep] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: currentStep >= 2,
  });

  // Remove roll number preview - it will be generated when student is created

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/enrollments', data);
    },
    onSuccess: (response: any) => {
      toast({
        title: "Success!",
        description: `Student enrolled successfully! Roll Number: ${response.student?.rollNumber || 'Generated'}. ${response.invoice ? `Invoice ${response.invoice.invoiceNumber} created for Rs.${response.summary.total}` : ''}`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      // Reset form
      setFormData({ classLevels: [], selectedSubjects: [], addOns: [], subjectDiscounts: {} });
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
        // rollNumber will be auto-generated by the server
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
      
      // Process add-ons into additionalFees format
      const additionalFees = (formData.addOns || []).map(addon => {
        switch(addon) {
          case 'registration':
            return { type: 'registration', amount: 5000, description: 'Registration Fees' };
          case 'resource-pack':
            return { type: 'resource-pack', amount: 4000, description: 'Resource Pack' };
          case 'online-access':
            return { type: 'online-access', amount: 6900, description: 'Online Access' };
          default:
            return { type: addon, amount: 0, description: addon };
        }
      });

      const enrollmentData = {
        studentData,
        selectedSubjects: formData.selectedSubjects?.map(subjectId => {
          const subjectDiscounts = formData.subjectDiscounts || {};
          const subjectDiscount = subjectDiscounts[subjectId] || { discountType: 'none', discountValue: 0, discountReason: '' };
          
          return {
            subjectId,
            discountType: subjectDiscount.discountType,
            discountValue: subjectDiscount.discountValue,
            discountReason: subjectDiscount.discountReason
          };
        }) || [],
        additionalFees
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
          <div className="flex items-center justify-center max-w-4xl mx-auto">
            {[
              { step: 1, label: 'Student Info' },
              { step: 2, label: 'Subjects' },
              { step: 3, label: 'Add-Ons' },
              { step: 4, label: 'Discounts' },
              { step: 5, label: 'Review' }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    item.step <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.step}
                  </div>
                  <span className="text-sm text-gray-600 mt-2 text-center whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
                {index < 4 && (
                  <ChevronRight className={`w-5 h-5 mx-6 mt-[-20px] ${
                    item.step < currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                )}
              </div>
            ))}
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

                  {/* Roll Number Info */}
                  <div className="mb-8">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Roll Number</Label>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="text-blue-600">
                          <span className="font-medium">Auto-Generated:</span> A unique roll number will be automatically assigned when the student is created (Format: PMX25-####)
                        </div>
                      </div>
                    </div>
                  </div>

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

            {/* Step 3: Add-Ons */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Add-Ons</h2>
                <p className="text-gray-600">Select optional services (one-time fees)</p>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={formData.addOns?.includes('registration') || false}
                        onCheckedChange={(checked) => {
                          const current = formData.addOns || [];
                          if (checked) {
                            updateFormData('addOns', [...current, 'registration']);
                          } else {
                            updateFormData('addOns', current.filter(addon => addon !== 'registration'));
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Registration Fees</div>
                        <div className="text-sm text-gray-600">One-time enrollment fee</div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">Rs. 5,000</div>
                  </label>
                  
                  <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={formData.addOns?.includes('resource-pack') || false}
                        onCheckedChange={(checked) => {
                          const current = formData.addOns || [];
                          if (checked) {
                            updateFormData('addOns', [...current, 'resource-pack']);
                          } else {
                            updateFormData('addOns', current.filter(addon => addon !== 'resource-pack'));
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Resource Pack</div>
                        <div className="text-sm text-gray-600">Study materials and textbooks</div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">Rs. 4,000</div>
                  </label>
                  
                  <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={formData.addOns?.includes('online-access') || false}
                        onCheckedChange={(checked) => {
                          const current = formData.addOns || [];
                          if (checked) {
                            updateFormData('addOns', [...current, 'online-access']);
                          } else {
                            updateFormData('addOns', current.filter(addon => addon !== 'online-access'));
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Online Access</div>
                        <div className="text-sm text-gray-600">Digital learning platform access</div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">Rs. 6,900</div>
                  </label>
                </div>

                {formData.addOns && formData.addOns.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">
                      Total Add-On Fees: Rs. {
                        formData.addOns.reduce((total, addon) => {
                          switch(addon) {
                            case 'registration': return total + 5000;
                            case 'resource-pack': return total + 4000;
                            case 'online-access': return total + 6900;
                            default: return total;
                          }
                        }, 0).toLocaleString()
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Subject-Specific Discounts */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Subject-Specific Discounts</h2>
                <p className="text-gray-600">Apply discounts to individual subjects</p>
                
                <div className="space-y-4">
                  {formData.selectedSubjects?.map((subjectId) => {
                    const subject = subjects?.find(s => s.id === subjectId);
                    if (!subject) return null;
                    
                    const subjectDiscounts = formData.subjectDiscounts || {};
                    const subjectDiscount = subjectDiscounts[subjectId] || { discountType: 'none', discountValue: 0, discountReason: '' };
                    
                    return (
                      <div key={subjectId} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-800">{subject.name}</h4>
                            <p className="text-sm text-gray-600">Base Fee: Rs. {subject.baseFee}/month</p>
                          </div>
                          <div className="text-right">
                            {subjectDiscount.discountType !== 'none' && (
                              <div className="text-sm text-green-600 font-medium">
                                Discount: {subjectDiscount.discountType === 'percentage' 
                                  ? `${subjectDiscount.discountValue}%` 
                                  : `Rs. ${subjectDiscount.discountValue}`}
                              </div>
                            )}
                            <div className="text-lg font-semibold">
                              Final: Rs. {(
                                subjectDiscount.discountType === 'percentage' 
                                  ? Number(subject.baseFee) - (Number(subject.baseFee) * Number(subjectDiscount.discountValue) / 100)
                                  : Number(subject.baseFee) - Number(subjectDiscount.discountValue)
                              ).toLocaleString()}/month
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm text-gray-700">Discount Type</Label>
                            <Select 
                              value={subjectDiscount.discountType} 
                              onValueChange={(value) => {
                                const newDiscounts = { ...formData.subjectDiscounts };
                                newDiscounts[subjectId] = { 
                                  ...subjectDiscount, 
                                  discountType: value as 'none' | 'percentage' | 'fixed' 
                                };
                                updateFormData('subjectDiscounts', newDiscounts);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Discount</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {subjectDiscount.discountType !== 'none' && (
                            <>
                              <div>
                                <Label className="text-sm text-gray-700">
                                  {subjectDiscount.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (Rs.)'}
                                </Label>
                                <Input
                                  type="number"
                                  placeholder={subjectDiscount.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 1000'}
                                  value={subjectDiscount.discountValue}
                                  onChange={(e) => {
                                    const newDiscounts = { ...formData.subjectDiscounts };
                                    newDiscounts[subjectId] = { 
                                      ...subjectDiscount, 
                                      discountValue: Number(e.target.value) 
                                    };
                                    updateFormData('subjectDiscounts', newDiscounts);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-sm text-gray-700">Reason</Label>
                                <Input
                                  placeholder="Reason for discount"
                                  value={subjectDiscount.discountReason}
                                  onChange={(e) => {
                                    const newDiscounts = { ...formData.subjectDiscounts };
                                    newDiscounts[subjectId] = { 
                                      ...subjectDiscount, 
                                      discountReason: e.target.value 
                                    };
                                    updateFormData('subjectDiscounts', newDiscounts);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }) || []}
                  
                  {(!formData.selectedSubjects || formData.selectedSubjects.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No subjects selected. Go back to select subjects first.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
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
                        <div><strong>Roll Number:</strong> Auto-generated (PMX25-####)</div>
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
              
              {currentStep < 5 ? (
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