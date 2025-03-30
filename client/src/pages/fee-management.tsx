import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, PlusCircleIcon, LayersIcon, CalendarIcon } from "lucide-react";
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
import type { FeeStructure, FeeInstallment, Class } from "@shared/schema";

export default function FeeManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("structures");
  
  // Fee Structure state
  const [isStructureFormOpen, setIsStructureFormOpen] = useState(false);
  const [structureFormMode, setStructureFormMode] = useState<"add" | "edit">("add");
  const [currentStructure, setCurrentStructure] = useState<FeeStructure | null>(null);
  const [structureFormData, setStructureFormData] = useState({
    name: "",
    classId: 0,
    totalAmount: "",
    academicYear: "",
    description: ""
  });

  // Installment state
  const [isInstallmentFormOpen, setIsInstallmentFormOpen] = useState(false);
  const [installmentFormMode, setInstallmentFormMode] = useState<"add" | "edit">("add");
  const [currentInstallment, setCurrentInstallment] = useState<FeeInstallment | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<number | null>(null);
  const [installmentFormData, setInstallmentFormData] = useState({
    feeStructureId: 0,
    name: "",
    amount: "",
    dueDate: ""
  });

  // Fetch classes for dropdown
  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch fee structures
  const { data: feeStructures, isLoading: isLoadingStructures } = useQuery<FeeStructure[]>({
    queryKey: ["/api/fee-structures"],
  });

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
      totalAmount: "",
      academicYear: "",
      description: ""
    });
    setCurrentStructure(null);
  };

  // Reset fee installment form
  const resetInstallmentForm = () => {
    setInstallmentFormData({
      feeStructureId: selectedStructureId || 0,
      name: "",
      amount: "",
      dueDate: ""
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
      totalAmount: structure.totalAmount,
      academicYear: structure.academicYear,
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
    
    const formDataToSubmit = {
      ...structureFormData,
      totalAmount: structureFormData.totalAmount.toString()
    };
    
    if (structureFormMode === "add") {
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

  // Handle installment form submission
  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Fee Structures</h2>
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
              data={feeStructures || []}
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
                  accessorKey: "academicYear",
                  header: "Academic Year",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{item.academicYear}</div>
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
                      <Button variant="outline" size="sm" onClick={() => handleEditStructure(item)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
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
                value={selectedStructureId?.toString() || ""} 
                onValueChange={(value) => setSelectedStructureId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by Fee Structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Fee Structures</SelectItem>
                  {feeStructures?.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id.toString()}>
                      {structure.name}
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
                      <Button variant="outline" size="sm" onClick={() => handleEditInstallment(item)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
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
              {structureFormMode === "add" ? "Add Fee Structure" : "Edit Fee Structure"}
            </DialogTitle>
            <DialogDescription>
              {structureFormMode === "add" 
                ? "Create a new fee structure for a class." 
                : "Update the details of this fee structure."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStructureSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  name="academicYear"
                  value={structureFormData.academicYear}
                  onChange={handleStructureInputChange}
                  placeholder="e.g., 2023-2024"
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
                {structureFormMode === "add" ? "Add Structure" : "Update Structure"}
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
                      {feeStructures?.map((structure) => (
                        <SelectItem key={structure.id} value={structure.id.toString()}>
                          {structure.name}
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