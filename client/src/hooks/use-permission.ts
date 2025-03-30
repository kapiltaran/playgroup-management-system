import { useAuth } from "@/context/auth-context";

type RoleType = "parent" | "teacher" | "officeadmin" | "superadmin";

/**
 * Custom hook for checking user permissions based on roles
 * @returns Object with permission checking methods
 */
export function usePermission() {
  const { user } = useAuth();
  
  /**
   * Check if user has any of the allowed roles
   * @param allowedRoles List of roles that have permission
   * @returns Boolean indicating if user has permission
   */
  const hasRole = (allowedRoles: RoleType[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };
  
  /**
   * Check if user is at least the specified role level or higher
   * (Roles are ordered by increasing privilege: parent < teacher < officeadmin < superadmin)
   * 
   * @param minRole Minimum role required
   * @returns Boolean indicating if user has sufficient role level
   */
  const hasAtLeastRole = (minRole: RoleType): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<RoleType, number> = {
      parent: 1,
      teacher: 2,
      officeadmin: 3,
      superadmin: 4
    };
    
    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[minRole];
    
    return userRoleLevel >= requiredRoleLevel;
  };
  
  /**
   * Check if current user is a parent user
   */
  const isParent = (): boolean => {
    return user?.role === "parent";
  };
  
  /**
   * Check if current user is a teacher
   */
  const isTeacher = (): boolean => {
    return user?.role === "teacher";
  };
  
  /**
   * Check if current user is an office admin
   */
  const isOfficeAdmin = (): boolean => {
    return user?.role === "officeadmin";
  };
  
  /**
   * Check if current user is a superadmin
   */
  const isSuperAdmin = (): boolean => {
    return user?.role === "superadmin";
  };
  
  return {
    hasRole,
    hasAtLeastRole,
    isParent,
    isTeacher,
    isOfficeAdmin,
    isSuperAdmin,
    currentRole: user?.role
  };
}