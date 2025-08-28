import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  selectedRole?: string | null;
}

export default function Layout({ children, selectedRole }: LayoutProps) {
  const mockUser = {
    role: selectedRole,
    firstName: 'Demo',
    lastName: 'User',
    profileImageUrl: null
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
                {getRoleTitle(mockUser?.role)}
              </h1>
              <nav className="text-sm text-gray-600">
                Home {'>'} {mockUser?.role} {'>'} Dashboard
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {mockUser?.firstName} {mockUser?.lastName}
                </p>
                <p className="text-xs text-gray-600 capitalize">{mockUser?.role}</p>
              </div>
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">DU</span>
              </div>
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
