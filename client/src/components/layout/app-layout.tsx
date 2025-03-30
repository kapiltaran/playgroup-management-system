import { useState } from "react";
import { Link } from "wouter";
import Sidebar from "./sidebar";
import { MobileNav } from "../ui/mobile-nav";
import { 
  BellIcon, 
  LayoutDashboardIcon, 
  UsersIcon, 
  DollarSignIcon, 
  PackageIcon, 
  BarChart3Icon, 
  MoreHorizontalIcon, 
  MenuIcon 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboardIcon className="h-5 w-5" />
    },
    {
      href: "/students",
      label: "Students",
      icon: <UsersIcon className="h-5 w-5" />
    },
    {
      href: "/expenses",
      label: "Expenses",
      icon: <DollarSignIcon className="h-5 w-5" />
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: <PackageIcon className="h-5 w-5" />
    },
    {
      href: "/reports",
      label: "More",
      icon: <MoreHorizontalIcon className="h-5 w-5" />
    }
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Top header bar */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <Sidebar setOpen={setOpen} />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center ml-2 lg:ml-0">
              <Link href="/dashboard">
                <a className="text-primary font-bold text-xl">PlayGroup Manager</a>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <BellIcon className="h-5 w-5 text-gray-500" />
                <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center bg-secondary text-white">
                  3
                </Badge>
              </Button>
            </div>
            <div className="ml-2 flex items-center">
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                Sarah Connor
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation - hidden on mobile */}
        <aside className="hidden lg:block w-64 bg-white shadow-sm border-r border-gray-200 z-10">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav items={navItems} />
    </div>
  );
}
