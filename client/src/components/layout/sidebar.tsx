import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboardIcon,
  UsersIcon,
  DollarSignIcon,
  PackageIcon,
  BarChart3Icon,
  SettingsIcon,
  GraduationCapIcon,
  ReceiptIcon,
  ClipboardCheckIcon,
  ShieldIcon,
  UserCogIcon,
  LogOutIcon
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface SidebarProps {
  setOpen?: (open: boolean) => void;
}

export default function Sidebar({ setOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Base set of navigation items that all users can see
  const baseNavItems = [
    {
      href: "/students",
      label: "Students",
      icon: <UsersIcon className="text-xl mr-3" />,
      roles: ["parent", "teacher", "officeadmin", "superadmin"]
    }
  ];

  // Admin-only navigation items
  const adminNavItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"]
    },
    {
      href: "/classes",
      label: "Classes",
      icon: <GraduationCapIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"]
    },
    {
      href: "/fee-management",
      label: "Fee Management",
      icon: <ClipboardCheckIcon className="text-xl mr-3" />,
      roles: ["officeadmin", "superadmin"]
    },
    {
      href: "/fee-payments",
      label: "Payments",
      icon: <ReceiptIcon className="text-xl mr-3" />,
      roles: ["officeadmin", "superadmin"]
    },
    {
      href: "/expenses",
      label: "Expenses",
      icon: <DollarSignIcon className="text-xl mr-3" />,
      roles: ["officeadmin", "superadmin"]
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: <PackageIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"]
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <BarChart3Icon className="text-xl mr-3" />,
      roles: ["officeadmin", "superadmin"]
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <SettingsIcon className="text-xl mr-3" />,
      roles: ["superadmin"]
    },
  ];

  // Combine and filter based on user role
  const navItems = user ? [
    ...baseNavItems,
    ...adminNavItems.filter(item => item.roles.includes(user.role))
  ] : [];

  const handleClick = () => {
    if (setOpen) {
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item, index) => {
            const isActive = location === item.href || 
                           (item.href === "/dashboard" && location === "/");
            
            return (
              <Link 
                key={index} 
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={handleClick}
              >
                <span
                  className={cn(
                    isActive ? "text-white" : "text-gray-500"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* User profile and logout */}
      {user && (
        <div className="px-2 py-4 border-t border-gray-200">
          <div className="flex items-center px-3 py-2 mb-2">
            <div className="ml-2 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <p className="text-xs font-medium text-primary capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
          >
            <LogOutIcon className="h-5 w-5 mr-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
