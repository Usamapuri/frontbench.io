import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  selectedRole?: string | null;
}

export default function Layout({ children, selectedRole }: LayoutProps) {
  const { user, logout, isLoggingOut } = useAuth();

  const handleLogout = () => {
    // Clear selected role first
    localStorage.removeItem('selectedRole');
    // Call logout function from useAuth
    logout();
  };

  // Get user initials for profile circle
  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return 'DU';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar selectedRole={selectedRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 min-h-[88px] flex items-center">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                {getRoleTitle(selectedRole)}
              </h1>
              <nav className="text-sm text-gray-600">
                Home {'>'} {selectedRole} {'>'} Dashboard
              </nav>
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">{selectedRole}</p>
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
          {children}
        </main>
      </div>
    </div>
  );
}

function getRoleTitle(role?: string | null): string {
  switch (role) {
    case 'finance':
      return 'Finance Dashboard';
    case 'teacher':
      return 'Teacher Dashboard';
    case 'parent':
      return 'Parent Portal';
    case 'management':
      return 'Management Dashboard';
    default:
      return 'Dashboard';
  }
}
