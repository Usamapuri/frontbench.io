import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import RoleSelector from "@/pages/RoleSelector";
import Layout from "@/components/Layout";
import OfflineBanner from "@/components/OfflineBanner";

// Page imports
import FinanceDashboard from "@/pages/finance/Dashboard";
import EnrollmentNew from "@/pages/finance/EnrollmentNew";
import StudentLedger from "@/pages/finance/StudentLedger";
import Invoices from "@/pages/finance/Invoices";
import Receipts from "@/pages/finance/Receipts";
import DailyClose from "@/pages/finance/DailyClose";
import CashDrawApprovals from "@/pages/finance/CashDrawApprovals";
import Reports from "@/pages/management/Reports";
import AttendanceManagement from "@/pages/finance/AttendanceManagement";
import PortalLinks from "@/pages/finance/PortalLinks";

import TeacherDashboard from "@/pages/teacher/Dashboard";
import Attendance from "@/pages/teacher/Attendance";
import Gradebook from "@/pages/teacher/Gradebook";
import Earnings from "@/pages/teacher/Earnings";
import DigitalDiary from "@/pages/teacher/DigitalDiary";
import ScheduleManager from "@/pages/teacher/ScheduleManager";

import StudentPortal from "@/pages/StudentPortal";

import ManagementDashboard from "@/pages/management/Dashboard";
import Expenses from "@/pages/management/Expenses";
import PayoutSummary from "@/pages/management/PayoutSummary";
import DailyCloseLog from "@/pages/management/DailyCloseLog";
import StaffManagement from "@/pages/management/StaffManagement";

function AuthenticatedRouter() {
  // Get selected role from localStorage - simple and reliable
  const selectedRole = typeof window !== 'undefined' ? localStorage.getItem('selectedRole') : null;

  return (
    <Switch>
      <Route path="/" component={RoleSelector} />
      
      {/* Public student portal routes - accessible without role selection */}
      <Route path="/student/:studentId">
        {(params) => <StudentPortal studentId={params.studentId} />}
      </Route>
      
      {/* All dashboard routes wrapped in Layout */}
      <Route path="/:rest*">
        {(params) => {
          // If no role selected, redirect to home
          if (!selectedRole) {
            console.log('No selectedRole found, redirecting to home');
            window.location.href = '/';
            return null;
          }
          
          console.log('Router: selectedRole is', selectedRole, 'current path:', window.location.pathname);
          
          // Special handling for parent role - no layout/sidebar needed
          if (selectedRole === 'parent') {
            return (
              <Switch>
                <Route path="/dashboard">
                  {() => <StudentPortal studentId="4067f9d8-8deb-44c5-acaf-9067a0ccca21" />}
                </Route>
                <Route component={NotFound} />
              </Switch>
            );
          }

          return (
            <Layout selectedRole={selectedRole}>
              <Switch>
                {/* Finance Routes */}
                {selectedRole === 'finance' && (
                  <>
                    <Route path="/dashboard" component={FinanceDashboard} />
                    <Route path="/enrollment" component={EnrollmentNew} />
                    <Route path="/students" component={StudentLedger} />
                    <Route path="/invoices" component={Invoices} />
                    <Route path="/receipts" component={Receipts} />
                    <Route path="/daily-close" component={DailyClose} />
                    <Route path="/attendance-management" component={AttendanceManagement} />
                    <Route path="/portal-links" component={PortalLinks} />
                  </>
                )}
                
                {/* Teacher Routes */}
                {selectedRole === 'teacher' && (
                  <>
                    <Route path="/dashboard" component={TeacherDashboard} />
                    <Route path="/attendance" component={Attendance} />
                    <Route path="/gradebook" component={Gradebook} />
                    <Route path="/earnings" component={Earnings} />
                    <Route path="/digital-diary" component={DigitalDiary} />
                    <Route path="/schedule-manager" component={ScheduleManager} />
                  </>
                )}
                
                {/* Management Routes */}
                {selectedRole === 'management' && (
                  <>
                    <Route path="/dashboard" component={ManagementDashboard} />
                    <Route path="/expenses" component={Expenses} />
                    <Route path="/payouts" component={PayoutSummary} />
                    <Route path="/daily-close-log" component={DailyCloseLog} />
                    <Route path="/staff-management" component={StaffManagement} />
                    <Route path="/students" component={StudentLedger} />
                    <Route path="/reports" component={Reports} />
                    <Route path="/approvals" component={CashDrawApprovals} />
                  </>
                )}
                
                <Route component={NotFound} />
              </Switch>
            </Layout>
          );
        }}
      </Route>
    </Switch>
  );
}

function AppRouter() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => window.location.reload()} />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineBanner />
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;