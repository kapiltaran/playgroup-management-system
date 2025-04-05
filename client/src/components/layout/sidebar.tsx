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
  LogOutIcon,
  CalendarCheckIcon,
  CalendarIcon,
  BookIcon,
  LayersIcon,
  UsersRoundIcon
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";

interface SidebarProps {
  setOpen?: (open: boolean) => void;
}

export default function Sidebar({ setOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);

  // Define types for navigation items
  type NavItem = {
    href?: string;
    label: string;
    icon: React.ReactNode;
    roles: string[];
    type?: string;
    items?: NavItem[];
    isOpen?: boolean;
    toggle?: () => void;
  };

  // Student management submenu items
  const studentManagementItems: NavItem[] = [
    {
      href: "/students",
      label: "Students",
      icon: <UsersIcon className="text-xl mr-3" />,
      roles: ["parent", "teacher", "officeadmin", "superadmin"]
    },
    {
      href: "/link-classes",
      label: "Link Classes",
      icon: <LayersIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"]
    }
  ];

  // Base set of navigation items that all users can see
  const baseNavItems: NavItem[] = [
    {
      type: "submenu",
      label: "Student Management",
      icon: <UsersIcon className="text-xl mr-3" />,
      roles: ["parent", "teacher", "officeadmin", "superadmin"],
      isOpen: studentMenuOpen,
      toggle: () => setStudentMenuOpen(!studentMenuOpen),
      items: studentManagementItems.filter(item => user?.role ? item.roles.includes(user.role) : false)
    }
  ];

  // Course management submenu items
  const courseManagementItems: NavItem[] = [
    {
      href: "/academic-years",
      label: "Academic Years",
      icon: <CalendarIcon className="text-xl mr-3" />,
      roles: ["superadmin"]
    },
    {
      href: "/classes",
      label: "Classes",
      icon: <GraduationCapIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"]
    },
    {
      href: "/batches",
      label: "Batches",
      icon: <UsersRoundIcon className="text-xl mr-3" />,
      roles: ["officeadmin", "superadmin"]
    },
    {
      href: "/fee-management",
      label: "Fee Management",
      icon: <ClipboardCheckIcon className="text-xl mr-3" />,
      roles: ["officeadmin", "superadmin"]
    }
  ];

  // Admin-only navigation items
  const adminNavItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"]
    },
    {
      type: "submenu",
      label: "Course Management",
      icon: <BookIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"],
      isOpen: courseMenuOpen,
      toggle: () => setCourseMenuOpen(!courseMenuOpen),
      items: courseManagementItems.filter(item => user?.role ? item.roles.includes(user.role) : false)
    },
    {
      href: "/attendance",
      label: "Attendance",
      icon: <CalendarCheckIcon className="text-xl mr-3" />,
      roles: ["teacher", "officeadmin", "superadmin"]
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
    }
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
            if (item.type === "submenu") {
              // This is a submenu
              const isSubmenuActive = item.items?.some(subItem => 
                location === subItem.href
              );
              
              return (
                <div key={index} className="space-y-1">
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md",
                      isSubmenuActive
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => {
                      if (item.toggle) item.toggle();
                    }}
                  >
                    <div className="flex items-center">
                      <span className="text-gray-500">{item.icon}</span>
                      {item.label}
                    </div>
                    <svg
                      className={cn(
                        "h-4 w-4 transition-transform",
                        item.isOpen ? "transform rotate-180" : ""
                      )}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  
                  {/* Submenu items */}
                  {item.isOpen && item.items && (
                    <div className="pl-6 space-y-1">
                      {item.items.map((subItem, subIndex) => {
                        const isSubItemActive = location === subItem.href;
                        
                        return (
                          <Link
                            key={`${index}-${subIndex}`}
                            href={subItem.href || "#"}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                              isSubItemActive
                                ? "bg-primary text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                            onClick={handleClick}
                          >
                            <span
                              className={cn(
                                isSubItemActive ? "text-white" : "text-gray-500"
                              )}
                            >
                              {subItem.icon}
                            </span>
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              // This is a regular menu item
              const isActive = location === item.href || 
                            (item.href === "/dashboard" && location === "/");
              
              return (
                <Link 
                  key={index} 
                  href={item.href || "#"}
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
            }
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
