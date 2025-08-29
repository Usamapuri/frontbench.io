import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface DashboardOption {
  role: string;
  title: string;
  description: string;
  icon: string;
  bgColor: string;
  textColor: string;
}

const dashboardOptions: DashboardOption[] = [
  {
    role: 'teacher',
    title: 'Teacher Dashboard',
    description: 'Manage classes, attendance, grades, and digital diary',
    icon: 'fas fa-chalkboard-teacher',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    role: 'finance',
    title: 'Finance Dashboard',
    description: 'Handle enrollment, invoices, payments, and financial reports',
    icon: 'fas fa-calculator',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  {
    role: 'management',
    title: 'Management Dashboard',
    description: 'View reports, manage expenses, and oversee operations',
    icon: 'fas fa-chart-line',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  {
    role: 'parent',
    title: 'Parent Portal',
    description: 'View student progress, fees, and announcements',
    icon: 'fas fa-users',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  }
];


export default function RoleSelector() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || isLoading) return;

    // Clear any existing role selection
    localStorage.removeItem('selectedRole');

    // Auto-redirect non-super admin users to their designated dashboard
    if (!user.isSuperAdmin) {
      let targetDashboard: string;
      
      if (user.role === 'teacher') {
        targetDashboard = 'teacher';
      } else if (user.role === 'finance') {
        targetDashboard = 'finance'; // Front-desk/Finance staff goes to Finance Dashboard
      } else if (user.role === 'management') {
        targetDashboard = 'management';
      } else {
        targetDashboard = 'finance'; // Default fallback for any other roles
      }

      // Set the dashboard role and redirect
      localStorage.setItem('selectedRole', targetDashboard);
      window.location.href = '/dashboard';
      return;
    }
    
    // Super admins stay on this page to choose their dashboard
  }, [user, isLoading]);

  const handleDashboardSelect = (dashboardRole: string, event?: React.MouseEvent) => {
    // Prevent event bubbling if this was called from a button click
    if (event) {
      event.stopPropagation();
    }
    
    try {
      console.log('=== DASHBOARD SELECTION START ===');
      console.log('Dashboard clicked:', dashboardRole);
      console.log('Current user role:', user?.role);
      console.log('Current user isSuperAdmin:', user?.isSuperAdmin);
      
      // Clear any existing role first to avoid conflicts
      localStorage.removeItem('selectedRole');
      
      // Set the new role
      localStorage.setItem('selectedRole', dashboardRole);
      console.log('localStorage set to:', dashboardRole);
      
      
      // Show success message
      toast({
        title: "Dashboard Selected",
        description: `Opening ${dashboardOptions.find(d => d.role === dashboardRole)?.title}`,
      });
      
      // Force a page reload to ensure clean navigation
      setTimeout(() => {
        console.log('Navigating to /dashboard with role:', dashboardRole);
        window.location.href = '/dashboard';
      }, 100);
      
    } catch (error) {
      console.error('Dashboard selection error:', error);
      toast({
        title: "Error",
        description: "Failed to select dashboard",
        variant: "destructive",
      });
    }
  };


  const getAccessibleDashboards = () => {
    if (!user) return [];
    
    // Use the accessibleDashboards array from the backend if available
    if (user.accessibleDashboards && user.accessibleDashboards.length > 0) {
      return dashboardOptions.filter(d => user.accessibleDashboards.includes(d.role));
    }
    
    // Fallback logic for backward compatibility
    if (user.isSuperAdmin) {
      if (user.isTeacher) {
        // Super admin teachers can access all dashboards
        return dashboardOptions;
      } else {
        // Super admin management (non-teachers) can't access teacher dashboard
        return dashboardOptions.filter(d => d.role !== 'teacher');
      }
    } else {
      // Regular users only get their assigned role dashboard
      return dashboardOptions.filter(d => d.role === user.role);
    }
  };

  const getUserRoleDescription = () => {
    if (!user) return '';
    
    if (user.isSuperAdmin) {
      if (user.isTeacher) {
        return 'Super Admin (Teacher) - Full Access';
      } else {
        return 'Super Admin (Management) - Finance, Management & Parent Access';
      }
    } else {
      const roleNames = {
        teacher: 'Teacher',
        finance: 'Finance Staff',
        parent: 'Parent',
        management: 'Management Staff'
      };
      return `${roleNames[user.role as keyof typeof roleNames]} - Limited Access`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your access permissions...</p>
        </div>
      </div>
    );
  }

  const accessibleDashboards = getAccessibleDashboards();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Primax School Management
          </h1>
          {user && (
            <div className="mb-6">
              <p className="text-xl text-gray-700 mb-2">
                Hello, {user.firstName} {user.lastName}
              </p>
              <Badge variant="outline" className="text-sm">
                {getUserRoleDescription()}
              </Badge>
            </div>
          )}
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select which dashboard you would like to access. As a Super Admin, you have access to multiple areas of the system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accessibleDashboards.map((dashboard) => (
            <Card 
              key={dashboard.role}
              className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300 ${dashboard.bgColor}`}
              onClick={() => handleDashboardSelect(dashboard.role)}
              data-testid={`card-dashboard-${dashboard.role}`}
            >
              <CardHeader className="text-center pb-2">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center shadow-sm`}>
                  <i className={`${dashboard.icon} text-2xl ${dashboard.textColor}`}></i>
                </div>
                <CardTitle className={`text-lg ${dashboard.textColor}`}>
                  {dashboard.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-sm text-gray-600 mb-4">
                  {dashboard.description}
                </CardDescription>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={(e) => handleDashboardSelect(dashboard.role, e)}
                  data-testid={`button-select-${dashboard.role}`}
                >
                  Access Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {user?.isSuperAdmin && (
          <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <i className="fas fa-info-circle text-blue-600"></i>
              <h3 className="text-lg font-semibold text-blue-900">Super Admin Features</h3>
            </div>
            <ul className="text-blue-800 space-y-1">
              {user.isTeacher ? (
                <>
                  <li>• Access all dashboards: Teacher, Finance, Management & Parent</li>
                  <li>• Complete teacher data access for your assigned subjects</li>
                  <li>• Full financial and administrative oversight</li>
                </>
              ) : (
                <>
                  <li>• Access Finance, Management & Parent dashboards</li>
                  <li>• Full financial and administrative oversight</li>
                  <li>• Cannot access Teacher dashboard (not assigned as teacher)</li>
                </>
              )}
            </ul>
          </div>
        )}

        {!user?.isSuperAdmin && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need access to additional areas? Contact your system administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}