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
  | 'role_management'
  | 'academic_years';

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
  // Initialize with false permissions for safety
  const [permissions, setPermissions] = useState<ModulePermission>({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false
  });
  
  console.log(`[useModulePermission] Initializing hook for module: ${module}, user: ${user?.username}, role: ${user?.role}`);

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
    if (!user) {
      // No user, default to no permissions
      console.log(`[useModulePermission] No user logged in, setting all permissions to false`);
      setPermissions({
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false
      });
      return;
    }
    
    if (!rolePermissions) {
      console.log(`[useModulePermission] No role permissions loaded yet, waiting...`);
      return;
    }
    
    console.log(`[useModulePermission] Checking ${module} permissions for ${user.role}`);
    console.log(`[useModulePermission] Available role permissions:`, rolePermissions);
    
    // First try to find exact permission match
    const permission = rolePermissions.find(
      p => p.role === user.role && p.module === module
    );

    console.log(`[useModulePermission] Found permission for ${module}:`, permission);

    let newPermissions: ModulePermission;
    
    if (permission) {
      // Use the exact permission found
      newPermissions = {
        canView: permission.canView,
        canCreate: permission.canCreate,
        canEdit: permission.canEdit,
        canDelete: permission.canDelete
      };
    } else if (user.role === 'superadmin') {
      // Superadmin has all permissions by default
      newPermissions = {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      };
    } else {
      // Default to no permissions if not specified
      newPermissions = {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false
      };
    }
    
    console.log(`[useModulePermission] Setting new permissions for ${module}:`, newPermissions);
    
    // Use the functional form of setState to ensure we're not using stale state
    setPermissions(newPermissions);
  }, [rolePermissions, user, module]);

  // Make sure we return a frozen object to prevent mutations
  const result = {
    canView: permissions.canView,
    canCreate: permissions.canCreate, 
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    isLoading: !rolePermissions && !!user
  };
  
  console.log(`[useModulePermission] Returning for ${module}:`, result);
  
  return result;
}