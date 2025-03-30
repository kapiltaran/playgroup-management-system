import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageIcon, PencilIcon, Trash2Icon, DownloadIcon } from "lucide-react";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Progress
} from "@/components/ui/progress";
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
import type { Inventory } from "@shared/schema";

export default function InventoryPage() {
  const { toast } = useToast();
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);

  // Fetch inventory
  const { data: inventory, isLoading: isLoadingInventory } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  // Add inventory mutation
  const addInventoryMutation = useMutation({
    mutationFn: (newInventory: any) => 
      apiRequest("POST", "/api/inventory", newInventory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsInventoryFormOpen(false);
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add inventory item: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsInventoryFormOpen(false);
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update inventory item: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete inventory mutation
  const deleteInventoryMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete inventory item: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleEditInventory = (item: Inventory) => {
    setSelectedInventory(item);
    setIsInventoryFormOpen(true);
  };

  const handleDeleteInventory = (item: Inventory) => {
    setSelectedInventory(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitInventory = (data: any) => {
    if (selectedInventory?.id) {
      updateInventoryMutation.mutate({ id: selectedInventory.id, data });
    } else {
      addInventoryMutation.mutate(data);
    }
  };

  const exportInventory = async () => {
    try {
      const response = await fetch("/api/export/inventory");
      const data = await response.json();
      
      // Convert to CSV
      const headers = ["ID", "Name", "Category", "Quantity", "Unit", "Min Quantity", "Notes", "Last Updated"];
      const csvRows = [
        headers.join(','),
        ...data.map((item: Inventory) => [
          item.id,
          `"${item.name}"`,
          `"${item.category}"`,
          item.quantity,
          `"${item.unit}"`,
          item.minQuantity,
          `"${item.notes}"`,
          format(new Date(item.lastUpdated), "yyyy-MM-dd")
        ].join(','))
      ];
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Inventory exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export inventory",
        variant: "destructive",
      });
    }
  };

  const renderStockStatus = (item: Inventory) => {
    const percentRemaining = Math.min(100, Math.round((item.quantity / item.minQuantity) * 100));
    
    let statusColor = "bg-green-100 text-green-800 hover:bg-green-100";
    let progressColor = "bg-green-500";
    
    if (item.quantity <= item.minQuantity * 0.5) {
      statusColor = "bg-red-100 text-red-800 hover:bg-red-100";
      progressColor = "bg-red-500";
    } else if (item.quantity <= item.minQuantity) {
      statusColor = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      progressColor = "bg-yellow-500";
    }
    
    return (
      <div className="flex flex-col gap-1">
        <Badge className={statusColor}>
          {item.quantity <= item.minQuantity * 0.5 
            ? "Critical" 
            : item.quantity <= item.minQuantity 
              ? "Low" 
              : "Good"}
        </Badge>
        <div className="flex items-center gap-2">
          <Progress 
            value={percentRemaining} 
            className="h-2 w-24"
            indicatorClassName={progressColor}
          />
          <span className="text-xs">{item.quantity} / {item.minQuantity}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventory}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => {
            setSelectedInventory(null);
            setIsInventoryFormOpen(true);
          }}>
            <PackageIcon className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={inventory || []}
          isLoading={isLoadingInventory}
          searchKey="name"
          columns={[
            {
              accessorKey: "name",
              header: "Item Name",
              cell: (item) => (
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
              )
            },
            {
              accessorKey: "category",
              header: "Category",
              cell: (item) => (
                <div className="text-sm text-gray-700">{item.category}</div>
              )
            },
            {
              accessorKey: "quantity",
              header: "Quantity",
              cell: (item) => (
                <div className="text-sm text-gray-900">
                  {item.quantity} {item.unit}
                </div>
              )
            },
            {
              accessorKey: "stock_status",
              header: "Stock Status",
              cell: (item) => renderStockStatus(item)
            },
            {
              accessorKey: "lastUpdated",
              header: "Last Updated",
              cell: (item) => (
                <div className="text-sm text-gray-500">
                  {format(new Date(item.lastUpdated), "MMM d, yyyy")}
                </div>
              )
            },
            {
              accessorKey: "id",
              header: "Actions",
              cell: (item) => (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditInventory(item)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteInventory(item)}>
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Inventory Form */}
      <InventoryForm
        isOpen={isInventoryFormOpen}
        onClose={() => setIsInventoryFormOpen(false)}
        onSubmit={handleSubmitInventory}
        defaultValues={selectedInventory || undefined}
        isSubmitting={addInventoryMutation.isPending || updateInventoryMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the inventory item &quot;{selectedInventory?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedInventory && deleteInventoryMutation.mutate(selectedInventory.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteInventoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
