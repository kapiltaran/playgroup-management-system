import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Type definitions for role permissions
type Permission = {
  id: number;
  role: 'parent' | 'teacher' | 'officeadmin' | 'superadmin';
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
};

// Alias for consistent type referencing
type RolePermission = Permission;

// Format module name for display
const formatModule = (moduleName: string) => {
  return moduleName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function RoleManagement() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>('parent');
  
  // List of all available modules
  const modules = [
    'students',
    'classes',
    'fee_management',
    'fee_payments',
    'expenses',
    'inventory',
    'reports',
    'settings',
    'user_management',
    'role_management'
  ];

  // Query to get permissions for the selected role
  const { data: permissions, isLoading, isError } = useQuery<RolePermission[]>({
    queryKey: ['/api/role-permissions', selectedRole],
    queryFn: async ({ queryKey }) => {
      const [_, role] = queryKey;
      return apiRequest<RolePermission[]>("GET", `/api/role-permissions?role=${role}`);
    }
  });

  // Get module permissions from the API
  const { data: modulePermissions } = useQuery({
    queryKey: ['/api/module-permissions', selectedRole],
    queryFn: async ({ queryKey }) => {
      const [_, role] = queryKey;
      return apiRequest<Record<string, {canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean}>>("GET", `/api/module-permissions?role=${role}`);
    }
  });

  // Create permission mutation
  const createPermission = useMutation({
    mutationFn: (permissionData: {
      role: string;
      module: string;
      canView: boolean;
      canCreate: boolean;
      canEdit: boolean;
      canDelete: boolean;
      userRole: string;
    }) => apiRequest("POST", '/api/role-permissions', permissionData),
    onSuccess: () => {
      toast({
        title: 'Permission Created',
        description: 'The role permission has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/module-permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create permission',
        variant: 'destructive',
      });
    }
  });

  // Update permission mutation
  const updatePermission = useMutation({
    mutationFn: (data: {
      id: number;
      updates: {
        canView?: boolean;
        canCreate?: boolean;
        canEdit?: boolean; 
        canDelete?: boolean;
        userRole: string;
      }
    }) => apiRequest('PATCH', `/api/role-permissions/${data.id}`, data.updates),
    onSuccess: () => {
      toast({
        title: 'Permission Updated',
        description: 'The role permission has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/module-permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update permission',
        variant: 'destructive',
      });
    }
  });

  // Find permission for a specific module
  const findPermission = (moduleName: string) => {
    return permissions?.find(p => p.module === moduleName);
  };

  // Get permission state for a module (from API or fallback to permissions list)
  const getPermissionState = (moduleName: string, permType: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    // Use modulePermissions if available, otherwise fallback to permissions array
    if (modulePermissions && modulePermissions[moduleName]) {
      return modulePermissions[moduleName][permType];
    }

    const permission = findPermission(moduleName);
    return permission ? permission[permType] : false;
  };

  // Handle permission toggle change
  const handlePermissionChange = (moduleName: string, permType: 'canView' | 'canCreate' | 'canEdit' | 'canDelete', value: boolean) => {
    const permission = findPermission(moduleName);
    
    if (permission) {
      // Update existing permission
      updatePermission.mutate({
        id: permission.id,
        updates: {
          [permType]: value,
          userRole: 'superadmin' // Assuming the current user is a superadmin
        }
      });
    } else {
      // Create new permission with only the changed permission set to true
      const newPermission = {
        role: selectedRole,
        module: moduleName,
        canView: permType === 'canView' ? value : false,
        canCreate: permType === 'canCreate' ? value : false,
        canEdit: permType === 'canEdit' ? value : false,
        canDelete: permType === 'canDelete' ? value : false,
        userRole: 'superadmin' // Assuming the current user is a superadmin
      };
      
      createPermission.mutate(newPermission);
    }
  };

  // Handle role change
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load role permissions. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Role Permissions Management</CardTitle>
        <CardDescription>
          Configure access permissions for different user roles in the system
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="role-select">Select Role</Label>
          <Select 
            value={selectedRole} 
            onValueChange={handleRoleChange}
          >
            <SelectTrigger id="role-select" className="w-[200px]">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="officeadmin">Office Admin</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedRole === 'superadmin' ? (
          <Alert className="mb-6">
            <AlertTitle>Super Admin Role</AlertTitle>
            <AlertDescription>
              Super administrators have full access to all modules and features. These permissions cannot be modified.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="table">
            <TabsList className="mb-4">
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Module</th>
                      <th className="p-2 text-center">View</th>
                      <th className="p-2 text-center">Create</th>
                      <th className="p-2 text-center">Edit</th>
                      <th className="p-2 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => (
                      <tr key={module} className="border-b border-muted">
                        <td className="p-2 font-medium">{formatModule(module)}</td>
                        <td className="p-2 text-center">
                          <Switch
                            checked={getPermissionState(module, 'canView')}
                            onCheckedChange={(value) => 
                              handlePermissionChange(module, 'canView', value)
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Switch
                            checked={getPermissionState(module, 'canCreate')}
                            onCheckedChange={(value) => 
                              handlePermissionChange(module, 'canCreate', value)
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Switch
                            checked={getPermissionState(module, 'canEdit')}
                            onCheckedChange={(value) => 
                              handlePermissionChange(module, 'canEdit', value)
                            }
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Switch
                            checked={getPermissionState(module, 'canDelete')}
                            onCheckedChange={(value) => 
                              handlePermissionChange(module, 'canDelete', value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="space-y-6">
              {modules.map((module) => (
                <div key={module} className="mb-6">
                  <h3 className="text-lg font-medium mb-3">{formatModule(module)}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${module}-view`}
                        checked={getPermissionState(module, 'canView')}
                        onCheckedChange={(value) => 
                          handlePermissionChange(module, 'canView', value)
                        }
                      />
                      <Label htmlFor={`${module}-view`}>View</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${module}-create`}
                        checked={getPermissionState(module, 'canCreate')}
                        onCheckedChange={(value) => 
                          handlePermissionChange(module, 'canCreate', value)
                        }
                      />
                      <Label htmlFor={`${module}-create`}>Create</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${module}-edit`}
                        checked={getPermissionState(module, 'canEdit')}
                        onCheckedChange={(value) => 
                          handlePermissionChange(module, 'canEdit', value)
                        }
                      />
                      <Label htmlFor={`${module}-edit`}>Edit</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${module}-delete`}
                        checked={getPermissionState(module, 'canDelete')}
                        onCheckedChange={(value) => 
                          handlePermissionChange(module, 'canDelete', value)
                        }
                      />
                      <Label htmlFor={`${module}-delete`}>Delete</Label>
                    </div>
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {updatePermission.isPending || createPermission.isPending ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving changes...
            </span>
          ) : (
            <span>Last updated: {new Date().toLocaleString()}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}