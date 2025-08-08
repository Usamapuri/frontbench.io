import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
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

import TeacherDashboard from "@/pages/teacher/Dashboard";
import Attendance from "@/pages/teacher/Attendance";
import Gradebook from "@/pages/teacher/Gradebook";
import Earnings from "@/pages/teacher/Earnings";

import ParentPortal from "@/pages/parent/Portal";
import AttendanceCalendar from "@/pages/parent/AttendanceCalendar";
import ParentGrades from "@/pages/parent/Grades";

import ManagementDashboard from "@/pages/management/Dashboard";
import Expenses from "@/pages/management/Expenses";
import PayoutSummary from "@/pages/management/PayoutSummary";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/:rest*">
          {() => (
            <Layout>
              <Switch>
                {/* Finance Routes */}
                {user?.role === 'finance' && (
                  <>
                    <Route path="/" component={FinanceDashboard} />
                    <Route path="/enrollment" component={Enrollment} />
                    <Route path="/students" component={StudentLedger} />
                    <Route path="/invoices" component={Invoices} />
                    <Route path="/receipts" component={Receipts} />
                    <Route path="/daily-close" component={DailyClose} />
                    <Route path="/approvals" component={CashDrawApprovals} />
                    <Route path="/reports" component={Reports} />
                  </>
                )}
                
                {/* Teacher Routes */}
                {user?.role === 'teacher' && (
                  <>
                    <Route path="/" component={TeacherDashboard} />
                    <Route path="/attendance" component={Attendance} />
                    <Route path="/gradebook" component={Gradebook} />
                    <Route path="/earnings" component={Earnings} />
                  </>
                )}
                
                {/* Parent Routes */}
                {user?.role === 'parent' && (
                  <>
                    <Route path="/" component={ParentPortal} />
                    <Route path="/attendance" component={AttendanceCalendar} />
                    <Route path="/grades" component={ParentGrades} />
                  </>
                )}
                
                {/* Management Routes */}
                {user?.role === 'management' && (
                  <>
                    <Route path="/" component={ManagementDashboard} />
                    <Route path="/expenses" component={Expenses} />
                    <Route path="/payouts" component={PayoutSummary} />
                  </>
                )}
                
                <Route component={NotFound} />
              </Switch>
            </Layout>
          )}
        </Route>
      )}
      <Route component={NotFound} />
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
