import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, GraduationCap, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, User, Hash, Users } from "lucide-react";
import { format, parseISO } from "date-fns";

interface StudentPortalProps {
  studentId: string;
}

export default function StudentPortal({ studentId }: StudentPortalProps) {
  // Fetch student basic information
  const { data: student } = useQuery({
    queryKey: ['/api/students', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}`);
      return response.ok ? response.json() : null;
    }
  });

  // Fetch student grades and assessments
  const { data: grades } = useQuery({
    queryKey: ['/api/students', studentId, 'grades'],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/grades`);
      return response.ok ? response.json() : [];
    }
  });

  // Fetch student attendance
  const { data: attendance } = useQuery({
    queryKey: ['/api/students', studentId, 'attendance'],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/attendance`);
      return response.ok ? response.json() : [];
    }
  });

  // Fetch student invoices and payment status
  const { data: invoices } = useQuery({
    queryKey: ['/api/students', studentId, 'invoices'],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/invoices`);
      return response.ok ? response.json() : [];
    }
  });

  // Calculate attendance statistics
  const attendanceArray = Array.isArray(attendance) ? attendance : [];
  const attendanceStats = {
    total: attendanceArray.length,
    present: attendanceArray.filter((a: any) => a.status === 'present').length,
    late: attendanceArray.filter((a: any) => a.status === 'late').length,
    absent: attendanceArray.filter((a: any) => a.status === 'absent').length,
  };

  const attendancePercentage = attendanceStats.total > 0 
    ? Math.round(((attendanceStats.present + attendanceStats.late) / attendanceStats.total) * 100)
    : 0;

  // Get recent grades for display
  const recentGrades = grades?.slice(0, 5) || [];

  // Get pending invoices
  const pendingInvoices = invoices?.filter((inv: any) => inv.status === 'sent' || inv.status === 'partial') || [];
  const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid') || [];

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-blue-600">
                <polygon points="12,2 2,7 12,12 22,7" fill="currentColor"/>
                <polyline points="2,17 12,22 22,17" stroke="currentColor" strokeWidth="2" fill="none"/>
                <polyline points="2,12 12,17 22,12" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-xl font-bold text-gray-900">Primax Academy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Header Card */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white/20">
                <AvatarImage src={student.profileImageUrl} />
                <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {student.firstName} {student.lastName}
                </h1>
                <div className="flex items-center gap-6 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span>Student ID: {student.rollNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Class: {student.class || 'O Level'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <Badge variant="secondary" className="bg-green-500 text-white">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Assessments & Grades */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assessments & Grades */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <GraduationCap className="h-5 w-5" />
                  Assessments & Grades
                </CardTitle>
                <p className="text-sm text-green-600">Performance in recent tests and quizzes</p>
              </CardHeader>
              <CardContent className="p-0">
                {recentGrades.length > 0 ? (
                  <div className="overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-6 font-medium text-gray-700">Assessment</th>
                          <th className="text-left py-3 px-6 font-medium text-gray-700">Subject</th>
                          <th className="text-center py-3 px-6 font-medium text-gray-700">Score</th>
                          <th className="text-center py-3 px-6 font-medium text-gray-700">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentGrades.map((grade: any, index: number) => {
                          const percentage = grade.maxScore > 0 ? Math.round((grade.score / grade.maxScore) * 100) : 0;
                          const isGood = percentage >= 80;
                          const isAverage = percentage >= 60 && percentage < 80;
                          
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-4 px-6 font-medium text-gray-900">{grade.assessmentName}</td>
                              <td className="py-4 px-6 text-gray-600">{grade.subjectName}</td>
                              <td className="py-4 px-6 text-center font-mono font-bold">
                                {grade.score} / {grade.maxScore}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <Badge 
                                  variant="secondary" 
                                  className={`font-bold ${
                                    isGood ? 'bg-green-100 text-green-800' :
                                    isAverage ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {percentage}%
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No assessments recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Calendar className="h-5 w-5" />
                  Attendance
                </CardTitle>
                <p className="text-sm text-blue-600">Recent attendance summary and log</p>
              </CardHeader>
              <CardContent className="p-6">
                {/* Attendance Overview */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-medium text-gray-700">Overall Attendance</span>
                    <span className="text-2xl font-bold text-blue-600">{attendancePercentage}%</span>
                  </div>
                  <Progress value={attendancePercentage} className="h-3 mb-4" />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Present</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">Late</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-700">{attendanceStats.late}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-600">Absent</span>
                      </div>
                      <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Log */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Recent Attendance Log</h4>
                  {attendanceArray.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {attendanceArray.slice(0, 10).map((record: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(parseISO(record.attendanceDate), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-gray-600">{record.subjectName}</p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${
                              record.status === 'present' ? 'bg-green-100 text-green-800' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {record.status === 'present' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {record.status === 'late' && <Clock className="h-3 w-3 mr-1" />}
                            {record.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No attendance records yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Fee Status */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <DollarSign className="h-5 w-5" />
                  Fee Status
                </CardTitle>
                <p className="text-sm text-purple-600">Overview of invoices and payments</p>
              </CardHeader>
              <CardContent className="p-6">
                {/* Pending Invoices */}
                {pendingInvoices.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Pending Payments
                    </h4>
                    <div className="space-y-3">
                      {pendingInvoices.map((invoice: any) => (
                        <div key={invoice.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </span>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              {invoice.status === 'partial' ? 'Partially Paid' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Due: {format(parseISO(invoice.dueDate), 'MMM dd, yyyy')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-900">
                              Rs. {(invoice.totalAmount - (invoice.paidAmount || 0)).toLocaleString()}
                            </span>
                            {invoice.status === 'partial' && (
                              <span className="text-sm text-gray-500">
                                of Rs. {invoice.totalAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Paid Invoices */}
                {paidInvoices.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Recent Payments
                    </h4>
                    <div className="space-y-3">
                      {paidInvoices.slice(0, 3).map((invoice: any) => (
                        <div key={invoice.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Paid
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Paid: {format(parseISO(invoice.updatedAt), 'MMM dd, yyyy')}
                          </p>
                          <span className="text-lg font-bold text-gray-900">
                            Rs. {invoice.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No invoices */}
                {(!invoices || invoices.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No fee records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2025 Primax Academy. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}