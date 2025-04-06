import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusIcon, AlertCircle, Trash2, Edit, CalendarIcon } from "lucide-react";
import PermissionGate from "@/components/permission-gate";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types for academic years
interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

// Form validation schema
const academicYearSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }).refine(date => date !== undefined, {
    message: "End date is required",
  }),
  isCurrent: z.boolean().default(false)
}).refine(data => {
  return data.endDate > data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

type FormValues = z.infer<typeof academicYearSchema>;

export default function AcademicYears() {
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch academic years
  const { data: academicYears = [], isLoading, isError } = useQuery<AcademicYear[]>({
    queryKey: ['/api/academic-years'],
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: '',
      isCurrent: false
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      return apiRequest('POST', '/api/academic-years', {
        ...values,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        endDate: format(values.endDate, 'yyyy-MM-dd')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setOpenDialog(false);
      form.reset();
      toast({
        title: "Academic Year created",
        description: "The academic year has been successfully created."
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (values: FormValues & { id: number }) => {
      return apiRequest('PATCH', `/api/academic-years/${values.id}`, {
        name: values.name,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        endDate: format(values.endDate, 'yyyy-MM-dd'),
        isCurrent: values.isCurrent
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setOpenDialog(false);
      form.reset();
      setSelectedYear(null);
      toast({
        title: "Academic Year updated",
        description: "The academic year has been successfully updated."
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/academic-years/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setOpenDeleteDialog(false);
      setDeleteId(null);
      toast({
        title: "Academic Year deleted",
        description: "The academic year has been successfully deleted."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete academic year. It may be in use by classes or fee structures.",
        variant: "destructive"
      });
    }
  });

  // Submit handler
  const onSubmit = (values: FormValues) => {
    if (selectedYear) {
      updateMutation.mutate({ ...values, id: selectedYear.id });
    } else {
      createMutation.mutate(values);
    }
  };

  // Handle edit
  const handleEdit = (year: AcademicYear) => {
    setSelectedYear(year);
    form.reset({
      name: year.name,
      startDate: new Date(year.startDate),
      endDate: new Date(year.endDate),
      isCurrent: year.isCurrent
    });
    setOpenDialog(true);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  // Handle delete confirmation
  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Academic Years</h1>
        <PermissionGate moduleName="academic_years" permission="canCreate">
          <Button onClick={() => {
            setSelectedYear(null);
            form.reset({
              name: '',
              isCurrent: false
            });
            setOpenDialog(true);
          }}>
            <PlusIcon className="mr-2 h-4 w-4" /> Add Academic Year
          </Button>
        </PermissionGate>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading academic years. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Academic Years List</CardTitle>
          <CardDescription>
            Manage academic years for your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : academicYears.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No academic years found. Click "Add Academic Year" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {academicYears.map(year => (
                    <TableRow key={year.id}>
                      <TableCell className="font-medium">{year.name}</TableCell>
                      <TableCell>{format(new Date(year.startDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{format(new Date(year.endDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        {year.isCurrent ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                            Current
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <PermissionGate moduleName="academic_years" permission="canUpdate">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(year)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate moduleName="academic_years" permission="canDelete">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(year.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
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

      {/* Form Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedYear ? "Edit Academic Year" : "Add New Academic Year"}
            </DialogTitle>
            <DialogDescription>
              {selectedYear 
                ? "Update the details of the academic year" 
                : "Create a new academic year for your institution"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., 2024-2025" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a name for the academic year
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              // Force close the popover when a date is selected
                              document.body.click();
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              // Force close the popover when a date is selected
                              document.body.click();
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isCurrent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 border rounded-md">
                    <div className="space-y-0.5">
                      <FormLabel>Current Academic Year</FormLabel>
                      <FormDescription>
                        Set as the current active academic year
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {selectedYear ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this academic year? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}