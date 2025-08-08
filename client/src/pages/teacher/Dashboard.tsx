import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { ClassSchedule, TeacherEarnings } from "@/types";

export default function TeacherDashboard() {
  const { data: todayClasses, isLoading: classesLoading } = useQuery<ClassSchedule[]>({
    queryKey: ['/api/teacher/classes/today'],
  });

  const { data: earnings } = useQuery<TeacherEarnings>({
    queryKey: ['/api/teacher/earnings'],
  });

  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  const getClassStatus = (startTime: string, endTime: string): 'completed' | 'in-progress' | 'upcoming' => {
    if (currentTimeString > endTime) return 'completed';
    if (currentTimeString >= startTime && currentTimeString <= endTime) return 'in-progress';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-500';
      case 'in-progress':
        return 'border-l-blue-500';
      case 'upcoming':
        return 'border-l-gray-300';
      default:
        return 'border-l-gray-300';
    }
  };

  if (classesLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Today's Schedule</h1>
          <p className="text-gray-600" data-testid="text-current-date">{todayDate}</p>
        </div>
        <div className="text-sm text-gray-600">
          <i className="fas fa-clock mr-2"></i>
          Current Time: {currentTimeString}
        </div>
      </div>

      {/* Sync Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-sync-alt text-green-500 mr-2"></i>
              <span className="text-sm text-green-700 font-medium">All data synced</span>
            </div>
            <div className="text-xs text-green-600" data-testid="text-last-sync">
              Last sync: 2 minutes ago
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {todayClasses && todayClasses.length > 0 ? todayClasses.map((classItem) => {
          const status = getClassStatus(classItem.startTime, classItem.endTime);
          
          return (
            <Card key={classItem.id} className={`border-l-4 ${getBorderColor(status)}`} data-testid={`card-class-${classItem.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900" data-testid={`text-subject-${classItem.id}`}>
                    {classItem.subject}
                  </h3>
                  <Badge className={getStatusColor(status)} data-testid={`badge-status-${classItem.id}`}>
                    {status === 'in-progress' ? 'In Progress' : 
                     status === 'completed' ? 'Completed' : 'Upcoming'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-1" data-testid={`text-time-${classItem.id}`}>
                  {classItem.startTime} - {classItem.endTime}
                </p>
                <p className="text-xs text-gray-500 mb-3" data-testid={`text-students-${classItem.id}`}>
                  {classItem.name}
                </p>
                
                {status === 'completed' && classItem.attendanceCount && (
                  <div className="mb-3">
                    <span className="text-xs text-green-600" data-testid={`text-attendance-${classItem.id}`}>
                      Attendance: {classItem.attendanceCount.present}/{classItem.attendanceCount.total}
                    </span>
                  </div>
                )}
                
                <div className="mt-2">
                  {status === 'in-progress' ? (
                    <Link href="/attendance">
                      <Button className="w-full" size="sm" data-testid={`button-take-attendance-${classItem.id}`}>
                        Take Attendance
                      </Button>
                    </Link>
                  ) : status === 'upcoming' ? (
                    <Button 
                      className="w-full" 
                      size="sm" 
                      variant="outline" 
                      disabled
                      data-testid={`button-not-started-${classItem.id}`}
                    >
                      Not Started
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-blue-600"
                      data-testid={`button-view-details-${classItem.id}`}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="col-span-full text-center py-12">
            <i className="fas fa-calendar-alt text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-500">No classes scheduled for today</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/attendance">
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto" data-testid="button-tap-attendance">
                <div className="flex items-center">
                  <i className="fas fa-hand-paper text-blue-600 text-xl mr-3"></i>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Tap Method</p>
                    <p className="text-sm text-gray-600">Quick present/absent toggles</p>
                  </div>
                </div>
                <i className="fas fa-arrow-right text-gray-400"></i>
              </Button>
            </Link>
            
            <Link href="/attendance">
              <Button variant="outline" className="w-full flex items-center justify-between p-4 h-auto" data-testid="button-qr-attendance">
                <div className="flex items-center">
                  <i className="fas fa-qrcode text-blue-600 text-xl mr-3"></i>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">QR Scan Method</p>
                    <p className="text-sm text-gray-600">Scan student ID cards</p>
                  </div>
                </div>
                <i className="fas fa-arrow-right text-gray-400"></i>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Earnings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>This Month's Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Base Rate (70%)</span>
              <span className="font-semibold text-gray-900" data-testid="text-base-earnings">
                Rs. {earnings?.baseAmount?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Extra Classes</span>
              <span className="font-semibold text-gray-900" data-testid="text-extra-earnings">
                Rs. {earnings?.extraClasses?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-gray-900 font-medium">Total Earned</span>
              <span className="font-bold text-blue-600 text-lg" data-testid="text-total-earnings">
                Rs. {earnings?.total?.toLocaleString() || '0'}
              </span>
            </div>
            <Link href="/earnings">
              <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-request-cash-draw">
                Request Cash Draw
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/gradebook">
              <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-gradebook">
                <i className="fas fa-book text-2xl text-blue-600"></i>
                <span className="text-sm font-medium">Gradebook</span>
              </Button>
            </Link>
            
            <Link href="/attendance">
              <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-attendance">
                <i className="fas fa-calendar-check text-2xl text-blue-600"></i>
                <span className="text-sm font-medium">Attendance</span>
              </Button>
            </Link>
            
            <Link href="/earnings">
              <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-earnings">
                <i className="fas fa-dollar-sign text-2xl text-blue-600"></i>
                <span className="text-sm font-medium">Earnings</span>
              </Button>
            </Link>
            
            <Button variant="outline" className="h-20 flex flex-col space-y-2" data-testid="button-sync">
              <i className="fas fa-sync-alt text-2xl text-blue-600"></i>
              <span className="text-sm font-medium">Sync Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
