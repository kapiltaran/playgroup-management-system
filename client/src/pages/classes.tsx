import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PencilIcon, TrashIcon, PlusCircleIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Extended Class type with additional UI fields
interface Class {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date | null;
  // Fields from schema
  ageGroup?: string;
  startTime?: string | null;
  endTime?: string | null;
  days?: string[] | null;
}

export default function Classes() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ageGroup: "",
    description: "",
    startTime: "",
    endTime: "",
    days: [] as string[]
  });

  // No need for academic year queries as they have been removed

  // Fetch classes
  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
    queryFn: async () => {
      // Force an authenticated request to the server
      const response = await fetch('/api/classes', {
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

  // Add class mutation
  const addClassMutation = useMutation({
    mutationFn: (classData: any) => 
      apiRequest("POST", "/api/classes", classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class added successfully",
      });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add class",
        variant: "destructive",
      });
    },
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update class",
        variant: "destructive",
      });
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/classes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class. It may be in use by students or fee structures.",
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      ageGroup: "",
      description: "",
      startTime: "",
      endTime: "",
      days: []
    });
    setCurrentClass(null);
  };

  // Handle edit class
  const handleEditClass = (classItem: Class) => {
    setFormMode("edit");
    setCurrentClass(classItem);
    setFormData({
      name: classItem.name,
      ageGroup: classItem.ageGroup || "",
      description: classItem.description || "",
      startTime: classItem.startTime || "",
      endTime: classItem.endTime || "",
      days: classItem.days || []
    });
    setIsFormOpen(true);
  };

  // Handle delete class
  const handleDeleteClass = (id: number) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      deleteClassMutation.mutate(id);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formMode === "add") {
      addClassMutation.mutate(formData);
    } else {
      if (currentClass) {
        updateClassMutation.mutate({ id: currentClass.id, data: formData });
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle day selection change
  const handleDaysChange = (selectedDays: string[]) => {
    setFormData(prev => ({
      ...prev,
      days: selectedDays
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <Button onClick={() => {
          setFormMode("add");
          resetForm();
          setIsFormOpen(true);
        }}>
          <PlusCircleIcon className="mr-2 h-4 w-4" /> Add New Class
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={classes || []}
          isLoading={isLoading}
          searchKey="name"
          columns={[
            {
              accessorKey: "name",
              header: "Class Name",
              cell: (item) => (
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
              )
            },
            {
              accessorKey: "ageGroup",
              header: "Age Group",
              cell: (item) => (
                <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                  {item.ageGroup}
                </Badge>
              )
            },
            {
              accessorKey: "startTime",
              header: "Schedule",
              cell: (item) => (
                <div className="text-sm text-gray-900">
                  {item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : "Not scheduled"}
                </div>
              )
            },
            {
              accessorKey: "description",
              header: "Description",
              cell: (item) => (
                <div className="text-sm text-gray-500 max-w-xs truncate">
                  {item.description || "No description"}
                </div>
              )
            },
            {
              accessorKey: "id",
              header: "Actions",
              cell: (item) => (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClass(item)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteClass(item.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Class Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === "add" ? "Add New Class" : "Edit Class"}</DialogTitle>
            <DialogDescription>
              {formMode === "add" 
                ? "Create a new class for your playgroup." 
                : "Update the details of this class."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Toddler Group"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageGroup">Age Group</Label>
                <Input
                  id="ageGroup"
                  name="ageGroup"
                  value={formData.ageGroup}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-3 years"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Days of the Week</Label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.days.includes(day) ? "default" : "outline"}
                      onClick={() => {
                        const updatedDays = formData.days.includes(day)
                          ? formData.days.filter(d => d !== day)
                          : [...formData.days, day];
                        handleDaysChange(updatedDays);
                      }}
                      className="px-3 py-1"
                    >
                      {day.substring(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add a description of the class..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addClassMutation.isPending || updateClassMutation.isPending}
              >
                {formMode === "add" ? "Add Class" : "Update Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}