import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Attendance, Student } from "@shared/schema";

export default function AttendanceCalendar() {
  const [selectedChild, setSelectedChild] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: children } = useQuery<Student[]>({
    queryKey: ['/api/students'], // In real implementation, filter by parent ID
  });

  const { data: attendanceData } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/student', selectedChild],
    enabled: !!selectedChild,
  });

  const selectedChildData = children?.find(child => child.id === selectedChild);

  // Generate calendar days for the selected month
  const generateCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getAttendanceStatus = (day: number) => {
    if (!attendanceData || !day) return null;
    
    const dateString = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];
    const attendance = attendanceData.find(a => 
      a.attendanceDate === dateString
    );
    
    return attendance?.status || null;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 text-white';
      case 'absent':
        return 'bg-red-500 text-white';
      case 'late':
        return 'bg-yellow-500 text-white';
      default:
        // Weekend or holiday
        const dayOfWeek = new Date(selectedYear, selectedMonth, parseInt(status || '1')).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6 ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-800';
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === selectedMonth && 
           today.getFullYear() === selectedYear;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarDays = generateCalendarDays();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate statistics
  const thisMonthAttendance = attendanceData?.filter(a => {
    const attendanceDate = new Date(a.attendanceDate);
    return attendanceDate.getMonth() === selectedMonth && 
           attendanceDate.getFullYear() === selectedYear;
  }) || [];

  const presentCount = thisMonthAttendance.filter(a => a.status === 'present').length;
  const absentCount = thisMonthAttendance.filter(a => a.status === 'absent').length;
  const lateCount = thisMonthAttendance.filter(a => a.status === 'late').length;
  const totalDays = thisMonthAttendance.length;
  const attendancePercentage = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Calendar</CardTitle>
            <div className="flex space-x-3">
              {children && children.length > 1 && (
                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger className="w-48" data-testid="select-child">
                    <SelectValue placeholder="Select child..." />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-20" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!selectedChild && children && children.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <i className="fas fa-calendar-alt text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Child</h3>
              <p className="text-gray-600">
                Choose a child from the dropdown above to view their attendance calendar
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedChild && (
        <>
          {/* Attendance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-present">
                    {presentCount}
                  </p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600" data-testid="stat-absent">
                    {absentCount}
                  </p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600" data-testid="stat-late">
                    {lateCount}
                  </p>
                  <p className="text-sm text-gray-600">Late</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600" data-testid="stat-percentage">
                    {attendancePercentage.toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-600">Attendance</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>
                {monthNames[selectedMonth]} {selectedYear} - {selectedChildData?.firstName} {selectedChildData?.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {daysOfWeek.map((day) => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="p-2"></div>;
                  }
                  
                  const status = getAttendanceStatus(day);
                  const todayClass = isToday(day) ? 'ring-2 ring-blue-500' : '';
                  
                  return (
                    <div
                      key={day}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                        ${getStatusColor(status)} ${todayClass}
                      `}
                      data-testid={`calendar-day-${day}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-6 mt-6 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Present</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Absent</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Late</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-gray-600">Today</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
                  <span className="text-gray-600">Holiday</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject-wise Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-flask text-blue-600 text-sm"></i>
                    </div>
                    <span className="font-medium">Chemistry</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600" data-testid="chemistry-percentage">96%</p>
                    <p className="text-xs text-gray-500">24/25 classes</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-calculator text-green-600 text-sm"></i>
                    </div>
                    <span className="font-medium">Physics</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600" data-testid="physics-percentage">92%</p>
                    <p className="text-xs text-gray-500">23/25 classes</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-book text-purple-600 text-sm"></i>
                    </div>
                    <span className="font-medium">Mathematics</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-600" data-testid="math-percentage">88%</p>
                    <p className="text-xs text-gray-500">22/25 classes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
