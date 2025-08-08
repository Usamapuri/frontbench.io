import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatPKR } from "@/lib/currency";
import type { Student } from "@shared/schema";

export default function StudentLedger() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [feeStatusFilter, setFeeStatusFilter] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Fetch financial data for all students
  const { data: studentsWithFinancialData, isLoading: isLoadingFinancialData } = useQuery({
    queryKey: ['/api/students-with-financial'],
    queryFn: async () => {
      if (!students || students.length === 0) return [];
      
      const studentsWithData = await Promise.all(
        students.map(async (student) => {
          try {
            // Fetch financial, attendance, and grade data in parallel
            const [financialRes, attendanceRes, gradeRes] = await Promise.all([
              fetch(`/api/students/${student.id}/financial`).then(r => r.ok ? r.json() : null),
              fetch(`/api/students/${student.id}/attendance`).then(r => r.ok ? r.json() : null),
              fetch(`/api/students/${student.id}/grade`).then(r => r.ok ? r.json() : null),
            ]);
            
            return {
              ...student,
              feeStatus: financialRes?.feeStatus || 'pending',
              outstandingBalance: financialRes?.outstandingBalance || 0,
              attendancePercentage: attendanceRes?.attendancePercentage || 0,
              averageGrade: gradeRes?.averageGrade || 'N/A',
            };
          } catch (error) {
            console.error(`Error fetching data for student ${student.id}:`, error);
            return {
              ...student,
              feeStatus: 'pending' as const,
              outstandingBalance: 0,
              attendancePercentage: 0,
              averageGrade: 'N/A',
            };
          }
        })
      );
      
      return studentsWithData;
    },
    enabled: !isLoading && !!students && students.length > 0,
  });

  const filteredStudents = studentsWithFinancialData?.filter(student => {
    const matchesSearch = searchQuery === "" || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = classFilter === "all" || classFilter === "" || student.classLevel === classFilter;
    const matchesFeeStatus = feeStatusFilter === "all" || feeStatusFilter === "" || student.feeStatus === feeStatusFilter;
    
    // Attendance filter logic
    const matchesAttendance = attendanceFilter === "all" || attendanceFilter === "" || 
      (attendanceFilter === "excellent" && student.attendancePercentage >= 90) ||
      (attendanceFilter === "good" && student.attendancePercentage >= 75 && student.attendancePercentage < 90) ||
      (attendanceFilter === "poor" && student.attendancePercentage < 75);
    
    return matchesSearch && matchesClass && matchesFeeStatus && matchesAttendance;
  }) || [];

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting student ledger...');
  };
  
  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setShowDetailsDialog(true);
  };
  
  const handleRecordPayment = (student: any) => {
    setSelectedStudent(student);
    setPaymentAmount(student.outstandingBalance.toString());
    setPaymentMethod("");
    setTransactionNumber("");
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
  
  const handleSubmitPayment = async () => {
    try {
      if (!paymentAmount || !paymentMethod) {
        toast({
          title: "Error",
          description: "Please fill in all payment details",
          variant: "destructive",
        });
        return;
      }

      if (paymentMethod === "bank_transfer" && !transactionNumber.trim()) {
        toast({
          title: "Error",
          description: "Transaction number is required for bank transfers",
          variant: "destructive",
        });
        return;
      }
      
      // In a real app, this would create a payment record with transaction number
      const paymentDetails = {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        ...(paymentMethod === "bank_transfer" && { transactionNumber })
      };
      
      toast({
        title: "Payment Recorded",
        description: `Payment of ${formatPKR(parseFloat(paymentAmount))} via ${paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Cash'} recorded for ${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
        variant: "default",
      });
      
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setTransactionNumber("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
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
                <SelectItem value="a-level">A-Level</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={setFeeStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-fee-status-filter">
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
              <SelectTrigger className="w-40" data-testid="select-attendance-filter">
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
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Class</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Outstanding Fees</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Attendance %</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Avg Grade</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => {
                  return (
                    <tr key={student.id} className="hover:bg-gray-50" data-testid={`row-student-${student.id}`}>
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
                            <p className="font-medium text-gray-900" data-testid={`text-student-name-${student.id}`}>
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-gray-500" data-testid={`text-roll-number-${student.id}`}>
                              Roll: {student.rollNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={student.classLevel === 'a-level' ? 'default' : 'secondary'}
                          data-testid={`badge-class-${student.id}`}
                        >
                          {student.classLevel.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span 
                            className={`font-semibold ${student.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}
                            data-testid={`text-outstanding-fees-${student.id}`}
                          >
                            Rs. {student.outstandingBalance.toLocaleString()}
                          </span>
                          <Badge 
                            variant={
                              student.feeStatus === 'paid' ? 'default' :
                              student.feeStatus === 'overdue' ? 'destructive' :
                              student.feeStatus === 'partial' ? 'secondary' : 'outline'
                            }
                            className="w-fit mt-1"
                          >
                            {student.feeStatus.charAt(0).toUpperCase() + student.feeStatus.slice(1)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Progress value={student.attendancePercentage} className="w-16 h-2 mr-2" />
                          <span 
                            className={`text-sm font-medium ${
                              student.attendancePercentage >= 90 ? 'text-green-600' : 
                              student.attendancePercentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}
                            data-testid={`text-attendance-${student.id}`}
                          >
                            {student.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={student.averageGrade.includes('A') ? 'default' : student.averageGrade.includes('B') ? 'secondary' : 'outline'}
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
                            onClick={() => handleViewDetails(student)}
                            data-testid={`button-view-details-${student.id}`}
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-green-600" 
                            onClick={() => handleRecordPayment(student)}
                            data-testid={`button-record-payment-${student.id}`}
                          >
                            <i className="fas fa-dollar-sign"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleSendReminder(student)}
                            disabled={student.feeStatus === 'paid'}
                            data-testid={`button-send-reminder-${student.id}`}
                          >
                            <i className="fas fa-bell"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
              <div className="text-sm text-gray-600" data-testid="text-pagination-info">
                Showing 1 to {Math.min(10, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" data-testid="button-previous-page">
                  Previous
                </Button>
                <Button size="sm" variant="outline" data-testid="button-next-page">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Student Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Name</Label>
                  <p>{selectedStudent.firstName} {selectedStudent.lastName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Roll Number</Label>
                  <p>{selectedStudent.rollNumber}</p>
                </div>
                <div>
                  <Label className="font-semibold">Class Level</Label>
                  <p>{selectedStudent.classLevel.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Fee Status</Label>
                  <Badge variant={
                    selectedStudent.feeStatus === 'paid' ? 'default' :
                    selectedStudent.feeStatus === 'overdue' ? 'destructive' : 'outline'
                  }>
                    {selectedStudent.feeStatus.charAt(0).toUpperCase() + selectedStudent.feeStatus.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label className="font-semibold">Outstanding Balance</Label>
                  <p className={selectedStudent.outstandingBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {formatPKR(selectedStudent.outstandingBalance)}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Attendance</Label>
                  <p className={
                    selectedStudent.attendancePercentage >= 90 ? 'text-green-600' :
                    selectedStudent.attendancePercentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }>
                    {selectedStudent.attendancePercentage}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Recording payment for: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
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
                  <Label htmlFor="transactionNumber">Transaction Number *</Label>
                  <Input
                    id="transactionNumber"
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    placeholder="Enter bank transaction number"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please enter the bank transaction/reference number for this transfer
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitPayment}>
                  Record Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
