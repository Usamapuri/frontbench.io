import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Student } from "@shared/schema";

export default function StudentLedger() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [feeStatusFilter, setFeeStatusFilter] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const filteredStudents = students?.filter(student => {
    const matchesSearch = searchQuery === "" || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesClass = classFilter === "" || student.classLevel === classFilter;
    
    return matchesSearch && matchesClass;
  }) || [];

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting student ledger...');
  };

  if (isLoading) {
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
                <SelectItem value="">All Classes</SelectItem>
                <SelectItem value="o-level">O-Level</SelectItem>
                <SelectItem value="a-level">A-Level</SelectItem>
              </SelectContent>
            </Select>
            
            <Select onValueChange={setFeeStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-fee-status-filter">
                <SelectValue placeholder="All Fee Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Fee Status</SelectItem>
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
                <SelectItem value="">All Attendance</SelectItem>
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
                  // Mock data for display purposes
                  const outstandingFees = Math.floor(Math.random() * 10000);
                  const attendance = Math.floor(Math.random() * 40) + 60;
                  const grades = ['A+', 'A', 'B+', 'B', 'C+'];
                  const avgGrade = grades[Math.floor(Math.random() * grades.length)];
                  
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
                        <span 
                          className={`font-semibold ${outstandingFees > 0 ? 'text-red-600' : 'text-green-600'}`}
                          data-testid={`text-outstanding-fees-${student.id}`}
                        >
                          Rs. {outstandingFees.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Progress value={attendance} className="w-16 h-2 mr-2" />
                          <span 
                            className={`text-sm font-medium ${
                              attendance >= 90 ? 'text-green-600' : 
                              attendance >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}
                            data-testid={`text-attendance-${student.id}`}
                          >
                            {attendance}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={avgGrade.includes('A') ? 'default' : avgGrade.includes('B') ? 'secondary' : 'outline'}
                          data-testid={`badge-avg-grade-${student.id}`}
                        >
                          {avgGrade}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" data-testid={`button-view-details-${student.id}`}>
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button size="sm" variant="ghost" className="text-green-600" data-testid={`button-record-payment-${student.id}`}>
                            <i className="fas fa-dollar-sign"></i>
                          </Button>
                          <Button size="sm" variant="ghost" data-testid={`button-send-reminder-${student.id}`}>
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
    </div>
  );
}
