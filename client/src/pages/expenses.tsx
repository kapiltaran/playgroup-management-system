import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSignIcon, PencilIcon, Trash2Icon, DownloadIcon } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/expense-form";
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
import type { Expense } from "@shared/schema";

export default function Expenses() {
  const { toast } = useToast();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Fetch expenses
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: (newExpense: any) => 
      apiRequest("POST", "/api/expenses", newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/expenses"] });
      setIsExpenseFormOpen(false);
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add expense: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/expenses"] });
      setIsExpenseFormOpen(false);
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update expense: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/expenses"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete expense: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseFormOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitExpense = (data: any) => {
    if (selectedExpense?.id) {
      updateExpenseMutation.mutate({ id: selectedExpense.id, data });
    } else {
      addExpenseMutation.mutate(data);
    }
  };

  const exportExpenses = async () => {
    try {
      const response = await fetch("/api/export/expenses");
      const data = await response.json();
      
      // Convert to CSV
      const headers = ["ID", "Description", "Amount", "Category", "Date", "Notes"];
      const csvRows = [
        headers.join(','),
        ...data.map((expense: Expense) => [
          expense.id,
          `"${expense.description}"`,
          expense.amount,
          `"${expense.category}"`,
          expense.date,
          `"${expense.notes}"`
        ].join(','))
      ];
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Expenses exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export expenses",
        variant: "destructive",
      });
    }
  };

  const renderCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      "Materials": "bg-blue-100 text-blue-800 hover:bg-blue-100",
      "Food": "bg-green-100 text-green-800 hover:bg-green-100",
      "Activities": "bg-purple-100 text-purple-800 hover:bg-purple-100",
      "Utilities": "bg-gray-100 text-gray-800 hover:bg-gray-100",
      "Salary": "bg-orange-100 text-orange-800 hover:bg-orange-100",
      "Rent": "bg-pink-100 text-pink-800 hover:bg-pink-100",
      "Equipment": "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
      "Maintenance": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      "Transportation": "bg-red-100 text-red-800 hover:bg-red-100",
      "Other": "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };

    return (
      <Badge className={colors[category] || "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
        {category}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExpenses}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={() => {
            setSelectedExpense(null);
            setIsExpenseFormOpen(true);
          }}>
            <DollarSignIcon className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <DataTable
          data={expenses || []}
          isLoading={isLoadingExpenses}
          searchKey="description"
          columns={[
            {
              accessorKey: "description",
              header: "Description",
              cell: (expense) => (
                <div className="text-sm font-medium text-gray-900">{expense.description}</div>
              )
            },
            {
              accessorKey: "category",
              header: "Category",
              cell: (expense) => renderCategoryBadge(expense.category)
            },
            {
              accessorKey: "amount",
              header: "Amount",
              cell: (expense) => (
                <div className="text-sm text-gray-900">${parseFloat(expense.amount as string).toFixed(2)}</div>
              )
            },
            {
              accessorKey: "date",
              header: "Date",
              cell: (expense) => (
                <div className="text-sm text-gray-500">
                  {format(new Date(expense.date), "MMM d, yyyy")}
                </div>
              )
            },
            {
              accessorKey: "id",
              header: "Actions",
              cell: (expense) => (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditExpense(expense)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteExpense(expense)}>
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Expense Form */}
      <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={handleSubmitExpense}
        defaultValues={selectedExpense || undefined}
        isSubmitting={addExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the expense &quot;{selectedExpense?.description}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedExpense && deleteExpenseMutation.mutate(selectedExpense.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteExpenseMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
