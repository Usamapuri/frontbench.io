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
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                {getRoleTitle(mockUser?.role)}
              </h1>
              <nav className="text-sm text-gray-600">
                Home {'>'} {mockUser?.role} {'>'} Dashboard
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Primax Logo */}
              <div className="flex items-center">
                <svg 
                  width="48" 
                  height="32" 
                  viewBox="0 0 300 200" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-auto"
                  data-testid="primax-logo"
                >
                  <defs>
                    <linearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:1}} />
                      <stop offset="50%" style={{stopColor:'#FFA500', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#FF6347', stopOpacity:1}} />
                    </linearGradient>
                    <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#32CD32', stopOpacity:1}} />
                      <stop offset="50%" style={{stopColor:'#00CED1', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#4169E1', stopOpacity:1}} />
                    </linearGradient>
                    <linearGradient id="rightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#4169E1', stopOpacity:1}} />
                      <stop offset="50%" style={{stopColor:'#8A2BE2', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#9932CC', stopOpacity:1}} />
                    </linearGradient>
                  </defs>
                  
                  {/* Left Triangle */}
                  <polygon points="50,170 120,50 150,170" fill="url(#leftGradient)" />
                  
                  {/* Center Triangle */}
                  <polygon points="120,50 190,170 150,170" fill="url(#centerGradient)" />
                  
                  {/* Right Triangle */}
                  <polygon points="150,170 190,170 250,50" fill="url(#rightGradient)" />
                  
                  {/* White accent lines */}
                  <polygon points="80,130 85,120 95,140 90,150" fill="white" opacity="0.3" />
                  <polygon points="130,80 135,70 145,90 140,100" fill="white" opacity="0.3" />
                  <polygon points="180,110 185,100 195,120 190,130" fill="white" opacity="0.3" />
                </svg>
              </div>
              
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
