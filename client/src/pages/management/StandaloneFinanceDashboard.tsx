import { Switch, Route, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ArrowLeft } from "lucide-react";
import primaxLogo from "@assets/primax_logo_1756370699409.png";

// Import finance pages
import FinanceDashboard from "@/pages/finance/Dashboard";
import EnrollmentNew from "@/pages/finance/EnrollmentNew";
import StudentLedger from "@/pages/finance/StudentLedger";
import Invoices from "@/pages/finance/Invoices";
import Receipts from "@/pages/finance/Receipts";
import DailyClose from "@/pages/finance/DailyClose";
import AttendanceManagement from "@/pages/finance/AttendanceManagement";
import PortalLinks from "@/pages/finance/PortalLinks";

export default function StandaloneFinanceDashboard() {
  const { user, logout, isLoggingOut } = useAuth();

  const handleBackToManagement = () => {
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Finance Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="px-6 py-4 border-b min-h-[88px] flex items-center">
          <img src={primaxLogo} alt="Primax" className="h-8" />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link href="/finance-dashboard/dashboard" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-tachometer-alt w-5 mr-3"></i>
            Dashboard
          </Link>
          <Link href="/finance-dashboard/enrollment" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-user-plus w-5 mr-3"></i>
            Enrollment
          </Link>
          <Link href="/finance-dashboard/invoices" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-file-invoice w-5 mr-3"></i>
            Invoices
          </Link>
          <Link href="/finance-dashboard/receipts" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-receipt w-5 mr-3"></i>
            Receipts
          </Link>
          <Link href="/finance-dashboard/students" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-users w-5 mr-3"></i>
            Student Ledger
          </Link>
          <Link href="/finance-dashboard/attendance-management" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-calendar-check w-5 mr-3"></i>
            Attendance
          </Link>
          <Link href="/finance-dashboard/daily-close" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-lock w-5 mr-3"></i>
            Daily Close
          </Link>
          <Link href="/finance-dashboard/portal-links" 
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50">
            <i className="fas fa-link w-5 mr-3"></i>
            Portal Links
          </Link>
        </nav>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Back to Management Button */}
        <header className="bg-white border-b px-6 py-4 min-h-[88px] flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Finance Dashboard
                </h1>
                <nav className="text-sm text-gray-600">
                  Home {'>'} finance {'>'} Dashboard
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
                    <p className="text-xs text-gray-600 capitalize">finance</p>
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
          {/* Finance Dashboard Routes */}
          <Switch>
            <Route path="/finance-dashboard/dashboard" component={FinanceDashboard} />
            <Route path="/finance-dashboard/enrollment" component={EnrollmentNew} />
            <Route path="/finance-dashboard/students" component={StudentLedger} />
            <Route path="/finance-dashboard/invoices" component={Invoices} />
            <Route path="/finance-dashboard/receipts" component={Receipts} />
            <Route path="/finance-dashboard/daily-close" component={DailyClose} />
            <Route path="/finance-dashboard/attendance-management" component={AttendanceManagement} />
            <Route path="/finance-dashboard/portal-links" component={PortalLinks} />
            <Route path="/finance-dashboard" component={FinanceDashboard} />
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