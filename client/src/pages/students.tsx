import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { StudentForm } from "@/components/students/student-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useModulePermission } from "@/hooks/use-module-permission";
import PermissionGate from "@/components/permission-gate";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import type { Student } from "@shared/schema";

export default function Students() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const isParent = user?.role === 'parent';
  const { canCreate: canCreateStudent, canEdit: canEditStudent, canDelete: canDeleteStudent } = useModulePermission('students');

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: async () => {
      // Force an authenticated request to the server
      const response = await fetch('/api/students', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    }
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (newStudent: any) => {
      console.log("🔴 API request to create student:", newStudent);
      
      // Save the createAccount flag before removing it from payload
      const shouldCreateAccount = newStudent.createAccount;
      
      // Remove createAccount as it's not part of the student schema
      const studentData = { ...newStudent };
      delete studentData.createAccount;
      
      console.log("🔴 Student data being sent to API:", studentData);
      console.log("🔴 Should create parent account:", shouldCreateAccount);
      
      const response = await apiRequest("POST", "/api/students", studentData);
      console.log("🔴 API response from creating student:", response);
      
      // If parent account should be created, make the API call
      if (shouldCreateAccount && response && response.id) {
        console.log("🔴 Attempting to create parent account for student ID:", response.id);
        try {
          // Direct API call to create parent account
          const accountResponse = await fetch(`/api/students/${response.id}/create-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          
          console.log("🔴 Parent account creation status:", accountResponse.status);
          
          const responseText = await accountResponse.text();
          console.log("🔴 Raw API response:", responseText);
          
          let accountData;
          try {
            // Try to parse the response as JSON
            accountData = JSON.parse(responseText);
          } catch (jsonError) {
            console.error("🔴 Failed to parse JSON response:", jsonError);
            // If JSON parsing fails, use the raw text as our data
            accountData = { message: responseText };
          }
          
          if (accountResponse.ok) {
            console.log("🔴 Parent account created successfully:", accountData);
            // Invalidate users query to refresh listings
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            toast({
              title: "Parent Account Created",
              description: `Account created for ${studentData.guardianName} with email ${studentData.email}`,
            });
          } else {
            console.error("🔴 Error creating parent account:", accountData);
            toast({
              title: "Parent Account Creation Failed",
              description: `Could not create account: ${accountData.message || accountData.error || responseText}`,
              variant: "destructive"
            });
          }
        } catch (accountError) {
          console.error("🔴 Exception creating parent account:", accountError);
          toast({
            title: "Error",
            description: `Network error creating parent account: ${accountError}`,
            variant: "destructive"
          });
        }
      }
      
      return response; // Make sure we return the response
    },
    onSuccess: (data) => {
      console.log("addStudentMutation onSuccess data:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsStudentFormOpen(false);
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    },
    onError: (error) => {
      console.error("addStudentMutation onError:", error);
      toast({
        title: "Error",
        description: `Failed to add student: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsStudentFormOpen(false);
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update student: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsStudentFormOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitStudent = async (data: any): Promise<any> => {
    try {
      console.log("handleSubmitStudent called with data:", data);
      let result;
      
      if (selectedStudent?.id) {
        console.log("Updating existing student:", selectedStudent.id);
        result = await updateStudentMutation.mutateAsync({ id: selectedStudent.id, data });
        console.log("Update student mutation result:", result);
      } else {
        console.log("Creating new student");
        // We need the created student with its ID for account creation
        result = await addStudentMutation.mutateAsync(data);
        console.log("Add student mutation result:", result);
      }
      
      return result;
    } catch (error) {
      console.error("Error in handleSubmitStudent:", error);
      throw error;
    }
  };

  const renderStudentInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const renderStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    } else if (status === "on_leave") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          On Leave
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Inactive
        </Badge>
      );
    }
  };

  console.log('[Students Page] Rendering with canCreateStudent:', canCreateStudent);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        {canCreateStudent ? (
          <Button onClick={() => {
            setSelectedStudent(null);
            setIsStudentFormOpen(true);
          }}>
            <UsersIcon className="mr-2 h-4 w-4" /> Add New Student
          </Button>
        ) : null}
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={students || []}
          isLoading={isLoadingStudents}
          searchKey="fullName"
          columns={[
            {
              accessorKey: "fullName",
              header: "Name",
              cell: (student: any) => (
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 bg-gray-200 text-gray-500">
                    <AvatarFallback>
                      {renderStudentInitials(student.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                    <div className="text-sm text-gray-500">ID: ST-{student.id.toString().padStart(3, '0')}</div>
                  </div>
                </div>
              )
            },
            {
              accessorKey: "age",
              header: "Age",
              cell: (student: any) => (
                <div className="text-sm text-gray-900">{student.age} years</div>
              )
            },
            {
              accessorKey: "guardianName",
              header: "Guardian",
              cell: (student: any) => (
                <>
                  <div className="text-sm text-gray-900">{student.guardianName}</div>
                  <div className="text-sm text-gray-500">{student.phone}</div>
                </>
              )
            },
            {
              accessorKey: "status",
              header: "Status",
              cell: (student: any) => renderStatusBadge(student.status)
            },
            ...(isParent ? [] : [
              {
                accessorKey: "id",
                header: "Actions",
                cell: (student: any) => (
                  <div className="flex space-x-2">
                    {canEditStudent && (
                      <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteStudent && (
                      <Button variant="outline" size="sm" onClick={() => handleDeleteStudent(student)}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}
                    <PermissionGate moduleName="user_management" permission="create">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                        try {
                          console.log("[CLIENT] Creating parent account for student:", student.id);
                          toast({
                            title: "Info",
                            description: `Attempting to create account for ${student.guardianName}...`,
                          });
                          
                          const response = await fetch(`/api/students/${student.id}/create-account`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include'
                          });
                          
                          console.log("[CLIENT] API response status:", response.status);
                          
                          // Get the response text first so we don't lose it if JSON parsing fails
                          const responseText = await response.text();
                          console.log("[CLIENT] Raw API response:", responseText);
                          
                          let data;
                          try {
                            // Try to parse the response as JSON
                            data = JSON.parse(responseText);
                          } catch (jsonError) {
                            console.error("[CLIENT] Failed to parse JSON response:", jsonError);
                            // If JSON parsing fails, use the raw text as our data
                            data = { message: responseText };
                          }
                          
                          if (response.ok) {
                            toast({
                              title: "Success",
                              description: `Parent account created for ${student.guardianName} with email ${student.email}`,
                            });
                            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
                            console.log("[CLIENT] Parent account created:", data);
                          } else {
                            toast({
                              title: "Error",
                              description: `Failed to create parent account: ${data.message || data.error || responseText}`,
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          console.error("[CLIENT] Fatal error in create account:", error);
                          toast({
                            title: "Error",
                            description: `Network error: ${error}`,
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Create Account
                    </Button>
                    </PermissionGate>
                  </div>
                )
              }
            ])
          ]}
        />
      </div>

      {/* Student Form */}
      <StudentForm
        isOpen={isStudentFormOpen}
        onClose={() => setIsStudentFormOpen(false)}
        onSubmit={handleSubmitStudent}
        defaultValues={selectedStudent ? {
          ...selectedStudent,
          gender: selectedStudent.gender as "male" | "female" | "other",
          status: selectedStudent.status as "active" | "inactive" | "on_leave",
          city: selectedStudent.city || undefined,
          postalCode: selectedStudent.postalCode || undefined,
          state: selectedStudent.state || undefined,
          country: selectedStudent.country || undefined,
          address: selectedStudent.address || undefined,
          notes: selectedStudent.notes || undefined
        } : undefined}
        isSubmitting={addStudentMutation.isPending || updateStudentMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student &quot;{selectedStudent?.fullName}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedStudent && deleteStudentMutation.mutate(selectedStudent.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
