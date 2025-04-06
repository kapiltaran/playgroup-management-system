import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { X, Search, UserPlus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Type definitions
type AcademicYear = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type Class = {
  id: number;
  name: string;
  academicYearId: number;
  description: string | null;
};

type Batch = {
  id: number;
  name: string;
  academicYearId: number;
  classId: number;
  capacity: number;
};

type Student = {
  id: number;
  fullName: string;
  enrollmentDate: string;
  batchId: number | null;
  gender: string;
  dateOfBirth: string;
  address: string | null;
  contactNumber: string | null;
  emergencyContact: string | null;
  medicalInformation: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  photoUrl: string | null;
};

// Add Student assignment schema
const addStudentsSchema = z.object({
  studentIds: z.array(z.number()).min(1, "Please select at least one student"),
});

// Component for linking students to classes
export default function LinkClasses() {
  // State for selectors and dialogs
  const [filteredAcademicYearId, setFilteredAcademicYearId] = useState<number | null>(null);
  const [filteredClassId, setFilteredClassId] = useState<number | null>(null);
  const [filteredBatchId, setFilteredBatchId] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form for adding students
  const form = useForm<z.infer<typeof addStudentsSchema>>({
    resolver: zodResolver(addStudentsSchema),
    defaultValues: {
      studentIds: [],
    },
  });

  // Query academic years
  const { data: academicYears, isLoading: isLoadingAcademicYears } = useQuery({
    queryKey: ["/api/academic-years"],
    select: (data) => data as AcademicYear[],
  });

  // Query current academic year
  const { data: currentAcademicYear } = useQuery({
    queryKey: ["/api/academic-years/current"],
    select: (data) => data as AcademicYear,
  });

  // Query all classes - show all classes regardless of academic year
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ["/api/classes"],
    select: (data) => data as Class[],
  });

  // Query batches based on class filter
  const { data: batches, isLoading: isLoadingBatches } = useQuery({
    queryKey: ["/api/batches"],
    select: (data) => {
      const allBatches = data as Batch[];
      let filtered = allBatches;
      
      if (filteredAcademicYearId) {
        filtered = filtered.filter(b => b.academicYearId === filteredAcademicYearId);
      }
      
      if (filteredClassId) {
        filtered = filtered.filter(b => b.classId === filteredClassId);
      }
      
      return filtered;
    },
  });

  // Query all students
  const { data: allStudents, isLoading: isLoadingAllStudents } = useQuery({
    queryKey: ["/api/students"],
    select: (data) => data as Student[],
  });

  // Query students by batch
  const { data: batchStudents, isLoading: isLoadingBatchStudents } = useQuery({
    queryKey: ["/api/students/batch", filteredBatchId],
    queryFn: () => filteredBatchId ? apiRequest("GET", `/api/students/batch/${filteredBatchId}`) : [],
    select: (data) => data as Student[],
    enabled: !!filteredBatchId,
  });

  // Query student-batch assignment API
  const assignStudentsMutation = useMutation({
    mutationFn: (studentIds: number[]) => {
      return apiRequest("POST", `/api/students/batch/${filteredBatchId}`, { studentIds });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Students assigned to batch successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students/batch", filteredBatchId] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsAddDialogOpen(false);
      setSelectedStudents([]);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign students: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Mutation to remove student from batch
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: number) => {
      return apiRequest("DELETE", `/api/students/batch/${filteredBatchId}/${studentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student removed from batch successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students/batch", filteredBatchId] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setStudentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove student: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Set default academic year to current year when available
  useEffect(() => {
    if (currentAcademicYear && !filteredAcademicYearId) {
      setFilteredAcademicYearId(currentAcademicYear.id);
    }
  }, [currentAcademicYear]);

  // Set default class when academic year is selected and classes are loaded
  useEffect(() => {
    if (filteredAcademicYearId && classes?.length) {
      // If no class is selected, set the first available class
      if (!filteredClassId && classes.length > 0) {
        setFilteredClassId(classes[0].id);
      }
    }
  }, [filteredAcademicYearId, classes, filteredClassId]);

  // Set default batch when class is selected and batches are loaded
  useEffect(() => {
    if (filteredClassId && batches?.length) {
      // Find batches for the selected class
      const filteredBatches = batches.filter(b => b.classId === filteredClassId);
      if (filteredBatches.length > 0) {
        // If current batch is no longer valid for the selected class, or no batch is selected
        const isCurrentBatchValid = filteredBatches.some(b => b.id === filteredBatchId);
        if (!isCurrentBatchValid || !filteredBatchId) {
          setFilteredBatchId(filteredBatches[0].id);
        }
      }
    }
  }, [filteredClassId, batches, filteredBatchId]);

  // Handle form submission for adding students
  const onSubmit = (data: z.infer<typeof addStudentsSchema>) => {
    if (filteredBatchId) {
      assignStudentsMutation.mutate(data.studentIds);
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
      form.setValue("studentIds", form.getValues().studentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
      form.setValue("studentIds", [...form.getValues().studentIds, studentId]);
    }
  };

  // Filter students that are not already in the batch
  const getAvailableStudents = () => {
    if (!allStudents || !batchStudents) return [];
    
    // Get all student IDs that are already in the batch
    const batchStudentIds = batchStudents.map(student => student.id);
    
    // Filter out students that are already in the batch and match search term
    return allStudents.filter(student => 
      !batchStudentIds.includes(student.id) && 
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Check if loading
  const isLoading = isLoadingAcademicYears || 
                    isLoadingClasses || 
                    isLoadingBatches || 
                    isLoadingAllStudents || 
                    (!!filteredBatchId && isLoadingBatchStudents);

  // Reset form when add dialog closes
  const handleAddDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedStudents([]);
      form.reset();
      setSearchTerm("");
    }
    setIsAddDialogOpen(open);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Link Students to Classes</h1>
      </div>

      {/* Selection Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Academic Year, Class and Batch</CardTitle>
          <CardDescription>
            Select a combination to view or manage student assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Academic Year Selector */}
              <div>
                <Label htmlFor="academicYearFilter">Academic Year</Label>
                <Select
                  value={filteredAcademicYearId?.toString() || ""}
                  onValueChange={(value) => {
                    setFilteredAcademicYearId(parseInt(value));
                    setFilteredClassId(null);
                    setFilteredBatchId(null);
                  }}
                >
                  <SelectTrigger id="academicYearFilter">
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears?.map((year) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name} {year.isCurrent && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Selector */}
              <div>
                <Label htmlFor="classFilter">Class</Label>
                <Select
                  value={filteredClassId?.toString() || ""}
                  onValueChange={(value) => {
                    setFilteredClassId(parseInt(value));
                    setFilteredBatchId(null);
                  }}
                  disabled={!filteredAcademicYearId || !classes?.length}
                >
                  <SelectTrigger id="classFilter">
                    <SelectValue placeholder={classes?.length === 0 ? "No classes available" : "Select Class"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No classes available
                      </SelectItem>
                    ) : (
                      classes?.map((classObj) => (
                        <SelectItem key={classObj.id} value={classObj.id.toString()}>
                          {classObj.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Selector */}
              <div>
                <Label htmlFor="batchFilter">Batch</Label>
                <Select
                  value={filteredBatchId?.toString() || ""}
                  onValueChange={(value) => {
                    setFilteredBatchId(parseInt(value));
                  }}
                  disabled={!filteredClassId || !batches?.length}
                >
                  <SelectTrigger id="batchFilter">
                    <SelectValue placeholder={!batches || batches.length === 0 ? "No batches available" : "Select Batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!batches || batches.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No batches for selected class
                      </SelectItem>
                    ) : (
                      batches
                        .filter(batch => batch.classId === filteredClassId)
                        .map((batch) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            {batch.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Assignment Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>
              Manage students assigned to the selected batch
            </CardDescription>
          </div>
          
          {filteredBatchId && (
            <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Students
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Students to Batch</DialogTitle>
                  <DialogDescription>
                    Search and select students to add to this batch
                  </DialogDescription>
                </DialogHeader>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students by name..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-2">
                        {selectedStudents.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium mb-1">Selected Students:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedStudents.map(id => {
                                const student = allStudents?.find(s => s.id === id);
                                return student ? (
                                  <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                    {student.fullName}
                                    <X 
                                      className="h-3 w-3 cursor-pointer" 
                                      onClick={() => toggleStudentSelection(id)}
                                    />
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="studentIds"
                      render={() => (
                        <FormItem>
                          <ScrollArea className="h-[300px] border rounded-md p-2">
                            {getAvailableStudents().length === 0 ? (
                              <p className="text-center py-4 text-muted-foreground">
                                {searchTerm ? "No students found matching your search" : "No students available to add"}
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {getAvailableStudents().map((student) => (
                                  <div
                                    key={student.id}
                                    className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                                  >
                                    <Checkbox
                                      id={`student-${student.id}`}
                                      checked={selectedStudents.includes(student.id)}
                                      onCheckedChange={() => toggleStudentSelection(student.id)}
                                    />
                                    <label
                                      htmlFor={`student-${student.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                    >
                                      {student.fullName}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={selectedStudents.length === 0 || assignStudentsMutation.isPending}
                      >
                        {assignStudentsMutation.isPending ? "Adding..." : "Add Selected Students"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !filteredBatchId ? (
            <div className="text-center py-6 text-gray-500">
              Please select an Academic Year, Class and Batch to view students
            </div>
          ) : !batchStudents || batchStudents.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No students assigned to this batch. Click "Add Students" to add students.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Guardian Name</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{student.guardianName || "N/A"}</TableCell>
                      <TableCell>{student.contactNumber || student.guardianPhone || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog open={studentToDelete === student.id} onOpenChange={(open) => {
                          if (!open) setStudentToDelete(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive"
                              onClick={() => setStudentToDelete(student.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove student from batch?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {student.fullName} from this batch.
                                The student record will remain in the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => student.id && removeStudentMutation.mutate(student.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}