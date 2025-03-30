import { ReactNode } from 'react';
import { usePermission } from '@/hooks/use-permission';

type RoleType = "parent" | "teacher" | "officeadmin" | "superadmin";

interface PermissionGateProps {
  children: ReactNode;
  allowedRoles?: RoleType[];
  minRole?: RoleType;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders its children based on user permissions
 * 
 * @param children Content to display if user has permission
 * @param allowedRoles Specific roles that are allowed (optional)
 * @param minRole Minimum role required in hierarchy (optional)
 * @param fallback Optional content to display if permission is denied
 */
export default function PermissionGate({ 
  children, 
  allowedRoles, 
  minRole,
  fallback = null
}: PermissionGateProps) {
  const permission = usePermission();
  
  // Check if user has necessary permissions
  let hasPermission = false;
  
  if (allowedRoles && allowedRoles.length > 0) {
    hasPermission = permission.hasRole(allowedRoles);
  } else if (minRole) {
    hasPermission = permission.hasAtLeastRole(minRole);
  }
  
  // If no permission checks provided, default to showing content
  if (!allowedRoles && !minRole) {
    hasPermission = true;
  }
  
  // Return children if user has permission, otherwise return fallback content or null
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}