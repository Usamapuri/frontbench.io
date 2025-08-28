import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import primaxLogo from "@assets/primax_logo_1756370699409.png";

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
          { path: '/attendance-management', icon: 'fas fa-calendar-check', label: 'Attendance' },
          { path: '/daily-close', icon: 'fas fa-lock', label: 'Daily Close' },
          { path: '/reports', icon: 'fas fa-chart-line', label: 'Reports' },
          { path: '/portal-links', icon: 'fas fa-link', label: 'Portal Links' },
          { path: '/approvals', icon: 'fas fa-check-circle', label: 'Cash Draw Approvals' },
        ];
      case 'teacher':
        return [
          { path: '/dashboard', icon: 'fas fa-home', label: 'Today' },
          { path: '/attendance', icon: 'fas fa-calendar-check', label: 'Attendance' },
          { path: '/gradebook', icon: 'fas fa-book', label: 'Gradebook' },
          { path: '/digital-diary', icon: 'fas fa-bullhorn', label: 'Digital Diary' },
          { path: '/earnings', icon: 'fas fa-dollar-sign', label: 'Earnings' },
        ];
      case 'parent':
        return [
          { path: '/dashboard', icon: 'fas fa-home', label: 'Student Portal' },
        ];
      case 'management':
        return [
          { path: '/dashboard', icon: 'fas fa-chart-pie', label: 'Overview' },
          { path: '/expenses', icon: 'fas fa-receipt', label: 'Expenses' },
          { path: '/payouts', icon: 'fas fa-money-bill', label: 'Payout Summary' },
          { path: '/staff-management', icon: 'fas fa-users', label: 'Staff Management' },
          { path: '/daily-close-log', icon: 'fas fa-calendar-check', label: 'Daily Close Log' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="px-6 py-4 border-b min-h-[88px] flex items-center">
        <div className="flex items-center space-x-3">
          <img 
            src={primaxLogo} 
            alt="Primax Logo" 
            className="h-14 w-auto"
          />
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={cn(
              "flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors min-h-[44px]",
              location === item.path && "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
            )}
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <i className={`${item.icon} w-5 mr-3`}></i>
            {item.label}
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
