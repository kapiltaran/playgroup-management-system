import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, PlusCircleIcon, LayersIcon, CalendarIcon, CopyIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { FeeStructure, FeeInstallment, Class, AcademicYear } from "@shared/schema";

export default function FeeManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("structures");
  
  // Fee Structure state
  const [isStructureFormOpen, setIsStructureFormOpen] = useState(false);
  const [structureFormMode, setStructureFormMode] = useState<"add" | "edit" | "clone">("add");
  const [currentStructure, setCurrentStructure] = useState<FeeStructure | null>(null);
  const [structureFormData, setStructureFormData] = useState({
    name: "",
    classId: 0,
    academicYearId: 0,
    totalAmount: "",
    description: ""
  });

  // Installment state
  const [isInstallmentFormOpen, setIsInstallmentFormOpen] = useState(false);
  const [installmentFormMode, setInstallmentFormMode] = useState<"add" | "edit">("add");
  const [currentInstallment, setCurrentInstallment] = useState<FeeInstallment | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<number | null>(null);
  // Format today's date as YYYY-MM-DD for the date input
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  
  const [installmentFormData, setInstallmentFormData] = useState({
    feeStructureId: 0,
    name: "",
    amount: "",
    dueDate: formattedDate
  });
  
  // Selected academic year for filtering
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<number | null>(null);
  
  // Fetch academic years for dropdown
  const { data: academicYears, isLoading: isLoadingAcademicYears } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });
  
  // Fetch current academic year for default selection
  const { data: currentAcademicYear } = useQuery<AcademicYear>({
    queryKey: ["/api/academic-years/current"],
    onSuccess: (data) => {
      if (data && !selectedAcademicYearId) {
        setSelectedAcademicYearId(data.id);
      }
    }
  });

  // Fetch classes for dropdown, filtered by selected academic year
  const { data: allClasses } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });
  
  // Filter classes by selected academic year
  const classes = useMemo(() => {
    if (!allClasses) return [];
    if (!selectedAcademicYearId) return allClasses;
    return allClasses.filter(c => c.academicYearId === selectedAcademicYearId);
  }, [allClasses, selectedAcademicYearId]);
  
  // Fetch fee structures
  const { data: feeStructures, isLoading: isLoadingStructures } = useQuery<FeeStructure[]>({
    queryKey: ["/api/fee-structures"],
  });
  
  // Filter fee structures by selected academic year
  const filteredFeeStructures = useMemo(() => {
    if (!feeStructures) return [];
    if (!selectedAcademicYearId) return feeStructures;
    return feeStructures.filter(s => s.academicYearId === selectedAcademicYearId);
  }, [feeStructures, selectedAcademicYearId]);

  // Fetch fee installments
  const { data: allInstallments, isLoading: isLoadingInstallments } = useQuery<FeeInstallment[]>({
    queryKey: ["/api/fee-installments"],
  });

  // Filtered installments based on selected structure
  const filteredInstallments = allInstallments?.filter(
    installment => selectedStructureId === null || installment.feeStructureId === selectedStructureId
  );

  // Add fee structure mutation
  const addStructureMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/fee-structures", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-structures"] });
      
      // Check if we need to clone installments (from localStorage)
      const installmentsToCloneStr = localStorage.getItem('installmentsToClone');
      if (installmentsToCloneStr && structureFormMode === "clone") {
        try {
          const installmentsToClone = JSON.parse(installmentsToCloneStr) as FeeInstallment[];
          // Clear the storage immediately to avoid duplicate operations
          localStorage.removeItem('installmentsToClone');
          
          if (installmentsToClone.length > 0) {
            // Clone each installment to the new fee structure
            installmentsToClone.forEach(installment => {
              const newInstallment = {
                feeStructureId: data.id, // New structure ID
                name: installment.name,
                amount: installment.amount,
                dueDate: installment.dueDate
              };
              
              // Create the new installment
              apiRequest("POST", "/api/fee-installments", newInstallment)
                .catch(error => console.error("Error cloning installment:", error));
            });
            
            // Invalidate installments after cloning
            queryClient.invalidateQueries({ queryKey: ["/api/fee-installments"] });
            
            // Show success message for cloning
            toast({
              title: "Success",
              description: `Fee structure and ${installmentsToClone.length} installments cloned successfully`,
            });
          }
        } catch (error) {
          console.error("Error parsing installments to clone:", error);
        }
      } else {
        // Show regular success message
        toast({
          title: "Success",
          description: "Fee structure added successfully",
        });
      }
      
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

  // Add fee installment mutation
  const addInstallmentMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/fee-installments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-installments"] });
      toast({
        title: "Success",
        description: "Fee installment added successfully",
      });
      setIsInstallmentFormOpen(false);
      resetInstallmentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add fee installment",
        variant: "destructive",
      });
    },
  });

  // Update fee installment mutation
  const updateInstallmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/fee-installments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-installments"] });
      toast({
        title: "Success",
        description: "Fee installment updated successfully",
      });
      setIsInstallmentFormOpen(false);
      resetInstallmentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fee installment",
        variant: "destructive",
      });
    },
  });

  // Delete fee installment mutation
  const deleteInstallmentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/fee-installments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-installments"] });
      toast({
        title: "Success",
        description: "Fee installment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fee installment. It may have payments associated with it.",
        variant: "destructive",
      });
    },
  });

  // Reset fee structure form
  const resetStructureForm = () => {
    setStructureFormData({
      name: "",
      classId: 0,
      academicYearId: selectedAcademicYearId || 0,
      totalAmount: "",
      description: ""
    });
    setCurrentStructure(null);
  };

  // Reset fee installment form
  const resetInstallmentForm = () => {
    // Format today's date as YYYY-MM-DD for the date input
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    setInstallmentFormData({
      feeStructureId: selectedStructureId || 0,
      name: "",
      amount: "",
      dueDate: formattedDate
    });
    setCurrentInstallment(null);
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
      description: structure.description || ""
    });
    setIsStructureFormOpen(true);
  };
  
  // Handle clone fee structure (for cloning between academic years)
  const handleCloneFeeStructure = (structure: FeeStructure) => {
    setStructureFormMode("clone");
    setCurrentStructure(structure);
    setStructureFormData({
      name: `Copy of ${structure.name}`,
      classId: 0, // Will need to be selected by user
      academicYearId: selectedAcademicYearId || 0,
      totalAmount: structure.totalAmount,
      description: structure.description || ""
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
    
    const formDataToSubmit = {
      ...structureFormData,
      totalAmount: structureFormData.totalAmount.toString()
    };
    
    if (structureFormMode === "add" || structureFormMode === "clone") {
      // Both add and clone create a new fee structure
      addStructureMutation.mutate(formDataToSubmit);
      
      // If cloning, we may want to also copy the installments
      if (structureFormMode === "clone" && currentStructure) {
        // Get installments for the current fee structure
        const installmentsToClone = allInstallments?.filter(
          installment => installment.feeStructureId === currentStructure.id
        );
        
        // We need to wait for the new structure to be created before adding installments
        // This will happen in onSuccess of the mutation
        localStorage.setItem('installmentsToClone', JSON.stringify(installmentsToClone || []));
      }
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
    setStructureFormData(prev => ({
      ...prev,
      [name]: name === "classId" ? parseInt(value) || 0 : value
    }));
  };

  // Handle edit fee installment
  const handleEditInstallment = (installment: FeeInstallment) => {
    setInstallmentFormMode("edit");
    setCurrentInstallment(installment);
    setInstallmentFormData({
      feeStructureId: installment.feeStructureId,
      name: installment.name,
      amount: installment.amount,
      dueDate: installment.dueDate
    });
    setIsInstallmentFormOpen(true);
  };

  // Handle delete fee installment
  const handleDeleteInstallment = (id: number) => {
    if (window.confirm("Are you sure you want to delete this fee installment?")) {
      deleteInstallmentMutation.mutate(id);
    }
  };

  // Handle clone fee installment
  const handleCloneInstallment = (installment: FeeInstallment) => {
    // Set up the clone data - we'll use the same data but with a "Copy of" prefix for the name
    const cloneData = {
      feeStructureId: installment.feeStructureId,
      name: `Copy of ${installment.name}`,
      amount: installment.amount.toString(),
      dueDate: new Date(installment.dueDate).toISOString().split('T')[0]
    };
    
    // Set the form data with the clone values
    setInstallmentFormData(cloneData);
    
    // Set the form mode to add (since we're creating a new installment)
    setInstallmentFormMode("add");
    
    // Open the form dialog
    setIsInstallmentFormOpen(true);
    
    // Set selected structure ID to make sure it's pre-selected
    setSelectedStructureId(installment.feeStructureId);
  };

  // Handle installment form submission
  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form data
    if (installmentFormData.feeStructureId === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a fee structure",
        variant: "destructive",
      });
      return;
    }
    
    const formDataToSubmit = {
      ...installmentFormData,
      amount: installmentFormData.amount.toString()
    };
    
    if (installmentFormMode === "add") {
      addInstallmentMutation.mutate(formDataToSubmit);
    } else {
      if (currentInstallment) {
        updateInstallmentMutation.mutate({ 
          id: currentInstallment.id, 
          data: formDataToSubmit 
        });
      }
    }
  };

  // Handle installment input change
  const handleInstallmentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInstallmentFormData(prev => ({
      ...prev,
      [name]: name === "feeStructureId" ? parseInt(value) || 0 : value
    }));
  };

  // Update installment form data when selected structure changes
  useEffect(() => {
    if (selectedStructureId) {
      setInstallmentFormData(prev => ({
        ...prev,
        feeStructureId: selectedStructureId
      }));
    }
  }, [selectedStructureId]);

  // Get class name by id
  const getClassName = (classId: number) => {
    const classItem = classes?.find(c => c.id === classId);
    return classItem ? classItem.name : "Unknown Class";
  };

  // Get fee structure name by id
  const getStructureName = (structureId: number) => {
    const structure = feeStructures?.find(s => s.id === structureId);
    return structure ? structure.name : "Unknown Structure";
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="installments">Installments</TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">Fee Structures</h2>
              <Select 
                value={selectedAcademicYearId?.toString() || "all"} 
                onValueChange={(value) => setSelectedAcademicYearId(value !== "all" ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears?.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} {year.isCurrent && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => {
              setStructureFormMode("add");
              resetStructureForm();
              setIsStructureFormOpen(true);
            }}>
              <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Fee Structure
            </Button>
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
                  accessorKey: "classId",
                  header: "Class",
                  cell: (item) => (
                    <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                      {getClassName(item.classId)}
                    </Badge>
                  )
                },
                {
                  accessorKey: "totalAmount",
                  header: "Total Amount",
                  cell: (item) => (
                    <div className="text-sm text-gray-900">${parseFloat(item.totalAmount).toFixed(2)}</div>
                  )
                },
                {
                  accessorKey: "academicYearId",
                  header: "Academic Year",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{getAcademicYearName(item.academicYearId)}</div>
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
                        onClick={() => {
                          setSelectedStructureId(item.id);
                          setActiveTab("installments");
                        }}
                      >
                        <LayersIcon className="h-4 w-4" />
                      </Button>
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
        </TabsContent>

        <TabsContent value="installments" className="mt-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">Installments</h2>
              <Select 
                value={selectedStructureId?.toString() || "all"} 
                onValueChange={(value) => setSelectedStructureId(value !== "all" ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by Fee Structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fee Structures</SelectItem>
                  {(selectedAcademicYearId ? filteredFeeStructures : feeStructures)?.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id.toString()}>
                      {structure.name} - {getAcademicYearName(structure.academicYearId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => {
                setInstallmentFormMode("add");
                resetInstallmentForm();
                setIsInstallmentFormOpen(true);
              }}
              disabled={!selectedStructureId}
            >
              <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Installment
            </Button>
          </div>

          {!selectedStructureId && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <LayersIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Fee Structure</h3>
                  <p>Please select a fee structure to add installments or view installments for a specific structure.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-white shadow rounded-lg">
            <DataTable
              data={filteredInstallments || []}
              isLoading={isLoadingInstallments}
              searchKey="name"
              columns={[
                {
                  accessorKey: "name",
                  header: "Installment Name",
                  cell: (item) => (
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                  )
                },
                {
                  accessorKey: "feeStructureId",
                  header: "Fee Structure",
                  cell: (item) => (
                    <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                      {getStructureName(item.feeStructureId)}
                    </Badge>
                  )
                },
                {
                  accessorKey: "amount",
                  header: "Amount",
                  cell: (item) => (
                    <div className="text-sm text-gray-900">${parseFloat(item.amount).toFixed(2)}</div>
                  )
                },
                {
                  accessorKey: "dueDate",
                  header: "Due Date",
                  cell: (item) => (
                    <div className="text-sm text-gray-700 flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(new Date(item.dueDate), "MMM d, yyyy")}
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
                        title="Clone Installment" 
                        onClick={() => handleCloneInstallment(item)}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Edit Installment"
                        onClick={() => handleEditInstallment(item)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        title="Delete Installment"
                        onClick={() => handleDeleteInstallment(item.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>

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
              {/* Academic Year selector - first! */}
              <div className="space-y-2">
                <Label htmlFor="academicYearId">Academic Year</Label>
                <Select 
                  value={structureFormData.academicYearId.toString()} 
                  onValueChange={(value) => {
                    const yearId = parseInt(value);
                    setStructureFormData(prev => ({
                      ...prev,
                      academicYearId: yearId
                    }));
                    setSelectedAcademicYearId(yearId);
                  }}
                >
                  <SelectTrigger id="academicYearId">
                    <SelectValue placeholder="Select academic year" />
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
                <Label htmlFor="classId">Class</Label>
                <Select 
                  value={structureFormData.classId.toString()} 
                  onValueChange={(value) => {
                    setStructureFormData(prev => ({
                      ...prev,
                      classId: parseInt(value)
                    }));
                  }}
                >
                  <SelectTrigger id="classId">
                    <SelectValue placeholder="Select a class" />
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

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
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

      {/* Fee Installment Form Dialog */}
      <Dialog open={isInstallmentFormOpen} onOpenChange={setIsInstallmentFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {installmentFormMode === "add" ? "Add Fee Installment" : "Edit Fee Installment"}
            </DialogTitle>
            <DialogDescription>
              {installmentFormMode === "add" 
                ? "Create a new installment for this fee structure." 
                : "Update the details of this installment."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInstallmentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {!selectedStructureId && installmentFormMode === "add" && (
                <div className="space-y-2">
                  <Label htmlFor="feeStructureId">Fee Structure</Label>
                  <Select 
                    value={installmentFormData.feeStructureId.toString()} 
                    onValueChange={(value) => {
                      setInstallmentFormData(prev => ({
                        ...prev,
                        feeStructureId: parseInt(value)
                      }));
                    }}
                  >
                    <SelectTrigger id="feeStructureId">
                      <SelectValue placeholder="Select a fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedAcademicYearId ? filteredFeeStructures : feeStructures)?.map((structure) => (
                        <SelectItem key={structure.id} value={structure.id.toString()}>
                          {structure.name} - {getAcademicYearName(structure.academicYearId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Installment Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={installmentFormData.name}
                  onChange={handleInstallmentInputChange}
                  placeholder="e.g., Fall Term"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={installmentFormData.amount}
                    onChange={handleInstallmentInputChange}
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
                  value={installmentFormData.dueDate}
                  onChange={handleInstallmentInputChange}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInstallmentFormOpen(false);
                  resetInstallmentForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addInstallmentMutation.isPending || updateInstallmentMutation.isPending}
              >
                {installmentFormMode === "add" ? "Add Installment" : "Update Installment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}