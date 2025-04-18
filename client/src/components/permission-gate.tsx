import { ReactNode } from 'react';
import { useModulePermission } from '@/hooks/use-module-permission';
import type { ModuleType } from '@/hooks/use-module-permission';
import { useAuth } from '@/context/auth-context';

interface ModulePermissionGateProps {
  moduleName: ModuleType;
  permission: 'view' | 'create' | 'edit' | 'delete' | 'canView' | 'canCreate' | 'canEdit' | 'canUpdate' | 'canDelete';
  children: ReactNode;
  fallback?: ReactNode;
}

interface RolePermissionGateProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

type PermissionGateProps = ModulePermissionGateProps | RolePermissionGateProps;

/**
 * A component that conditionally renders its children based on user module permissions
 * 
 * @example
 * // Only show "Add Student" button for users with create permission
 * <PermissionGate moduleName="students" permission="create">
 *   <Button>Add Student</Button>
 * </PermissionGate>
 * 
 * // Only show content for specific roles
 * <PermissionGate allowedRoles={["superadmin", "officeadmin"]}>
 *   <RestrictedContent />
 * </PermissionGate>
 */
function PermissionGateComponent(props: PermissionGateProps) {
  const { user } = useAuth();
  
  // Check if props is for role-based permission
  if ('allowedRoles' in props) {
    const { allowedRoles, children, fallback = null } = props;
    const hasPermission = user ? allowedRoles.includes(user.role) : false;
    console.log(`[PermissionGate] Role check for ${user?.role} against ${allowedRoles.join(', ')}: ${hasPermission}`);
    return hasPermission ? <>{children}</> : <>{fallback}</>;
  }
  
  // Otherwise it's for module-based permissions
  const { moduleName, permission, children, fallback = null } = props;
  const permissions = useModulePermission(moduleName);
  
  // Check if the user has the requested permission
  const hasPermission = (() => {
    switch (permission) {
      case 'view':
      case 'canView':
        return permissions.canView;
      case 'create':
      case 'canCreate':
        return permissions.canCreate;
      case 'edit':
      case 'canEdit':
      case 'canUpdate':
        return permissions.canEdit;
      case 'delete':
      case 'canDelete':
        return permissions.canDelete;
      default:
        return false;
    }
  })();

  console.log(`[PermissionGate] Module check for ${user?.role} on ${moduleName}.${permission}: ${hasPermission}`, permissions);

  // Render children if user has permission, otherwise render fallback
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Export as both named and default export
export const PermissionGate = PermissionGateComponent;
export default PermissionGateComponent;