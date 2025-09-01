import { useEffect, useState } from "react";
import { Switch, Route, Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import primaxLogo from "@assets/primax_logo_1756370699409.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ArrowLeft } from "lucide-react";

// Import teacher pages
import TeacherDashboard from "@/pages/teacher/Dashboard";
import Attendance from "@/pages/teacher/Attendance";
import Gradebook from "@/pages/teacher/Gradebook";
import Earnings from "@/pages/teacher/Earnings";
import DigitalDiary from "@/pages/teacher/DigitalDiary";
import ScheduleManager from "@/pages/teacher/ScheduleManager";
// NotFound component not needed - using inline component

interface ImpersonationData {
  teacherId: string;
  teacherName: string;
  originalRole: string;
}

export default function ReadOnlyTeacherDashboard() {
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null);
  const { user, logout, isLoggingOut } = useAuth();

  useEffect(() => {
    const data = sessionStorage.getItem('impersonatingTeacher');
    if (data) {
      setImpersonationData(JSON.parse(data));
    } else {
      // If no impersonation data, redirect back to management
      window.location.href = '/teacher-impersonation';
    }
  }, []);

  const handleBackToManagement = () => {
    sessionStorage.removeItem('impersonatingTeacher');
    localStorage.setItem('selectedRole', 'management');
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    logout();
  };

  // Get user initials for profile circle
  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return 'DU';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  if (!impersonationData) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading impersonation session...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Custom Teacher Sidebar for Impersonation */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="px-6 py-4 border-b min-h-[88px] flex items-center">
          <img src={primaxLogo} alt="Primax" className="h-8" />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link href="/teacher-view-readonly/dashboard" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-home w-5 mr-3"></i>
            Today
          </Link>
          <Link href="/teacher-view-readonly/attendance" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-calendar-check w-5 mr-3"></i>
            Attendance
          </Link>
          <Link href="/teacher-view-readonly/gradebook" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-book w-5 mr-3"></i>
            Gradebook
          </Link>
          <Link href="/teacher-view-readonly/schedule-manager" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-calendar-alt w-5 mr-3"></i>
            Schedule Manager
          </Link>
          <Link href="/teacher-view-readonly/digital-diary" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-bullhorn w-5 mr-3"></i>
            Digital Diary
          </Link>
          <Link href="/teacher-view-readonly/earnings" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-dollar-sign w-5 mr-3"></i>
            Earnings
          </Link>
        </nav>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Impersonation Banner */}
        <header className="bg-white border-b px-6 py-4 min-h-[88px] flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Teacher Dashboard (Read-Only)
                </h1>
                <nav className="text-sm text-gray-600">
                  Home {'>'} teacher-impersonation {'>'} Dashboard
                </nav>
              </div>
              
              {/* Back to Management Dashboard Button */}
              <Button
                onClick={handleBackToManagement}
                variant="outline"
                size="sm"
                className="ml-4 bg-[#253C8D] text-white border-[#253C8D] hover:bg-[#1e3071] hover:border-[#1e3071]"
                data-testid="button-back-to-management"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Management
              </Button>
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">teacher-impersonation</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">{getUserInitials()}</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Impersonation Alert */}
          <div className="mb-6">
            <Alert className="bg-orange-50 border-orange-200">
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-eye text-orange-600"></i>
                  <span className="font-medium text-orange-800">
                    Viewing as: {impersonationData.teacherName}
                  </span>
                  <span className="text-sm text-orange-600">(Read-Only Mode)</span>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Teacher Dashboard Routes */}
          <Switch>
            <Route path="/teacher-view-readonly/dashboard" component={TeacherDashboard} />
            <Route path="/teacher-view-readonly/attendance" component={Attendance} />
            <Route path="/teacher-view-readonly/gradebook" component={Gradebook} />
            <Route path="/teacher-view-readonly/earnings" component={Earnings} />
            <Route path="/teacher-view-readonly/digital-diary" component={DigitalDiary} />
            <Route path="/teacher-view-readonly/schedule-manager" component={ScheduleManager} />
            <Route path="/teacher-view-readonly" component={TeacherDashboard} />
            <Route>
              {() => <div className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
                <p className="text-gray-600">The requested page could not be found.</p>
              </div>}
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}