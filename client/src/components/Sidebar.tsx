import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  selectedRole?: string | null;
}

export default function Sidebar({ selectedRole }: SidebarProps) {
  const [location] = useLocation();

  const handleBackToRoleSelection = () => {
    localStorage.removeItem('selectedRole');
    window.location.href = '/';
  };

  const getNavItems = () => {
    switch (selectedRole) {
      case 'finance':
        return [
          { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
          { path: '/enrollment', icon: 'fas fa-user-plus', label: 'Enrollment' },
          { path: '/invoices', icon: 'fas fa-file-invoice', label: 'Invoices' },
          { path: '/receipts', icon: 'fas fa-receipt', label: 'Receipts' },
          { path: '/students', icon: 'fas fa-users', label: 'Student Ledger' },
          { path: '/daily-close', icon: 'fas fa-lock', label: 'Daily Close' },
          { path: '/reports', icon: 'fas fa-chart-line', label: 'Reports' },
          { path: '/approvals', icon: 'fas fa-check-circle', label: 'Cash Draw Approvals' },
        ];
      case 'teacher':
        return [
          { path: '/dashboard', icon: 'fas fa-home', label: 'Today' },
          { path: '/attendance', icon: 'fas fa-calendar-check', label: 'Attendance' },
          { path: '/gradebook', icon: 'fas fa-book', label: 'Gradebook' },
          { path: '/earnings', icon: 'fas fa-dollar-sign', label: 'Earnings' },
        ];
      case 'parent':
        return [
          { path: '/dashboard', icon: 'fas fa-home', label: 'Portal Home' },
          { path: '/attendance', icon: 'fas fa-calendar-alt', label: 'Attendance' },
          { path: '/grades', icon: 'fas fa-graduation-cap', label: 'Grades' },
        ];
      case 'management':
        return [
          { path: '/dashboard', icon: 'fas fa-chart-pie', label: 'Overview' },
          { path: '/expenses', icon: 'fas fa-receipt', label: 'Expenses' },
          { path: '/payouts', icon: 'fas fa-money-bill', label: 'Payout Summary' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <svg 
            width="120" 
            height="40" 
            viewBox="0 0 300 200" 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-auto"
            data-testid="primax-sidebar-logo"
          >
            <defs>
              <linearGradient id="leftGradientSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#FFA500', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#FF6347', stopOpacity:1}} />
              </linearGradient>
              <linearGradient id="centerGradientSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#32CD32', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#00CED1', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#4169E1', stopOpacity:1}} />
              </linearGradient>
              <linearGradient id="rightGradientSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#4169E1', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#8A2BE2', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#9932CC', stopOpacity:1}} />
              </linearGradient>
            </defs>
            
            {/* Left Triangle */}
            <polygon points="50,170 120,50 150,170" fill="url(#leftGradientSidebar)" />
            
            {/* Center Triangle */}
            <polygon points="120,50 190,170 150,170" fill="url(#centerGradientSidebar)" />
            
            {/* Right Triangle */}
            <polygon points="150,170 190,170 250,50" fill="url(#rightGradientSidebar)" />
            
            {/* White accent lines */}
            <polygon points="80,130 85,120 95,140 90,150" fill="white" opacity="0.3" />
            <polygon points="130,80 135,70 145,90 140,100" fill="white" opacity="0.3" />
            <polygon points="180,110 185,100 195,120 190,130" fill="white" opacity="0.3" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 capitalize">{selectedRole} Panel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={cn(
                "flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors min-h-[44px]",
                location === item.path && "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <i className={`${item.icon} w-5 mr-3`}></i>
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t">
        <button 
          onClick={handleBackToRoleSelection}
          className="w-full flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors min-h-[44px]"
          data-testid="button-back-to-roles"
        >
          <i className="fas fa-arrow-left w-5 mr-3"></i>
          Change Role
        </button>
      </div>
    </div>
  );
}
