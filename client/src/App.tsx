import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import RoleSelector from "@/pages/RoleSelector";
import Layout from "@/components/Layout";
import OfflineBanner from "@/components/OfflineBanner";

// Page imports
import FinanceDashboard from "@/pages/finance/Dashboard";
import Enrollment from "@/pages/finance/Enrollment";
import StudentLedger from "@/pages/finance/StudentLedger";
import Invoices from "@/pages/finance/Invoices";
import Receipts from "@/pages/finance/Receipts";
import DailyClose from "@/pages/finance/DailyClose";
import CashDrawApprovals from "@/pages/finance/CashDrawApprovals";
import Reports from "@/pages/finance/Reports";
import AttendanceManagement from "@/pages/finance/AttendanceManagement";
import PortalLinks from "@/pages/finance/PortalLinks";

import TeacherDashboard from "@/pages/teacher/Dashboard";
import Attendance from "@/pages/teacher/Attendance";
import Gradebook from "@/pages/teacher/Gradebook";
import Earnings from "@/pages/teacher/Earnings";
import DigitalDiary from "@/pages/teacher/DigitalDiary";

import StudentPortal from "@/pages/StudentPortal";

import ManagementDashboard from "@/pages/management/Dashboard";
import Expenses from "@/pages/management/Expenses";
import PayoutSummary from "@/pages/management/PayoutSummary";

function Router() {
  // Get selected role from localStorage
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
            window.location.href = '/';
            return null;
          }
          
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
                    <Route path="/enrollment" component={Enrollment} />
                    <Route path="/students" component={StudentLedger} />
                    <Route path="/invoices" component={Invoices} />
                    <Route path="/receipts" component={Receipts} />
                    <Route path="/daily-close" component={DailyClose} />
                    <Route path="/approvals" component={CashDrawApprovals} />
                    <Route path="/reports" component={Reports} />
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
                  </>
                )}
                
                {/* Management Routes */}
                {selectedRole === 'management' && (
                  <>
                    <Route path="/dashboard" component={ManagementDashboard} />
                    <Route path="/expenses" component={Expenses} />
                    <Route path="/payouts" component={PayoutSummary} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineBanner />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
