import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useQuery } from '@tanstack/react-query';

export type ModuleType = 
  | 'students' 
  | 'classes' 
  | 'fee_management' 
  | 'fee_payments' 
  | 'expenses' 
  | 'inventory' 
  | 'reports' 
  | 'settings' 
  | 'user_management'
  | 'role_management';

interface ModulePermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface RolePermission {
  id: number;
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom hook for checking user permissions for specific modules
 * @param module The module to check permissions for
 * @returns Object with permission state
 */
export function useModulePermission(module: ModuleType) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermission>({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false
  });

  // Fetch role permissions
  const { data: rolePermissions } = useQuery<RolePermission[]>({
    queryKey: ['/api/role-permissions'],
    queryFn: async () => {
      const response = await fetch('/api/role-permissions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!user // Only fetch if user is logged in
  });

  // Find permissions for current user's role and requested module
  useEffect(() => {
    if (rolePermissions && user) {
      console.log(`[useModulePermission] Checking ${module} permissions for ${user.role}`);
      console.log(`[useModulePermission] Available permissions:`, rolePermissions);
      
      const permission = rolePermissions.find(
        p => p.role === user.role && p.module === module
      );

      console.log(`[useModulePermission] Found permission:`, permission);

      if (permission) {
        setPermissions({
          canView: permission.canView,
          canCreate: permission.canCreate,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete
        });
      } else if (user.role === 'superadmin') {
        // Superadmin has all permissions by default
        setPermissions({
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true
        });
      } else {
        // Default to no permissions if not specified
        setPermissions({
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false
        });
      }
      
      console.log(`[useModulePermission] Final permissions for ${module}:`, permissions);
    }
  }, [rolePermissions, user, module]);

  return {
    ...permissions,
    isLoading: !rolePermissions && !!user
  };
}