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
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: (newStudent: any) => 
      apiRequest("POST", "/api/students", newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsStudentFormOpen(false);
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    },
    onError: (error) => {
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
      } else {
        console.log("Creating new student");
        result = await addStudentMutation.mutateAsync(data);
      }
      
      console.log("Mutation result:", result);
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <Button onClick={() => {
          setSelectedStudent(null);
          setIsStudentFormOpen(true);
        }}>
          <UsersIcon className="mr-2 h-4 w-4" /> Add New Student
        </Button>
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
              cell: (student) => (
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
              cell: (student) => (
                <div className="text-sm text-gray-900">{student.age} years</div>
              )
            },
            {
              accessorKey: "guardianName",
              header: "Guardian",
              cell: (student) => (
                <>
                  <div className="text-sm text-gray-900">{student.guardianName}</div>
                  <div className="text-sm text-gray-500">{student.phone}</div>
                </>
              )
            },
            {
              accessorKey: "status",
              header: "Status",
              cell: (student) => renderStatusBadge(student.status)
            },
            {
              accessorKey: "id",
              header: "Actions",
              cell: (student) => (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditStudent(student)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteStudent(student)}>
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Student Form */}
      <StudentForm
        isOpen={isStudentFormOpen}
        onClose={() => setIsStudentFormOpen(false)}
        onSubmit={handleSubmitStudent}
        defaultValues={selectedStudent || undefined}
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
