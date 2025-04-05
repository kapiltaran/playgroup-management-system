import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, PlusCircleIcon, LayersIcon, CopyIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import type { FeeStructure, Class, AcademicYear } from "@shared/schema";

export default function FeeManagement() {
  const { toast } = useToast();
  const { currencySymbol, formatCurrency } = useCurrency();
  
  // Fee Structure state
  const [isStructureFormOpen, setIsStructureFormOpen] = useState(false);
  const [structureFormMode, setStructureFormMode] = useState<"add" | "edit" | "clone">("add");
  const [currentStructure, setCurrentStructure] = useState<FeeStructure | null>(null);
  
  // Format today's date as YYYY-MM-DD for the date input
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  
  // Define the type for fee structure form data
  interface FeeStructureFormData {
    name: string;
    classId: number;
    academicYearId: number;
    totalAmount: string | number; // Allow both string and number for flexibility
    description: string;
    dueDate: string;
  }
  
  const [structureFormData, setStructureFormData] = useState<FeeStructureFormData>({
    name: "",
    classId: 0,
    academicYearId: 0,
    totalAmount: "",
    description: "",
    dueDate: formattedDate
  });
  
  // Selected academic year and class for filtering
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  const [selectedFilterClassId, setSelectedFilterClassId] = useState<number | null>(null);
  
  // Fetch academic years for dropdown
  const { data: academicYears, isLoading: isLoadingAcademicYears } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });
  
  // Fetch current academic year for default selection
  const { data: currentAcademicYear } = useQuery<AcademicYear>({
    queryKey: ["/api/academic-years/current"],
  });
  
  // Fetch classes for dropdown, filtered by selected academic year
  const { data: allClasses } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });
  
  // We want to show all classes regardless of academic year
  const classes = useMemo(() => {
    return allClasses || [];
  }, [allClasses]);

  // Set the selected academic year when current academic year loads
  // Also select the first class when data is available
  useEffect(() => {
    // Set default academic year
    if (currentAcademicYear && !selectedAcademicYearId) {
      setSelectedAcademicYearId(currentAcademicYear.id);
    }
    
    // Select first class if none is selected but we have classes available
    if (classes?.length > 0 && !selectedFilterClassId) {
      setSelectedFilterClassId(classes[0].id);
    }
  }, [currentAcademicYear, selectedAcademicYearId, classes, selectedFilterClassId]);
  
  // Fetch fee structures
  const { data: feeStructures, isLoading: isLoadingStructures } = useQuery<FeeStructure[]>({
    queryKey: ["/api/fee-structures"],
  });
  
  // Filter fee structures by selected academic year and class
  const filteredFeeStructures = useMemo(() => {
    if (!feeStructures) return [];
    
    // Start with all fee structures
    let filtered = feeStructures;
    
    // Apply academic year filter if selected
    if (selectedAcademicYearId) {
      filtered = filtered.filter(s => s.academicYearId === selectedAcademicYearId);
    }
    
    // Apply class filter if selected
    if (selectedFilterClassId) {
      filtered = filtered.filter(s => s.classId === selectedFilterClassId);
    }
    
    return filtered;
  }, [feeStructures, selectedAcademicYearId, selectedFilterClassId]);

  // Add fee structure mutation
  const addStructureMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/fee-structures", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-structures"] });
      toast({
        title: "Success",
        description: "Fee structure added successfully",
      });
      setIsStructureFormOpen(false);
      resetStructureForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add fee structure",
        variant: "destructive",
      });
    },
  });

  // Update fee structure mutation
  const updateStructureMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/fee-structures/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-structures"] });
      toast({
        title: "Success",
        description: "Fee structure updated successfully",
      });
      setIsStructureFormOpen(false);
      resetStructureForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fee structure",
        variant: "destructive",
      });
    },
  });

  // Delete fee structure mutation
  const deleteStructureMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/fee-structures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-structures"] });
      toast({
        title: "Success",
        description: "Fee structure deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fee structure. It may have installments or be assigned to students.",
        variant: "destructive",
      });
    },
  });

  // Reset fee structure form
  const resetStructureForm = () => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setStructureFormData({
      name: "",
      classId: selectedFilterClassId || 0,
      academicYearId: selectedAcademicYearId || 0,
      totalAmount: "",
      description: "",
      dueDate: formattedDate
    });
    setCurrentStructure(null);
  };

  // Handle edit fee structure
  const handleEditStructure = (structure: FeeStructure) => {
    setStructureFormMode("edit");
    setCurrentStructure(structure);
    setStructureFormData({
      name: structure.name,
      classId: structure.classId,
      academicYearId: structure.academicYearId,
      totalAmount: structure.totalAmount,
      description: structure.description || "",
      dueDate: structure.dueDate || formattedDate
    });
    setIsStructureFormOpen(true);
  };
  
  // Handle clone fee structure (for cloning between academic years)
  const handleCloneFeeStructure = (structure: FeeStructure) => {
    setStructureFormMode("clone");
    setCurrentStructure(structure);
    
    // Convert totalAmount to string regardless of its original type
    const totalAmount = String(structure.totalAmount);
    
    setStructureFormData({
      name: `Copy of ${structure.name}`,
      classId: selectedFilterClassId || 0,
      academicYearId: selectedAcademicYearId || 0,
      totalAmount: totalAmount,
      description: structure.description || "",
      dueDate: structure.dueDate || formattedDate
    });
    setIsStructureFormOpen(true);
  };

  // Handle delete fee structure
  const handleDeleteStructure = (id: number) => {
    if (window.confirm("Are you sure you want to delete this fee structure?")) {
      deleteStructureMutation.mutate(id);
    }
  };

  // Handle structure form submission
  const handleStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form data
    if (structureFormData.academicYearId === 0) {
      toast({
        title: "Validation Error",
        description: "Please select an academic year",
        variant: "destructive",
      });
      return;
    }
    
    if (structureFormData.classId === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a class",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure totalAmount is properly processed
    // Make sure we get a string value for the totalAmount
    const totalAmountStr = String(structureFormData.totalAmount);
    
    const formDataToSubmit = {
      ...structureFormData,
      totalAmount: totalAmountStr
    };
    
    console.log("Form data to submit:", formDataToSubmit);
    
    if (structureFormMode === "add" || structureFormMode === "clone") {
      // Both add and clone create a new fee structure
      addStructureMutation.mutate(formDataToSubmit);
    } else {
      if (currentStructure) {
        updateStructureMutation.mutate({ 
          id: currentStructure.id, 
          data: formDataToSubmit 
        });
      }
    }
  };

  // Handle structure input change
  const handleStructureInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Update the form data with the new value
    setStructureFormData(prev => {
      // Create a copy of the previous state
      const newData = { ...prev } as FeeStructureFormData;
      
      // Handle different fields appropriately
      if (name === "classId") {
        newData.classId = parseInt(value) || 0;
      } else if (name === "academicYearId") {
        newData.academicYearId = parseInt(value) || 0;
      } else if (name === "totalAmount") {
        newData.totalAmount = value;
      } else if (name === "name") {
        newData.name = value;
        // If the name field is being updated and description is empty, copy name to description
        if (prev.description === "") {
          newData.description = value;
        }
      } else if (name === "description") {
        newData.description = value;
      } else if (name === "dueDate") {
        newData.dueDate = value;
      }
      
      return newData;
    });
  };

  // Get class name by id
  const getClassName = (classId: number) => {
    const classItem = classes?.find(c => c.id === classId);
    return classItem ? classItem.name : "Unknown Class";
  };
  
  // Get academic year name by id
  const getAcademicYearName = (yearId: number) => {
    const year = academicYears?.find(y => y.id === yearId);
    return year ? year.name : "Unknown Year";
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Fee Structures</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Select Academic Year and Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYearFilter">Academic Year</Label>
                  <Select 
                    value={selectedAcademicYearId?.toString() || ""} 
                    onValueChange={(value) => {
                      setSelectedAcademicYearId(parseInt(value));
                      // Reset class filter when academic year changes
                      setSelectedFilterClassId(null);
                    }}
                  >
                    <SelectTrigger id="academicYearFilter" className="w-full">
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
                
                <div className="space-y-2">
                  <Label htmlFor="classFilter">Class</Label>
                  <Select 
                    value={selectedFilterClassId?.toString() || ""} 
                    onValueChange={(value) => setSelectedFilterClassId(parseInt(value))}
                    disabled={!selectedAcademicYearId}
                  >
                    <SelectTrigger id="classFilter" className="w-full">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={() => {
                    if (!selectedAcademicYearId || !selectedFilterClassId) {
                      toast({
                        title: "Selection Required",
                        description: "Please select both Academic Year and Class before creating a fee structure",
                        variant: "destructive"
                      });
                      return;
                    }
                    setStructureFormMode("add");
                    // Pre-fill the form with the selected academic year and class
                    const today = new Date();
                    const formattedDate = today.toISOString().split('T')[0];
                    
                    setStructureFormData(prev => ({
                      ...prev,
                      academicYearId: selectedAcademicYearId,
                      classId: selectedFilterClassId,
                      name: "",
                      totalAmount: "",
                      description: "",
                      dueDate: formattedDate
                    }));
                    setIsStructureFormOpen(true);
                  }}
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" /> Create New Fee Structure
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {(!selectedAcademicYearId || !selectedFilterClassId) ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <LayersIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Please Select Academic Year and Class</h3>
                  <p>Fee structures will be displayed once you select both an academic year and a class.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  Fee Structures for {getAcademicYearName(selectedAcademicYearId)} - {getClassName(selectedFilterClassId)}
                </h3>
              </div>
              <div className="bg-white shadow rounded-lg">
                <DataTable
                  data={filteredFeeStructures || []}
                  isLoading={isLoadingStructures}
                  searchKey="name"
                  columns={[
                    {
                      accessorKey: "name",
                      header: "Structure Name",
                      cell: (item) => (
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      )
                    },
                    {
                      accessorKey: "totalAmount",
                      header: "Total Amount",
                      cell: (item) => (
                        <div className="text-sm text-gray-900">{formatCurrency(parseFloat(item.totalAmount))}</div>
                      )
                    },
                    {
                      accessorKey: "dueDate",
                      header: "Due Date",
                      cell: (item) => (
                        <div className="text-sm text-gray-900">
                          {item.dueDate ? format(new Date(item.dueDate), "MMM d, yyyy") : "N/A"}
                        </div>
                      )
                    },
                    {
                      accessorKey: "id",
                      header: "Actions",
                      cell: (item) => (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            title="Clone Fee Structure"
                            onClick={() => handleCloneFeeStructure(item)}
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            title="Edit Fee Structure"
                            onClick={() => handleEditStructure(item)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            title="Delete Fee Structure"
                            onClick={() => handleDeleteStructure(item.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    }
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fee Structure Form Dialog */}
      <Dialog open={isStructureFormOpen} onOpenChange={setIsStructureFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {structureFormMode === "add" 
                ? "Add Fee Structure" 
                : structureFormMode === "clone" 
                  ? "Clone Fee Structure" 
                  : "Edit Fee Structure"}
            </DialogTitle>
            <DialogDescription>
              {structureFormMode === "add" 
                ? "Create a new fee structure for a class." 
                : structureFormMode === "clone"
                  ? "Clone an existing fee structure to another academic year or class."
                  : "Update the details of this fee structure."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStructureSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Academic Year selector - first and read-only */}
              <div className="space-y-2">
                <Label htmlFor="academicYearId">Academic Year</Label>
                <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                  {getAcademicYearName(structureFormData.academicYearId)}
                  <Input
                    id="academicYearId"
                    name="academicYearId"
                    type="hidden"
                    value={structureFormData.academicYearId}
                  />
                </div>
              </div>
              
              {/* Class selector - second and read-only */}
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <div className="border rounded-md px-3 py-2 bg-muted text-muted-foreground">
                  {getClassName(structureFormData.classId)}
                  <Input
                    id="classId"
                    name="classId"
                    type="hidden"
                    value={structureFormData.classId}
                  />
                </div>
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="name">Structure Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={structureFormData.name}
                  onChange={handleStructureInputChange}
                  placeholder="e.g., Standard Tuition - Toddler"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">{currencySymbol}</span>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={structureFormData.totalAmount}
                    onChange={handleStructureInputChange}
                    className="pl-7"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={structureFormData.dueDate}
                  onChange={handleStructureInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={structureFormData.description}
                  onChange={handleStructureInputChange}
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStructureFormOpen(false);
                  resetStructureForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addStructureMutation.isPending || updateStructureMutation.isPending}
              >
                {structureFormMode === "add" 
                  ? "Add Structure" 
                  : structureFormMode === "clone" 
                    ? "Clone Structure" 
                    : "Update Structure"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}