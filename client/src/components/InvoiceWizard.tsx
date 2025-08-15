import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckCircle, DollarSign, FileText, GraduationCap, Plus, User } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InvoiceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingInvoice?: any;
}

interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface InvoiceFormData {
  studentId: string;
  dueDate: string;
  selectedSubjects: Array<{
    id: string;
    name: string;
    price: number;
    selected: boolean;
  }>;
  selectedAddOns: Array<{
    id: string;
    name: string;
    price: number;
    selected: boolean;
  }>;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  notes: string;
}

export default function InvoiceWizard({ open, onOpenChange, editingInvoice }: InvoiceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InvoiceFormData>({
    studentId: '',
    dueDate: '',
    selectedSubjects: [],
    selectedAddOns: [],
    discountType: 'percentage',
    discountValue: 0,
    notes: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const steps: WizardStep[] = [
    { id: 1, title: 'Info', description: 'Student & Basic Info', completed: false },
    { id: 2, title: 'Subjects', description: 'Core Subjects', completed: false },
    { id: 3, title: 'Add-ons', description: 'Additional Services', completed: false },
    { id: 4, title: 'Review', description: 'Review & Create', completed: false },
  ];

  // Fetch data
  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/students'],
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['/api/subjects'],
  });

  const { data: addOns = [] } = useQuery<any[]>({
    queryKey: ['/api/add-ons'],
  });

  // Get selected student details
  const selectedStudent = students.find((s: any) => s.id === formData.studentId);

  // Load editing data
  useEffect(() => {
    if (editingInvoice && open) {
      setFormData({
        studentId: editingInvoice.studentId || '',
        dueDate: editingInvoice.dueDate || '',
        selectedSubjects: [],
        selectedAddOns: [],
        discountType: 'percentage',
        discountValue: editingInvoice.discount ? parseFloat(editingInvoice.discount) : 0,
        notes: editingInvoice.notes || '',
      });
    }
  }, [editingInvoice, open]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData({
        studentId: '',
        dueDate: '',
        selectedSubjects: [],
        selectedAddOns: [],
        discountType: 'percentage',
        discountValue: 0,
        notes: '',
      });
    }
  }, [open]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create invoice');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/invoices/${editingInvoice?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update invoice');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const calculateTotals = () => {
    const subjectTotal = formData.selectedSubjects
      .filter(s => s.selected)
      .reduce((sum, s) => sum + s.price, 0);
    
    const addOnTotal = formData.selectedAddOns
      .filter(a => a.selected)
      .reduce((sum, a) => sum + a.price, 0);
    
    const subtotal = subjectTotal + addOnTotal;
    
    let discountAmount = 0;
    if (formData.discountType === 'percentage') {
      discountAmount = (subtotal * formData.discountValue) / 100;
    } else {
      discountAmount = formData.discountValue;
    }
    
    const total = Math.max(0, subtotal - discountAmount);
    
    return { subtotal, discountAmount, total, subjectTotal, addOnTotal };
  };

  const { subtotal, discountAmount, total } = calculateTotals();

  // Step validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.studentId && formData.dueDate;
      case 2:
        return formData.selectedSubjects.some(s => s.selected);
      case 3:
        return true; // Add-ons are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubjectToggle = (subjectId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.map(s =>
        s.id === subjectId ? { ...s, selected: checked } : s
      )
    }));
  };

  const handleAddOnToggle = (addOnId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.map(a =>
        a.id === addOnId ? { ...a, selected: checked } : a
      )
    }));
  };

  const handleSubmit = () => {
    const invoiceData = {
      studentId: formData.studentId,
      dueDate: formData.dueDate,
      subjects: formData.selectedSubjects.filter(s => s.selected),
      addOns: formData.selectedAddOns.filter(a => a.selected),
      discount: discountAmount,
      notes: formData.notes,
      total: total,
    };

    if (editingInvoice) {
      updateInvoiceMutation.mutate(invoiceData);
    } else {
      createInvoiceMutation.mutate(invoiceData);
    }
  };

  // Initialize subjects and add-ons when dialog opens
  useEffect(() => {
    if (open && subjects.length > 0 && formData.selectedSubjects.length === 0) {
      setFormData(prev => ({
        ...prev,
        selectedSubjects: subjects.map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          price: parseFloat(subject.baseFee),
          selected: false,
        })),
      }));
    }
  }, [open, subjects]);

  useEffect(() => {
    if (open && addOns.length > 0 && formData.selectedAddOns.length === 0) {
      setFormData(prev => ({
        ...prev,
        selectedAddOns: addOns.map((addon: any) => ({
          id: addon.id,
          name: addon.name,
          price: parseFloat(addon.price),
          selected: false,
        })),
      }));
    }
  }, [open, addOns]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
          </DialogTitle>
          <p className="text-gray-600">Generate a new invoice for student billing</p>
        </DialogHeader>

        {/* Steps Header */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm
                  ${currentStep === step.id 
                    ? 'bg-blue-600 text-white' 
                    : currentStep > step.id 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className={`font-medium text-sm ${
                    currentStep === step.id ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-4 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Student & Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Step 1: Info
                </h3>
                <p className="text-blue-700 mb-6">Select the student and set the invoice due date</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="student" className="text-blue-900 font-medium">Select Student</Label>
                    <Select 
                      value={formData.studentId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, studentId: value }))}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-student">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(students) && students.map((student: any) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName} (Roll #{student.rollNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate" className="text-blue-900 font-medium">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-2"
                      data-testid="input-due-date"
                    />
                  </div>
                </div>

                {/* Student Info Card */}
                {selectedStudent && (
                  <Card className="mt-6 bg-white/80">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-1">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </h4>
                          <div className="space-y-1 text-sm text-blue-700">
                            <p>Grade: {selectedStudent.classLevel}</p>
                            <p>Roll Number: {selectedStudent.rollNumber}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-green-100 text-green-800">Active Student</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Subjects */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Step 2: Subjects
                </h3>
                <p className="text-purple-700 mb-6">Select core subjects and tuition items:</p>

                <div className="space-y-4">
                  {formData.selectedSubjects.map((subject) => (
                    <Card key={subject.id} className="bg-white/80 hover:bg-white transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={subject.selected}
                              onCheckedChange={(checked) => handleSubjectToggle(subject.id, checked as boolean)}
                              className="h-5 w-5"
                              data-testid={`checkbox-subject-${subject.id}`}
                            />
                            <div>
                              <p className="font-medium text-purple-900">{subject.name}</p>
                              <p className="text-sm text-purple-600">Monthly Tuition</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-900">Rs.{subject.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Add-ons */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Step 3: Add-ons
                </h3>
                <p className="text-green-700 mb-6">Select additional services and materials:</p>

                <div className="space-y-4">
                  {formData.selectedAddOns.length > 0 ? (
                    formData.selectedAddOns.map((addon) => (
                      <Card key={addon.id} className="bg-white/80 hover:bg-white transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={addon.selected}
                                onCheckedChange={(checked) => handleAddOnToggle(addon.id, checked as boolean)}
                                className="h-5 w-5"
                                data-testid={`checkbox-addon-${addon.id}`}
                              />
                              <div>
                                <p className="font-medium text-green-900">{addon.name}</p>
                                <p className="text-sm text-green-600">Additional Service</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-900">Rs.{addon.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-white/80">
                      <CardContent className="p-8 text-center">
                        <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No add-ons available</p>
                        <p className="text-sm text-gray-400">Add-ons will appear here when configured</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Step 4: Review
                </h3>
                <p className="text-gray-700 mb-6">Review & Create Invoice</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Invoice Summary */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Invoice Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-medium text-gray-900">Student: {selectedStudent?.firstName} {selectedStudent?.lastName}</p>
                        <p className="text-sm text-gray-600">Due Date: {formData.dueDate}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Selected Items:</h4>
                        <div className="space-y-2">
                          {formData.selectedSubjects
                            .filter(s => s.selected)
                            .map(subject => (
                              <div key={subject.id} className="flex justify-between text-sm">
                                <span>{subject.name}</span>
                                <span>Rs.{subject.price.toLocaleString()}</span>
                              </div>
                            ))}
                          {formData.selectedAddOns
                            .filter(a => a.selected)
                            .map(addon => (
                              <div key={addon.id} className="flex justify-between text-sm">
                                <span>{addon.name}</span>
                                <span>Rs.{addon.price.toLocaleString()}</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>Rs.{subtotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount:</span>
                            <span>-Rs.{discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t mt-2 pt-2">
                          <span>Total Amount:</span>
                          <span>Rs.{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discount & Notes */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Discount & Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Discount Type</Label>
                        <Select
                          value={formData.discountType}
                          onValueChange={(value: 'percentage' | 'amount') => 
                            setFormData(prev => ({ ...prev, discountType: value }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="amount">Fixed Amount (Rs.)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          value={formData.discountValue}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            discountValue: parseFloat(e.target.value) || 0 
                          }))}
                          placeholder={formData.discountType === 'percentage' ? '0' : '0.00'}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Invoice description or notes"
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
            data-testid="button-previous"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            
            {currentStep < 4 ? (
              <Button 
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                data-testid="button-next"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                data-testid="button-create-invoice"
              >
                {(createInvoiceMutation.isPending || updateInvoiceMutation.isPending) 
                  ? "Processing..." 
                  : editingInvoice 
                    ? "Update Invoice" 
                    : "Create Invoice"
                }
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}