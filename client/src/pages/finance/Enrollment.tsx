import { useState, useEffect } from "react";
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
  addOns: string[];
  discounts: string[];
  discountPercentage: string;
  customDiscountAmount: string;
  additionalFees: Array<{ type: string; amount: number; description?: string }>;
  subjectDiscounts: Record<string, {
    discountType: 'none' | 'percentage' | 'fixed';
    discountValue: number;
    discountReason: string;
  }>;
}

interface RollNumberResponse {
  classLevel: string;
  nextRollNumber: string;
  format: string;
  example: string;
}

export default function Enrollment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<EnrollmentFormData>>({
    selectedSubjects: [],
    addOns: [],
    discounts: [],
    discountPercentage: "0",
    customDiscountAmount: "0",
    additionalFees: [],
    subjectDiscounts: {},
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    enabled: currentStep >= 2,
  });

  // Auto-generate roll number when class level is selected
  const { data: nextRollNumberData, refetch: refetchRollNumber } = useQuery<RollNumberResponse>({
    queryKey: ['/api/roll-numbers/next', formData.classLevel],
    enabled: !!formData.classLevel,
  });

  // Update roll number when class level changes or roll number data is fetched
  useEffect(() => {
    if (nextRollNumberData?.nextRollNumber && formData.classLevel) {
      updateFormData('rollNumber', nextRollNumberData.nextRollNumber);
    }
  }, [nextRollNumberData, formData.classLevel]);

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/enrollments', data);
    },
    onSuccess: (response: any) => {
      console.log("Enrollment successful:", response);
      toast({
        title: "Success!",
        description: `Student enrolled successfully! ${response.invoice ? `Invoice ${response.invoice.invoiceNumber} created for Rs.${response.summary.total}` : ''}`,
        variant: "success" as any,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      // Reset form
      setFormData({ selectedSubjects: [], discounts: [] });
      setCurrentStep(1);
    },
    onError: (error: any) => {
      console.error("Enrollment error:", error);
      toast({
        title: "Error",
        description: `Failed to enroll student: ${error.message || 'Please try again.'}`,
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
        
        // Validate Pakistani phone number format
        if (formData.parentPhone) {
          const phoneRegex = /^(\+92|0092|92|0)?(3[0-9]{2}|4[0-9]{2}|5[0-9]{2}|6[0-9]{2}|7[0-9]{2}|8[0-9]{2}|9[0-9]{2})[0-9]{7}$/;
          const cleanPhone = formData.parentPhone.replace(/[\s\-]/g, '');
          if (!phoneRegex.test(cleanPhone)) {
            toast({
              title: "Invalid Phone Number",
              description: "Please enter a valid Pakistani phone number (e.g., +92 300 1234567)",
              variant: "destructive",
            });
            return false;
          }
        }
        
        // Validate email format
        if (formData.parentEmail) {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(formData.parentEmail)) {
            toast({
              title: "Invalid Email",
              description: "Please enter a valid email address (e.g., parent@example.com)",
              variant: "destructive",
            });
            return false;
          }
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
        // Step 3 (add-ons) is optional, so always valid
        return true;

      case 4:
        // Step 4 (discounts) is optional, so always valid
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
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
      
      // Prepare complete enrollment data
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

      // Transform selectedSubjects to include discount information
      const selectedSubjectsWithDiscounts = (formData.selectedSubjects || []).map(subjectId => {
        const subjectDiscounts = formData.subjectDiscounts || {};
        const subjectDiscount = subjectDiscounts[subjectId] || { type: 'none', value: 0, reason: '' };
        
        return {
          subjectId,
          discountType: subjectDiscount.type,
          discountValue: subjectDiscount.value,
          discountReason: subjectDiscount.reason
        };
      });

      const enrollmentData = {
        studentData,
        selectedSubjects: selectedSubjectsWithDiscounts,
        additionalFees
      };
      
      console.log("Submitting enrollment data:", enrollmentData);
      createEnrollmentMutation.mutate(enrollmentData);
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

  const progressPercent = (currentStep / 5) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>New Student Enrollment</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Step</span>
              <span className="text-sm font-semibold text-blue-600">{currentStep}</span>
              <span className="text-sm text-gray-600">of 5</span>
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
                  <Label htmlFor="rollNumber">Roll Number (Auto-Generated)</Label>
                  <div className="p-3 bg-gray-50 border rounded-lg">
                    <div className="flex items-center justify-between">
                      {formData.classLevel ? (
                        formData.rollNumber ? (
                          <div>
                            <div className="text-lg font-semibold text-blue-600" data-testid="text-auto-roll-number">
                              {formData.rollNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              Automatically assigned for {formData.classLevel?.toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="text-gray-600">Generating roll number...</span>
                          </div>
                        )
                      ) : (
                        <div className="text-gray-500">
                          Please select class level first
                        </div>
                      )}
                    </div>
                  </div>
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
          
          {/* Step 3: Add-Ons */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Apply Add-Ons</h3>
              <p className="text-sm text-gray-600">These are one-time fees that will be added to the student's first invoice:</p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="registration-fee"
                    checked={formData.addOns?.includes('registration') || false}
                    onChange={(e) => {
                      const current = formData.addOns || [];
                      if (e.target.checked) {
                        updateFormData('addOns', [...current, 'registration']);
                      } else {
                        updateFormData('addOns', current.filter(addon => addon !== 'registration'));
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                    data-testid="checkbox-registration-fee"
                  />
                  <label htmlFor="registration-fee" className="flex-1">
                    <div className="font-medium">Registration Fees</div>
                    <div className="text-sm text-gray-600">Rs.5,000 - One-time enrollment fee</div>
                  </label>
                  <div className="text-lg font-semibold text-gray-800">Rs.5,000</div>
                </div>
                
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="resource-pack"
                    checked={formData.addOns?.includes('resource-pack') || false}
                    onChange={(e) => {
                      const current = formData.addOns || [];
                      if (e.target.checked) {
                        updateFormData('addOns', [...current, 'resource-pack']);
                      } else {
                        updateFormData('addOns', current.filter(addon => addon !== 'resource-pack'));
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                    data-testid="checkbox-resource-pack"
                  />
                  <label htmlFor="resource-pack" className="flex-1">
                    <div className="font-medium">Resource Pack</div>
                    <div className="text-sm text-gray-600">Rs.4,000 - Study materials and textbooks</div>
                  </label>
                  <div className="text-lg font-semibold text-gray-800">Rs.4,000</div>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    id="online-access"
                    checked={formData.addOns?.includes('online-access') || false}
                    onChange={(e) => {
                      const current = formData.addOns || [];
                      if (e.target.checked) {
                        updateFormData('addOns', [...current, 'online-access']);
                      } else {
                        updateFormData('addOns', current.filter(addon => addon !== 'online-access'));
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                    data-testid="checkbox-online-access"
                  />
                  <label htmlFor="online-access" className="flex-1">
                    <div className="font-medium">Online Access</div>
                    <div className="text-sm text-gray-600">Rs.6,900 - Digital learning platform access</div>
                  </label>
                  <div className="text-lg font-semibold text-gray-800">Rs.6,900</div>
                </div>

                {formData.addOns && formData.addOns.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">
                      Total Add-On Fees: {formatPKR(
                        formData.addOns.reduce((total, addon) => {
                          switch(addon) {
                            case 'registration': return total + 5000;
                            case 'resource-pack': return total + 4000;
                            case 'online-access': return total + 6900;
                            default: return total;
                          }
                        }, 0)
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Subject-Specific Discounts */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Apply Subject-Specific Discounts</h3>
              <p className="text-sm text-gray-600">Set discounts for individual subjects. Teachers can give discounts only on their specific subjects.</p>
              
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
                          <p className="text-sm text-gray-600">Base Fee: {formatPKR(subject.baseFee)}/month</p>
                        </div>
                        <div className="text-right">
                          {subjectDiscount.discountType !== 'none' && (
                            <div className="text-sm text-green-600 font-medium">
                              Discount: {subjectDiscount.discountType === 'percentage' 
                                ? `${subjectDiscount.discountValue}%` 
                                : formatPKR(subjectDiscount.discountValue)}
                            </div>
                          )}
                          <div className="text-lg font-semibold">
                            Final: {formatPKR(
                              subjectDiscount.discountType === 'percentage' 
                                ? subject.baseFee - (subject.baseFee * Number(subjectDiscount.discountValue) / 100)
                                : subject.baseFee - Number(subjectDiscount.discountValue)
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`discount-type-${subjectId}`}>Discount Type</Label>
                          <select
                            id={`discount-type-${subjectId}`}
                            value={subjectDiscount.discountType}
                            onChange={(e) => {
                              const newSubjectDiscounts = {
                                ...subjectDiscounts,
                                [subjectId]: { ...subjectDiscount, discountType: e.target.value as 'none' | 'percentage' | 'fixed' }
                              };
                              updateFormData('subjectDiscounts', newSubjectDiscounts);
                            }}
                            className="w-full p-2 border rounded-md"
                            data-testid={`select-discount-type-${subject.code}`}
                          >
                            <option value="none">No Discount</option>
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>
                        
                        {subjectDiscount.discountType !== 'none' && (
                          <>
                            <div>
                              <Label htmlFor={`discount-value-${subjectId}`}>
                                {subjectDiscount.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (Rs.)'}
                              </Label>
                              <Input
                                id={`discount-value-${subjectId}`}
                                type="number"
                                min="0"
                                max={subjectDiscount.discountType === 'percentage' ? "100" : subject.baseFee.toString()}
                                placeholder={subjectDiscount.discountType === 'percentage' ? "0-100" : "0"}
                                value={subjectDiscount.discountValue || ''}
                                onChange={(e) => {
                                  const newSubjectDiscounts = {
                                    ...subjectDiscounts,
                                    [subjectId]: { ...subjectDiscount, discountValue: parseFloat(e.target.value) || 0 }
                                  };
                                  updateFormData('subjectDiscounts', newSubjectDiscounts);
                                }}
                                data-testid={`input-discount-value-${subject.code}`}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`discount-reason-${subjectId}`}>Reason</Label>
                              <Input
                                id={`discount-reason-${subjectId}`}
                                type="text"
                                placeholder="e.g. Teacher discount, Sibling discount"
                                value={subjectDiscount.discountReason || ''}
                                onChange={(e) => {
                                  const newSubjectDiscounts = {
                                    ...subjectDiscounts,
                                    [subjectId]: { ...subjectDiscount, discountReason: e.target.value }
                                  };
                                  updateFormData('subjectDiscounts', newSubjectDiscounts);
                                }}
                                data-testid={`input-discount-reason-${subject.code}`}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Total Summary */}
              {formData.selectedSubjects && formData.selectedSubjects.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Enrollment Summary</h4>
                  <div className="space-y-1 text-sm">
                    {formData.selectedSubjects.map(subjectId => {
                      const subject = subjects?.find(s => s.id === subjectId);
                      if (!subject) return null;
                      
                      const subjectDiscounts = formData.subjectDiscounts || {};
                      const subjectDiscount = subjectDiscounts[subjectId] || { type: 'none', value: 0 };
                      
                      const discountAmount = subjectDiscount.type === 'percentage' 
                        ? (subject.baseFee * subjectDiscount.value / 100)
                        : subjectDiscount.value;
                      const finalFee = subject.baseFee - discountAmount;
                      
                      return (
                        <div key={subjectId} className="flex justify-between">
                          <span>{subject.name}</span>
                          <span>
                            {discountAmount > 0 && (
                              <span className="text-green-600 mr-2">-{formatPKR(discountAmount)}</span>
                            )}
                            {formatPKR(finalFee)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-1 font-medium flex justify-between">
                      <span>Total Monthly Fees:</span>
                      <span>{formatPKR(
                        formData.selectedSubjects.reduce((total, subjectId) => {
                          const subject = subjects?.find(s => s.id === subjectId);
                          if (!subject) return total;
                          
                          const subjectDiscounts = formData.subjectDiscounts || {};
                          const subjectDiscount = subjectDiscounts[subjectId] || { type: 'none', value: 0 };
                          
                          const discountAmount = subjectDiscount.type === 'percentage' 
                            ? (subject.baseFee * subjectDiscount.value / 100)
                            : subjectDiscount.value;
                          return total + (subject.baseFee - discountAmount);
                        }, 0)
                      )}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Review & Confirm</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                <div><strong>Roll Number:</strong> {formData.rollNumber}</div>
                <div><strong>Class:</strong> {formData.classLevel?.toUpperCase()}</div>
                <div><strong>Parent:</strong> {formData.parentName}</div>
                <div><strong>Contact:</strong> {formData.parentPhone}</div>
                <div><strong>Subjects:</strong> {formData.selectedSubjects?.length || 0} selected</div>
                {formData.addOns && formData.addOns.length > 0 && (
                  <div><strong>Add-Ons:</strong> {formData.addOns.length} selected</div>
                )}
                {formData.subjectDiscounts && Object.keys(formData.subjectDiscounts).some(id => 
                  formData.subjectDiscounts![id].type !== 'none' && formData.subjectDiscounts![id].value > 0
                ) && (
                  <div><strong>Subject Discounts:</strong> Applied to specific subjects</div>
                )}
              </div>

              {/* Calculate and show fee breakdown */}
              {subjects && formData.selectedSubjects && formData.selectedSubjects.length > 0 && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">Fee Breakdown</h4>
                  {formData.selectedSubjects.map(subjectId => {
                    const subject = subjects.find(s => s.id === subjectId);
                    return subject ? (
                      <div key={subject.id} className="flex justify-between text-sm">
                        <span>{subject.name}</span>
                        <span>{formatPKR(subject.baseFee)}</span>
                      </div>
                    ) : null;
                  })}
                  
                  {formData.selectedSubjects.length > 0 && (
                    <>
                      <hr className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span>Monthly Tuition Subtotal</span>
                        <span>{formatPKR(
                          formData.selectedSubjects.reduce((total, subjectId) => {
                            const subject = subjects.find(s => s.id === subjectId);
                            return total + (subject ? parseFloat(subject.baseFee) : 0);
                          }, 0)
                        )}</span>
                      </div>

                      {/* Add-On Fees */}
                      {formData.addOns && formData.addOns.length > 0 && (
                        <>
                          {formData.addOns.map(addon => (
                            <div key={addon} className="flex justify-between text-sm text-blue-600">
                              <span>
                                {addon === 'registration' ? 'Registration Fees' : 
                                 addon === 'resource-pack' ? 'Resource Pack' : 
                                 addon === 'online-access' ? 'Online Access' : addon}
                              </span>
                              <span>+{formatPKR(
                                addon === 'registration' ? 5000 : 
                                addon === 'resource-pack' ? 4000 : 
                                addon === 'online-access' ? 6900 : 0
                              )}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-medium">
                            <span>Subtotal with Add-Ons</span>
                            <span>{formatPKR(
                              formData.selectedSubjects.reduce((total, subjectId) => {
                                const subject = subjects.find(s => s.id === subjectId);
                                return total + (subject ? parseFloat(subject.baseFee) : 0);
                              }, 0) + 
                              (formData.addOns?.reduce((total, addon) => {
                                switch(addon) {
                                  case 'registration': return total + 5000;
                                  case 'resource-pack': return total + 4000;
                                  case 'online-access': return total + 6900;
                                  default: return total;
                                }
                              }, 0) || 0)
                            )}</span>
                          </div>
                        </>
                      )}
                      
                      {/* Discounts */}
                      {((formData.discountPercentage && parseFloat(formData.discountPercentage) > 0) || 
                        (formData.customDiscountAmount && parseFloat(formData.customDiscountAmount) > 0)) && (
                        <>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>
                              {formData.customDiscountAmount && parseFloat(formData.customDiscountAmount) > 0 
                                ? 'Custom Discount (Fixed Amount)'
                                : `Discount (${formData.discountPercentage}%)`}
                            </span>
                            <span>-{formatPKR(
                              formData.customDiscountAmount && parseFloat(formData.customDiscountAmount) > 0 
                                ? parseFloat(formData.customDiscountAmount)
                                : (formData.selectedSubjects.reduce((total, subjectId) => {
                                    const subject = subjects.find(s => s.id === subjectId);
                                    return total + (subject ? parseFloat(subject.baseFee) : 0);
                                  }, 0) * (parseFloat(formData.discountPercentage) / 100))
                            )}</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Total Amount (First Invoice)</span>
                            <span>{formatPKR((() => {
                              const tuitionTotal = formData.selectedSubjects.reduce((total, subjectId) => {
                                const subject = subjects.find(s => s.id === subjectId);
                                return total + (subject ? parseFloat(subject.baseFee) : 0);
                              }, 0);
                              const addOnTotal = formData.addOns?.reduce((total, addon) => {
                                switch(addon) {
                                  case 'registration': return total + 5000;
                                  case 'resource-pack': return total + 4000;
                                  case 'online-access': return total + 6900;
                                  default: return total;
                                }
                              }, 0) || 0;
                              const subtotal = tuitionTotal + addOnTotal;
                              const discountAmount = formData.customDiscountAmount && parseFloat(formData.customDiscountAmount) > 0 
                                ? parseFloat(formData.customDiscountAmount)
                                : (tuitionTotal * (parseFloat(formData.discountPercentage) / 100));
                              return subtotal - discountAmount;
                            })())}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
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
            
            {currentStep < 5 ? (
              <Button onClick={handleNext} data-testid="button-next">
                Next: {currentStep === 1 ? 'Select Subjects' : currentStep === 2 ? 'Add-Ons' : currentStep === 3 ? 'Discounts' : 'Review'}
                <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={createEnrollmentMutation.isPending}
                data-testid="button-submit-enrollment"
              >
                {createEnrollmentMutation.isPending ? 'Enrolling...' : 'Complete Enrollment'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
