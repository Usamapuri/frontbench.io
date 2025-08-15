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

// Demo role options for testing
const demoRoleOptions = [
  { value: 'teacher', label: 'Regular Teacher' },
  { value: 'super-admin-teacher', label: 'Super Admin (Teacher)' },
  { value: 'super-admin-management', label: 'Super Admin (Management)' },
  { value: 'finance', label: 'Finance Staff' }
];

export default function RoleSelector() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    // Only clear role selection if we're definitely on the home page
    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '') {
      localStorage.removeItem('selectedRole');
      console.log('RoleSelector mounted on home page, cleared selectedRole');
    } else {
      console.log('RoleSelector mounted on', currentPath, '- not clearing selectedRole');
    }
  }, []);

  const handleDashboardSelect = (dashboardRole: string, event?: React.MouseEvent) => {
    // Prevent event bubbling if this was called from a button click
    if (event) {
      event.stopPropagation();
    }
    
    try {
      console.log('Navigating to dashboard:', dashboardRole);
      
      // Set localStorage first
      localStorage.setItem('selectedRole', dashboardRole);
      setSelectedRole(dashboardRole);
      
      // Dispatch custom event to notify router
      window.dispatchEvent(new Event('roleChanged'));
      
      // Navigate immediately - the state management will handle timing
      setLocation('/dashboard');
      
      toast({
        title: "Dashboard Selected",
        description: `Switched to ${dashboardOptions.find(d => d.role === dashboardRole)?.title}`,
      });
    } catch (error) {
      console.error('Dashboard selection error:', error);
      toast({
        title: "Error",
        description: "Failed to select dashboard",
        variant: "destructive",
      });
    }
  };

  const getCurrentDemoRole = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('role') || 'finance';
  };

  const handleDemoRoleChange = (role: string) => {
    console.log('Switching demo role to:', role);
    // Clear any existing dashboard selection first
    localStorage.removeItem('selectedRole');
    localStorage.setItem('demoRole', role);
    // Reload the page with the new role parameter to refresh authentication
    window.location.href = `/?role=${role}`;
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
        {/* Demo Role Selector */}
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Demo Mode</h3>
              <p className="text-xs text-yellow-700">Switch between different user roles to test the system</p>
            </div>
            <Select onValueChange={handleDemoRoleChange} defaultValue={getCurrentDemoRole()}>
              <SelectTrigger className="w-64" data-testid="select-demo-role">
                <SelectValue placeholder="Select demo role" />
              </SelectTrigger>
              <SelectContent>
                {demoRoleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} data-testid={`option-${option.value}`}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
            {user?.isSuperAdmin 
              ? 'Select which dashboard you would like to access. As a Super Admin, you have access to multiple areas of the system.'
              : 'Access your designated dashboard below.'
            }
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