import { ComponentType } from "react";
import { useAuth } from "@/context/auth-context";
import AccessDenied from "./access-denied";

type RoleType = "parent" | "teacher" | "officeadmin" | "superadmin";

interface ProtectedRouteProps {
  component: ComponentType;
  allowedRoles: RoleType[];
}

/**
 * Higher-order component for role-based route protection
 * 
 * @param component Component to render if user has access
 * @param allowedRoles Array of roles that can access this route
 */
export default function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: ProtectedRouteProps) {
  const { user } = useAuth();
  
  // Check if user exists and has a role in allowedRoles
  const hasAccess = user && allowedRoles.includes(user.role);

  // If user has access, render the component
  if (hasAccess) {
    return <Component />;
  }
  
  // Otherwise, show access denied
  return (
    <AccessDenied 
      requiredRole={allowedRoles.join(" or ")}
      message="You don't have permission to access this page. Please contact an administrator if you believe this is an error."
    />
  );
}