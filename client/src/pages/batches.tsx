import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Edit, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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

// Define batch type
interface Batch {
  id: number;
  name: string;
  academicYearId: number;
  classId: number;
  capacity: number;
  createdAt?: Date;
  updatedAt?: Date;
  
  // UI-specific fields (not in database schema)
  academicYearName?: string;
  className?: string;
}

// Define class type
interface Class {
  id: number;
  name: string;
  academicYearId: number;
  description: string | null;
}

// Define academic year type
interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

// Batch form schema
const batchFormSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  classId: z.string().min(1, "Class is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

export default function Batches() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filteredClassId, setFilteredClassId] = useState<number | null>(null);
  const [filteredAcademicYearId, setFilteredAcademicYearId] = useState<number | null>(null);

  // Form setup
  const form = useForm<z.infer<typeof batchFormSchema>>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      academicYearId: "",
      classId: "",
      capacity: 20,
    },
  });

  // Fetch batches data
  const { data: batches, isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
  });

  // Fetch classes data
  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch academic years data
  const { data: academicYears, isLoading: isLoadingAcademicYears } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });

  // Get current academic year
  const { data: currentAcademicYear } = useQuery<AcademicYear>({
    queryKey: ["/api/academic-years/current"],
  });
  
  // Select first class by default if available
  useEffect(() => {
    if (classes && classes.length > 0 && filteredAcademicYearId && !filteredClassId) {
      // Filter classes by selected academic year
      const academicYearClasses = classes.filter(c => c.academicYearId === filteredAcademicYearId);
      if (academicYearClasses.length > 0) {
        setFilteredClassId(academicYearClasses[0].id);
      }
    }
  }, [classes, filteredAcademicYearId, filteredClassId]);

  // Set up mutations
  const createBatchMutation = useMutation({
    mutationFn: (data: z.infer<typeof batchFormSchema>) => {
      return apiRequest("POST", "/api/batches", {
        name: data.name,
        academicYearId: parseInt(data.academicYearId),
        classId: parseInt(data.classId),
        capacity: data.capacity,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create batch: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: (data: { id: number; batch: any }) => {
      return apiRequest("PATCH", `/api/batches/${data.id}`, data.batch);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Batch updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update batch: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest("DELETE", `/api/batches/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete batch: " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof batchFormSchema>) => {
    if (formMode === "add") {
      createBatchMutation.mutate(data);
    } else if (formMode === "edit" && currentBatch) {
      updateBatchMutation.mutate({
        id: currentBatch.id,
        batch: {
          name: data.name,
          academicYearId: parseInt(data.academicYearId),
          classId: parseInt(data.classId),
          capacity: data.capacity,
        },
      });
    }
  };

  // Handle edit button click
  const handleEdit = (batch: Batch) => {
    setCurrentBatch(batch);
    setFormMode("edit");
    form.reset({
      name: batch.name,
      academicYearId: batch.academicYearId.toString(),
      classId: batch.classId.toString(),
      capacity: batch.capacity,
    });
    setIsFormOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteId !== null) {
      deleteBatchMutation.mutate(deleteId);
    }
  };

  // Set default academic year when available
  useEffect(() => {
    if (currentAcademicYear && !filteredAcademicYearId) {
      setFilteredAcademicYearId(currentAcademicYear.id);
      
      if (form.getValues().academicYearId === "") {
        form.setValue("academicYearId", currentAcademicYear.id.toString());
      }
    }
  }, [currentAcademicYear, form]);

  // Handle add batch button click with current filter values
  const handleAddBatch = () => {
    setFormMode("add");
    setCurrentBatch(null);
    
    form.reset({
      name: "",
      academicYearId: filteredAcademicYearId ? filteredAcademicYearId.toString() : "",
      classId: filteredClassId ? filteredClassId.toString() : "",
      capacity: 20,
    });
    
    setIsFormOpen(true);
  };

  // Filter classes by selected academic year
  const filteredClasses = classes
    ? classes.filter(
        (c) => !filteredAcademicYearId || c.academicYearId === filteredAcademicYearId
      )
    : [];

  // Filter batches by selected filters
  const filteredBatches = batches
    ? batches
        .filter((batch) => {
          // Apply academic year filter if selected
          if (filteredAcademicYearId && batch.academicYearId !== filteredAcademicYearId) {
            return false;
          }
          // Apply class filter if selected
          if (filteredClassId && batch.classId !== filteredClassId) {
            return false;
          }
          return true;
        })
        .map((batch) => {
          // Add academic year name and class name to batch objects
          const academicYear = academicYears?.find((ay) => ay.id === batch.academicYearId);
          const classObj = classes?.find((c) => c.id === batch.classId);
          return {
            ...batch,
            academicYearName: academicYear?.name || "Unknown",
            className: classObj?.name || "Unknown",
          };
        })
    : [];

  // Check if loading any data
  const isLoading = isLoadingBatches || isLoadingClasses || isLoadingAcademicYears;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Batch Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Academic Year and Class</CardTitle>
          <CardDescription>Select an academic year and class to manage batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academicYearFilter">Academic Year</Label>
                <Select
                  value={filteredAcademicYearId?.toString() || ""}
                  onValueChange={(value) => {
                    setFilteredAcademicYearId(parseInt(value));
                    setFilteredClassId(null); // Reset class filter when academic year changes
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
              <div>
                <Label htmlFor="classFilter">Class</Label>
                <Select
                  value={filteredClassId?.toString() || ""}
                  onValueChange={(value) => setFilteredClassId(parseInt(value))}
                  disabled={filteredClasses.length === 0}
                >
                  <SelectTrigger id="classFilter">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id.toString()}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredAcademicYearId && filteredClassId && (
              <div className="flex justify-end mt-4">
                <Button onClick={handleAddBatch}>
                  Add New Batch
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
          <CardDescription>
            Manage student batches for different classes and academic years
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No batches found. Click "Add New Batch" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{batch.academicYearName}</TableCell>
                      <TableCell>{batch.className}</TableCell>
                      <TableCell>{batch.capacity}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(batch)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={deleteId === batch.id} onOpenChange={(open) => {
                            if (!open) setDeleteId(null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDelete(batch.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the batch "{batch.name}". Students
                                  assigned to this batch will need to be reassigned.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={confirmDelete}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formMode === "add" ? "Add New Batch" : "Edit Batch"}</DialogTitle>
            <DialogDescription>
              {formMode === "add"
                ? "Create a new batch for students"
                : "Update batch information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter batch name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={formMode === "add" && filteredAcademicYearId !== null}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears?.map((year) => (
                          <SelectItem key={year.id} value={year.id.toString()}>
                            {year.name} {year.isCurrent && "(Current)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formMode === "add" && filteredAcademicYearId && (
                      <FormDescription>
                        Using academic year selected in filter
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => {
                  // Get academic year ID for filtering classes
                  const selectedAcademicYearId = form.getValues().academicYearId
                    ? parseInt(form.getValues().academicYearId)
                    : null;
                  
                  // Filter classes by selected academic year
                  const availableClasses = classes
                    ? classes.filter(
                        (c) => !selectedAcademicYearId || c.academicYearId === selectedAcademicYearId
                      )
                    : [];

                  return (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={(availableClasses.length === 0) || (formMode === "add" && filteredClassId !== null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableClasses.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No classes for selected academic year
                            </SelectItem>
                          ) : (
                            availableClasses.map((classItem) => (
                              <SelectItem key={classItem.id} value={classItem.id.toString()}>
                                {classItem.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {formMode === "add" && filteredClassId && (
                        <FormDescription>
                          Using class selected in filter
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Enter batch capacity"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of students in this batch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={createBatchMutation.isPending || updateBatchMutation.isPending}
                >
                  {createBatchMutation.isPending || updateBatchMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {formMode === "add" ? "Creating..." : "Updating..."}
                    </>
                  ) : (
                    <>{formMode === "add" ? "Create Batch" : "Update Batch"}</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Label component
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </label>
  );
}
