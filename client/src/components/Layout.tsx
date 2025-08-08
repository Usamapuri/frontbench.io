import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                {getRoleTitle(user?.role)}
              </h1>
              <nav className="text-sm text-gray-600">
                Home {'>'} {user?.role} {'>'} Dashboard
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
              </div>
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
            </div>
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

function getRoleTitle(role?: string): string {
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
