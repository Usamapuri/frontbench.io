import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Edit, Settings, Eye, DollarSign, Bell, UserX, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { formatPKR } from "@/lib/currency";
import { apiRequest } from "@/lib/queryClient";
import type { Student } from "@shared/schema";

export default function StudentLedger() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [feeStatusFilter, setFeeStatusFilter] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Status color function matching the invoices page design
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-50 text-red-700'; // Light red for pending
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  
  // Column visibility settings
  const [columnSettings, setColumnSettings] = useState({
    showSubjects: true,
    showCreationDate: true,
    showLastUpdate: false, // Hidden by default as requested
    showDeactivatedStudents: false, // Show deactivated students toggle
  });

  // Edit form data
  const [editFormData, setEditFormData] = useState<any>({});

  const [, setLocation] = useLocation();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch financial data for all students
  const { data: studentsWithFinancialData, isLoading: isLoadingFinancialData } =
    useQuery({
      queryKey: ["/api/students-with-financial"],
      queryFn: async () => {
        if (!students || students.length === 0) return [];

        const studentsWithData = await Promise.all(
          students.map(async (student) => {
            try {
              // Fetch financial, attendance, grade, and enrollment data in parallel
              const [financialRes, attendanceRes, gradeRes, enrollmentsRes] = await Promise.all(
                [
                  fetch(`/api/students/${student.id}/financial`).then((r) =>
                    r.ok ? r.json() : null,
                  ),
                  fetch(`/api/students/${student.id}/attendance`).then((r) =>
                    r.ok ? r.json() : null,
                  ),
                  fetch(`/api/students/${student.id}/grade`).then((r) =>
                    r.ok ? r.json() : null,
                  ),
                  fetch(`/api/enrollments/student/${student.id}`).then((r) =>
                    r.ok ? r.json() : [],
                  ),
                ],
              );

              return {
                ...student,
                feeStatus: financialRes?.feeStatus || "pending",
                outstandingBalance: financialRes?.outstandingBalance || 0,
                attendancePercentage: attendanceRes?.attendancePercentage || 0,
                averageGrade: gradeRes?.averageGrade || "N/A",
                enrollments: enrollmentsRes || [],
                createdAt: student.createdAt || new Date().toISOString(),
                lastUpdated: financialRes?.lastUpdated || student.createdAt || new Date().toISOString(),
              };
            } catch (error) {
              console.error(
                `Error fetching data for student ${student.id}:`,
                error,
              );
              return {
                ...student,
                feeStatus: "pending" as const,
                outstandingBalance: 0,
                attendancePercentage: 0,
                averageGrade: "N/A",
                enrollments: [],
                createdAt: student.createdAt || new Date().toISOString(),
                lastUpdated: student.createdAt || new Date().toISOString(),
              };
            }
          }),
        );

        return studentsWithData;
      },
      enabled: !isLoading && !!students && students.length > 0,
    });

  const filteredStudents =
    studentsWithFinancialData?.filter((student) => {
      const matchesSearch =
        searchQuery === "" ||
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass =
        classFilter === "all" ||
        classFilter === "" ||
        student.classLevels && student.classLevels.includes(classFilter);
      const matchesFeeStatus =
        feeStatusFilter === "all" ||
        feeStatusFilter === "" ||
        student.feeStatus === feeStatusFilter;

      // Attendance filter logic
      const matchesAttendance =
        attendanceFilter === "all" ||
        attendanceFilter === "" ||
        (attendanceFilter === "excellent" &&
          student.attendancePercentage >= 90) ||
        (attendanceFilter === "good" &&
          student.attendancePercentage >= 75 &&
          student.attendancePercentage < 90) ||
        (attendanceFilter === "poor" && student.attendancePercentage < 75);

      // Active/Deactivated filter logic
      const matchesActiveStatus = columnSettings.showDeactivatedStudents 
        ? true // Show all students when toggle is on
        : student.isActive !== false; // Hide deactivated students by default

      return (
        matchesSearch && matchesClass && matchesFeeStatus && matchesAttendance && matchesActiveStatus
      );
    }) || [];

  const handleExport = () => {
    // Export functionality
    toast({
      title: "Export started",
      description: "Student ledger data is being exported...",
    });
  };



  const handleRecordPayment = async (student: any) => {
    setSelectedStudent(student);
    setPaymentAmount(student.outstandingBalance.toString());
    setPaymentMethod("");
    setTransactionNumber("");

    // Fetch the student's outstanding invoices to get the first one to apply payment to
    try {
      const response = await fetch(`/api/students/${student.id}/financial`);
      const financialData = await response.json();

      // Store the first outstanding invoice ID if available
      if (
        financialData.outstandingInvoices &&
        financialData.outstandingInvoices.length > 0
      ) {
        student.firstInvoiceId = financialData.outstandingInvoices[0].id;
      }
    } catch (error) {
      console.error("Error fetching student financial data:", error);
    }

    setShowPaymentDialog(true);
  };

  const handleSendReminder = async (student: any) => {
    try {
      // In a real app, this would send SMS/email reminder
      toast({
        title: "Reminder Sent",
        description: `Fee reminder sent to ${student.firstName} ${student.lastName}'s parents`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  };

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: {
      studentId: string;
      amount: string;
      paymentMethod: string;
      transactionNumber?: string;
      notes?: string;
    }) => {
      const response = await apiRequest("POST", "/api/payments", {
        studentId: paymentData.studentId,
        invoiceId: selectedStudent?.firstInvoiceId, // Link to specific invoice if available
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        transactionNumber: paymentData.transactionNumber,
        paymentDate: new Date().toISOString(),
        notes:
          paymentData.notes ||
          `Payment for ${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment recorded successfully",
        description: `Payment of Rs. ${paymentAmount} recorded for ${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
      });

      // Refresh student data
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/students-with-financial"],
      });

      // Reset form
      setPaymentAmount("");
      setPaymentMethod("");
      setTransactionNumber("");
      setPaymentNotes("");
      setShowPaymentDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitPayment = async () => {
    if (!selectedStudent || !paymentAmount || !paymentMethod) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await paymentMutation.mutateAsync({
        studentId: selectedStudent.id,
        amount: paymentAmount,
        paymentMethod: paymentMethod,
        transactionNumber: transactionNumber || undefined,
        notes: paymentNotes || undefined,
      });
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  // New handler functions
  const handleStudentClick = (student: any) => {
    // Navigate to student's individual portal/dashboard
    setLocation(`/student-portal/${student.id}`);
  };

  const handleEditStudent = (student: any) => {
    setEditFormData({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      classLevels: student.classLevels,
      rollNumber: student.rollNumber,
      studentPhone: student.studentPhone,
      studentEmail: student.studentEmail,
      homeAddress: student.homeAddress,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      additionalParentName: student.additionalParentName,
      additionalParentPhone: student.additionalParentPhone,
      additionalParentEmail: student.additionalParentEmail,
    });
    setSelectedStudent(student);
    setShowEditDialog(true);
  };

  const handleToggleActiveStatus = (student: any) => {
    toggleActiveStatusMutation.mutate({
      studentId: student.id,
      isActive: student.isActive === false ? true : false
    });
  };

  const handleDeleteStudent = (student: any) => {
    setStudentToDelete(student);
    setShowDeleteDialog(true);
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    }
  };



  const handleUpdateColumnSettings = (setting: keyof typeof columnSettings, value: boolean) => {
    setColumnSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Edit form mutation
  const editStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/students/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Student updated",
        description: "Student information has been updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students-with-financial"] });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update student information",
        variant: "destructive",
      });
    },
  });

  // Toggle active status mutation
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async (data: { studentId: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/students/${data.studentId}/toggle-active`, data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.isActive ? "Student reactivated" : "Student deactivated",
        description: variables.isActive 
          ? "Student has been reactivated and can access their portal"
          : "Student has been deactivated and portal access disabled",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students-with-financial"] });
    },
    onError: (error: any) => {
      toast({
        title: "Action failed",
        description: error.message || "Failed to update student status",
        variant: "destructive",
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiRequest("DELETE", `/api/students/${studentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "Student has been permanently deleted from the system",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students-with-financial"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = () => {
    editStudentMutation.mutate(editFormData);
  };

  if (isLoading || isLoadingFinancialData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Ledger</CardTitle>
            <div className="flex space-x-3">
              <div className="relative">
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-students"
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowSettingsDialog(true)} 
                data-testid="button-column-settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                Columns
              </Button>
              <Button onClick={handleExport} data-testid="button-export-ledger">
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select onValueChange={setClassFilter}>
              <SelectTrigger className="w-40" data-testid="select-class-filter">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="o-level">O-Level</SelectItem>
                <SelectItem value="igcse">IGCSE</SelectItem>
                <SelectItem value="as-level">AS-Level</SelectItem>
                <SelectItem value="a2-level">A2-Level</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setFeeStatusFilter}>
              <SelectTrigger
                className="w-40"
                data-testid="select-fee-status-filter"
              >
                <SelectValue placeholder="All Fee Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fee Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setAttendanceFilter}>
              <SelectTrigger
                className="w-40"
                data-testid="select-attendance-filter"
              >
                <SelectValue placeholder="All Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attendance</SelectItem>
                <SelectItem value="excellent">90%+</SelectItem>
                <SelectItem value="good">75-89%</SelectItem>
                <SelectItem value="poor">&lt;75%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Class
                  </th>
                  {columnSettings.showSubjects && (
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Current Subjects
                    </th>
                  )}
                  {columnSettings.showCreationDate && (
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Created
                    </th>
                  )}
                  {columnSettings.showLastUpdate && (
                    <th className="px-4 py-3 text-left font-medium text-gray-700">
                      Last Updated
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Outstanding Fees
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Attendance %
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Avg Grade
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50"
                        data-testid={`row-student-${student.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {student.profileImageUrl && (
                              <img
                                src={student.profileImageUrl}
                                alt="Student photo"
                                className="w-8 h-8 rounded-full object-cover mr-3"
                              />
                            )}
                            <div>
                              <button
                                onClick={() => handleStudentClick(student)}
                                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer text-left"
                                data-testid={`link-student-name-${student.id}`}
                              >
                                {student.firstName} {student.lastName}
                              </button>
                              <p
                                className="text-gray-500"
                                data-testid={`text-roll-number-${student.id}`}
                              >
                                Roll: {student.rollNumber}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {student.classLevels && student.classLevels.length > 0 ? (
                              student.classLevels.map((level, index) => (
                                <Badge
                                  key={index}
                                  variant={
                                    level === "a2-level"
                                      ? "default"
                                      : "secondary"
                                  }
                                  data-testid={`badge-class-${student.id}-${index}`}
                                  className="text-xs"
                                >
                                  {level.toUpperCase()}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                No Class
                              </Badge>
                            )}
                          </div>
                        </td>
                        {columnSettings.showSubjects && (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {student.enrollments?.length > 0 ? (
                                student.enrollments.slice(0, 3).map((enrollment: any, index: number) => (
                                  <Badge 
                                    key={enrollment.id || index} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {enrollment.subjectName || enrollment.subject?.name || 'Unknown'}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-400 text-xs">No subjects</span>
                              )}
                              {student.enrollments?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{student.enrollments.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                        )}
                        {columnSettings.showCreationDate && (
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                        )}
                        {columnSettings.showLastUpdate && (
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {new Date(student.lastUpdated).toLocaleDateString()}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span
                              className={`font-semibold ${student.outstandingBalance > 0 ? "text-red-600" : "text-green-600"}`}
                              data-testid={`text-outstanding-fees-${student.id}`}
                            >
                              Rs. {student.outstandingBalance.toLocaleString()}
                            </span>
                            <Badge
                              className={`${getStatusColor(student.feeStatus || 'unknown')} w-fit mt-1`}
                            >
                              {student.feeStatus ? student.feeStatus.toUpperCase() : 'UNKNOWN'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Progress
                              value={student.attendancePercentage}
                              className="w-16 h-2 mr-2"
                            />
                            <span
                              className={`text-sm font-medium ${
                                student.attendancePercentage >= 90
                                  ? "text-green-600"
                                  : student.attendancePercentage >= 75
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                              data-testid={`text-attendance-${student.id}`}
                            >
                              {student.attendancePercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              student.averageGrade.includes("A")
                                ? "default"
                                : student.averageGrade.includes("B")
                                  ? "secondary"
                                  : "outline"
                            }
                            data-testid={`badge-avg-grade-${student.id}`}
                          >
                            {student.averageGrade}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => handleRecordPayment(student)}
                              data-testid={`button-record-payment-${student.id}`}
                              title="Record Payment"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendReminder(student)}
                              disabled={student.feeStatus === "paid"}
                              data-testid={`button-send-reminder-${student.id}`}
                              title="Send Reminder"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600"
                              onClick={() => handleEditStudent(student)}
                              data-testid={`button-edit-student-${student.id}`}
                              title="Edit Student"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={student.isActive === false ? "text-green-600" : "text-orange-600"}
                              onClick={() => handleToggleActiveStatus(student)}
                              data-testid={`button-toggle-active-${student.id}`}
                              title={student.isActive === false ? "Reactivate Student" : "Deactivate Student"}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleDeleteStudent(student)}
                              data-testid={`button-delete-student-${student.id}`}
                              title="Delete Student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6 + (columnSettings.showSubjects ? 1 : 0) + (columnSettings.showCreationDate ? 1 : 0) + (columnSettings.showLastUpdate ? 1 : 0)}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <i className="fas fa-users text-4xl mb-4"></i>
                      <p>No students found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredStudents.length > 0 && (
            <div className="flex items-center justify-between">
              <div
                className="text-sm text-gray-600"
                data-testid="text-pagination-info"
              >
                Showing 1 to {Math.min(10, filteredStudents.length)} of{" "}
                {filteredStudents.length} students
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="button-previous-page"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Recording payment for:{" "}
                <strong>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </strong>
              </div>
              <div>
                <Label htmlFor="amount">Payment Amount (PKR)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="method">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Number for Bank Transfer */}
              {paymentMethod === "bank_transfer" && (
                <div>
                  <Label htmlFor="transactionNumber">
                    Transaction Number (Optional)
                  </Label>
                  <Input
                    id="transactionNumber"
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    placeholder="Enter bank transaction number"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the bank transaction/reference number for this
                    transfer (if available)
                  </p>
                </div>
              )}

              {/* Notes Field */}
              <div>
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Input
                  id="paymentNotes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add payment notes or details"
                  className="mt-1"
                  data-testid="input-payment-notes"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add any additional notes or details about this payment
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitPayment}>Record Payment</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Column Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Column Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-subjects">Show Current Subjects</Label>
              <Switch
                id="show-subjects"
                checked={columnSettings.showSubjects}
                onCheckedChange={(checked) => handleUpdateColumnSettings('showSubjects', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-creation-date">Show Creation Date</Label>
              <Switch
                id="show-creation-date"
                checked={columnSettings.showCreationDate}
                onCheckedChange={(checked) => handleUpdateColumnSettings('showCreationDate', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-last-update">Show Last Update Date</Label>
              <Switch
                id="show-last-update"
                checked={columnSettings.showLastUpdate}
                onCheckedChange={(checked) => handleUpdateColumnSettings('showLastUpdate', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-deactivated-students">View Deactivated Students</Label>
              <Switch
                id="show-deactivated-students"
                checked={columnSettings.showDeactivatedStudents}
                onCheckedChange={(checked) => handleUpdateColumnSettings('showDeactivatedStudents', checked)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowSettingsDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-first-name">First Name *</Label>
                  <Input
                    id="edit-first-name"
                    value={editFormData.firstName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    data-testid="input-edit-first-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-last-name">Last Name *</Label>
                  <Input
                    id="edit-last-name"
                    value={editFormData.lastName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    data-testid="input-edit-last-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date-of-birth">Date of Birth *</Label>
                  <Input
                    id="edit-date-of-birth"
                    type="date"
                    value={editFormData.dateOfBirth || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    data-testid="input-edit-date-of-birth"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gender">Gender *</Label>
                  <Select 
                    value={editFormData.gender || ''} 
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger data-testid="select-edit-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-class-level">Class Level *</Label>
                  <Select 
                    value={editFormData.classLevels?.[0] || ''} 
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, classLevels: [value] }))}
                  >
                    <SelectTrigger data-testid="select-edit-class-level">
                      <SelectValue placeholder="Select class level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="o-level">O-Level</SelectItem>
                      <SelectItem value="a-level">A-Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-roll-number">Roll Number</Label>
                  <Input
                    id="edit-roll-number"
                    value={editFormData.rollNumber || ''}
                    disabled
                    className="bg-gray-50"
                    data-testid="input-edit-roll-number"
                  />
                  <p className="text-xs text-gray-500 mt-1">Roll number cannot be changed</p>
                </div>
                <div>
                  <Label htmlFor="edit-parent-name">Parent/Guardian Name *</Label>
                  <Input
                    id="edit-parent-name"
                    value={editFormData.parentName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, parentName: e.target.value }))}
                    data-testid="input-edit-parent-name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-parent-phone">Contact Number *</Label>
                  <Input
                    id="edit-parent-phone"
                    placeholder="+92 300 1234567"
                    value={editFormData.parentPhone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                    data-testid="input-edit-parent-phone"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-parent-email">Email Address</Label>
                  <Input
                    id="edit-parent-email"
                    type="email"
                    placeholder="parent@example.com"
                    value={editFormData.parentEmail || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                    data-testid="input-edit-parent-email"
                  />
                </div>
              </div>
              
              {/* Student Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-student-phone">Student Phone Number *</Label>
                  <Input
                    id="edit-student-phone"
                    placeholder="+92 300 1234567"
                    value={editFormData.studentPhone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, studentPhone: e.target.value }))}
                    data-testid="input-edit-student-phone"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-student-email">Student Email Address *</Label>
                  <Input
                    id="edit-student-email"
                    type="email"
                    placeholder="student@example.com"
                    value={editFormData.studentEmail || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
                    data-testid="input-edit-student-email"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-home-address">Home Address</Label>
                  <Textarea
                    id="edit-home-address"
                    placeholder="Enter complete home address"
                    value={editFormData.homeAddress || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, homeAddress: e.target.value }))}
                    data-testid="input-edit-home-address"
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Additional Parent/Guardian Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-additional-parent-name">Additional Parent/Guardian Name</Label>
                  <Input
                    id="edit-additional-parent-name"
                    placeholder="Enter additional parent/guardian name"
                    value={editFormData.additionalParentName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, additionalParentName: e.target.value }))}
                    data-testid="input-edit-additional-parent-name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-additional-parent-phone">Additional Parent/Guardian Contact Number</Label>
                  <Input
                    id="edit-additional-parent-phone"
                    placeholder="+92 300 1234567"
                    value={editFormData.additionalParentPhone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, additionalParentPhone: e.target.value }))}
                    data-testid="input-edit-additional-parent-phone"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-additional-parent-email">Additional Parent/Guardian Email Address</Label>
                  <Input
                    id="edit-additional-parent-email"
                    type="email"
                    placeholder="additional.parent@example.com"
                    value={editFormData.additionalParentEmail || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, additionalParentEmail: e.target.value }))}
                    data-testid="input-edit-additional-parent-email"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={editStudentMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {editStudentMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby="delete-student-description">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center" id="delete-student-description">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Are you absolutely sure?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                You are about to permanently delete{" "}
                <strong>
                  {studentToDelete?.firstName} {studentToDelete?.lastName}
                </strong>{" "}
                from the system.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-xs text-red-700">
                  <strong>Warning:</strong> This action cannot be undone. All student data, 
                  including grades, attendance records, financial history, and portal access 
                  will be permanently removed from the database.
                </p>
              </div>
              <p className="text-xs text-gray-600">
                If you want to temporarily disable the student instead, use the 
                "Deactivate" option which preserves all data.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteStudent}
              disabled={deleteStudentMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Yes, Delete Permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
