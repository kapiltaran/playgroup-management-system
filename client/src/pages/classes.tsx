import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
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
import type { Class } from "@shared/schema";

export default function Classes() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ageGroup: "",
    capacity: 0,
    description: ""
  });

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
      capacity: 0,
      description: ""
    });
    setCurrentClass(null);
  };

  // Handle edit class
  const handleEditClass = (classItem: Class) => {
    setFormMode("edit");
    setCurrentClass(classItem);
    setFormData({
      name: classItem.name,
      ageGroup: classItem.ageGroup,
      capacity: classItem.capacity,
      description: classItem.description || ""
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
      [name]: name === "capacity" ? parseInt(value) || 0 : value
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
              accessorKey: "capacity",
              header: "Capacity",
              cell: (item) => (
                <div className="text-sm text-gray-900">{item.capacity} students</div>
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

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min={1}
                  required
                />
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