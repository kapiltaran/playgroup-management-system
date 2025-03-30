import { useAuth } from "@/context/auth-context";
import { ShieldAlertIcon } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface AccessDeniedProps {
  requiredRole?: string;
  message?: string;
}

export default function AccessDenied({ 
  requiredRole,
  message = "You don't have permission to access this page."
}: AccessDeniedProps) {
  const { user } = useAuth();
  
  // Define the safe pages based on role
  const roleSafePages = {
    parent: "/students",
    teacher: "/dashboard",
    officeadmin: "/dashboard",
    superadmin: "/dashboard"
  };
  
  // Get safe page for current user
  const safePage = user ? (roleSafePages[user.role] || "/") : "/";
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="bg-red-50 p-3 rounded-full mb-4">
        <ShieldAlertIcon className="h-12 w-12 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-600 max-w-md mb-6">{message}</p>
      
      {requiredRole && user && (
        <p className="text-sm text-gray-500 mb-6">
          Required role: <span className="font-medium">{requiredRole}</span> | Your role: <span className="font-medium">{user.role}</span>
        </p>
      )}
      
      <Link href={safePage}>
        <Button>
          Go to Safe Page
        </Button>
      </Link>
    </div>
  );
}