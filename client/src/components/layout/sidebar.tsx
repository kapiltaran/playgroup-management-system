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
  UserCogIcon
} from "lucide-react";

interface SidebarProps {
  setOpen?: (open: boolean) => void;
}

export default function Sidebar({ setOpen }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="text-xl mr-3" />
    },
    {
      href: "/students",
      label: "Students",
      icon: <UsersIcon className="text-xl mr-3" />
    },
    {
      href: "/classes",
      label: "Classes",
      icon: <GraduationCapIcon className="text-xl mr-3" />
    },
    {
      href: "/fee-management",
      label: "Fee Management",
      icon: <ClipboardCheckIcon className="text-xl mr-3" />
    },
    {
      href: "/fee-payments",
      label: "Payments",
      icon: <ReceiptIcon className="text-xl mr-3" />
    },
    {
      href: "/expenses",
      label: "Expenses",
      icon: <DollarSignIcon className="text-xl mr-3" />
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: <PackageIcon className="text-xl mr-3" />
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <BarChart3Icon className="text-xl mr-3" />
    },

    {
      href: "/settings",
      label: "Settings",
      icon: <SettingsIcon className="text-xl mr-3" />
    }
  ];

  const handleClick = () => {
    if (setOpen) {
      setOpen(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full">
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item, index) => {
          const isActive = location === item.href || 
                         (item.href === "/dashboard" && location === "/");
          
          return (
            <Link key={index} href={item.href}>
              <a
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
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
