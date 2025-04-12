import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { PencilIcon, TrashIcon, PlusCircleIcon, BellIcon, ReceiptIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import type { Student, FeeStructure, FeePayment, Reminder } from "@shared/schema";

// Define payment methods
const PAYMENT_METHODS = [
  "Cash", 
  "Bank Transfer", 
  "Check", 
  "Credit Card", 
  "Debit Card", 
  "Mobile Payment", 
  "Other"
];

export default function FeePayments() {
  const { toast } = useToast();
  const { currencySymbol, formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState("payments");
  
  // Payment state
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentFormMode, setPaymentFormMode] = useState<"add" | "edit">("add");
  const [currentPayment, setCurrentPayment] = useState<FeePayment | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    studentId: 0,
    feeStructureId: 0,
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    discountAmount: "0",
    miscAmount: "0",
    totalAmount: "0", // Calculated field (amount - discount + misc)
    paymentMethod: "Cash",
    receiptNumber: "",
    notes: "",
    isUnassignedFeeStructure: false
  });

  // Reminder state
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [reminderFormMode, setReminderFormMode] = useState<"add" | "edit">("add");
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);
  const [reminderFormData, setReminderFormData] = useState({
    studentId: 0,
    feeStructureId: 0,
    message: "",
    status: "pending"
  });

  // Fetch students for dropdown
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch all fee structures
  const { data: feeStructures } = useQuery<FeeStructure[]>({
    queryKey: ["/api/fee-structures"],
  });

  // Fetch pending fees (overdue and upcoming)
  const { data: pendingFees, isLoading: isLoadingPendingFees } = useQuery({
    queryKey: ["/api/fee-reports/pending"],
  });

  // Fetch payments
  const { data: paymentsRaw, isLoading: isLoadingPayments } = useQuery<FeePayment[]>({
    queryKey: ["/api/fee-payments"],
  });
  
  // Fetch reminders
  const { data: remindersRaw, isLoading: isLoadingReminders } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/fee-payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-reports/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Success",
        description: "Payment added successfully",
      });
      setIsPaymentFormOpen(false);
      resetPaymentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment",
        variant: "destructive",
      });
    },
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/fee-payments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-reports/pending"] });
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
      setIsPaymentFormOpen(false);
      resetPaymentForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/fee-payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-reports/pending"] });
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment",
        variant: "destructive",
      });
    },
  });

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/reminders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder created successfully",
      });
      setIsReminderFormOpen(false);
      resetReminderForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder",
        variant: "destructive",
      });
    },
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/reminders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder updated successfully",
      });
      setIsReminderFormOpen(false);
      resetReminderForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder",
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reminder",
        variant: "destructive",
      });
    },
  });

  // Mark reminder as sent mutation
  const markReminderSentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("PATCH", `/api/reminders/${id}`, { 
        status: "sent",
        sentDate: new Date().toISOString().split("T")[0]
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder marked as sent",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder status",
        variant: "destructive",
      });
    },
  });

  // Reset payment form
  const resetPaymentForm = () => {
    setPaymentFormData({
      studentId: 0,
      feeStructureId: 0,
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      discountAmount: "0",
      miscAmount: "0",
      totalAmount: "0",
      paymentMethod: "Cash",
      receiptNumber: "",
      notes: "",
      isUnassignedFeeStructure: false
    });
    setCurrentPayment(null);
  };

  // Reset reminder form
  const resetReminderForm = () => {
    setReminderFormData({
      studentId: 0,
      feeStructureId: 0,
      message: "",
      status: "pending"
    });
    setCurrentReminder(null);
  };

  // Handle edit payment
  const handleEditPayment = (payment: FeePayment) => {
    setPaymentFormMode("edit");
    setCurrentPayment(payment);
    setPaymentFormData({
      studentId: payment.studentId,
      feeStructureId: payment.feeStructureId,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      discountAmount: "0", // Default to 0 for existing payments
      miscAmount: "0", // Default to 0 for existing payments
      totalAmount: payment.amount, // Default to the payment amount for existing records
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber || "",
      notes: payment.notes || "",
      isUnassignedFeeStructure: payment.studentId === 0 // If studentId is 0, it's an unassigned payment
    });
    setIsPaymentFormOpen(true);
  };

  // Handle delete payment
  const handleDeletePayment = (id: number) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      deletePaymentMutation.mutate(id);
    }
  };

  // Handle payment form submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate student selection for non-unassigned fee structures
    if (!paymentFormData.isUnassignedFeeStructure && paymentFormData.studentId === 0) {
      toast({
        title: "Error",
        description: "Please select a student for this payment",
        variant: "destructive",
      });
      return;
    }
    
    // For unassigned fee structures, we'll set studentId to 0 as a marker
    // The backend will interpret this as an unassigned payment
    
    // Use the final totalAmount as the amount to be submitted to the API
    // This ensures the calculated value (including discounts and misc amounts) is what's recorded
    // Add notes about discount if applicable
    const hasDiscount = parseFloat(paymentFormData.discountAmount || "0") > 0;
    const hasMisc = parseFloat(paymentFormData.miscAmount || "0") > 0;
    
    let notes = paymentFormData.notes || "";
    
    // If a discount was applied, add a note about it
    if (hasDiscount) {
      const discountNote = `Discount applied: ${currencySymbol}${parseFloat(paymentFormData.discountAmount).toFixed(2)}`;
      notes = notes ? `${notes}\n${discountNote}` : discountNote;
    }
    
    // If misc charges were added, note them too
    if (hasMisc) {
      const miscNote = `Additional charges: ${currencySymbol}${parseFloat(paymentFormData.miscAmount).toFixed(2)}`;
      notes = notes ? `${notes}\n${miscNote}` : miscNote;
    }
    
    const formDataToSubmit = {
      ...paymentFormData,
      amount: paymentFormData.totalAmount.toString(),
      notes: notes
    };
    
    if (paymentFormMode === "add") {
      addPaymentMutation.mutate(formDataToSubmit);
    } else {
      if (currentPayment) {
        updatePaymentMutation.mutate({ 
          id: currentPayment.id, 
          data: formDataToSubmit 
        });
      }
    }
  };

  // Handle payment input change
  const handlePaymentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "studentId" || name === "feeStructureId") {
      setPaymentFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setPaymentFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle edit reminder
  const handleEditReminder = (reminder: Reminder) => {
    setReminderFormMode("edit");
    setCurrentReminder(reminder);
    setReminderFormData({
      studentId: reminder.studentId,
      feeStructureId: reminder.feeStructureId,
      message: reminder.message,
      status: reminder.status
    });
    setIsReminderFormOpen(true);
  };

  // Handle delete reminder
  const handleDeleteReminder = (id: number) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      deleteReminderMutation.mutate(id);
    }
  };

  // Handle reminder form submission
  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reminderFormMode === "add") {
      addReminderMutation.mutate(reminderFormData);
    } else {
      if (currentReminder) {
        updateReminderMutation.mutate({ 
          id: currentReminder.id, 
          data: reminderFormData 
        });
      }
    }
  };

  // Handle reminder input change
  const handleReminderInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "studentId" || name === "feeStructureId") {
      setReminderFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setReminderFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle mark reminder as sent
  const handleMarkReminderSent = (id: number) => {
    markReminderSentMutation.mutate(id);
  };

  // Helper functions to get names by IDs
  const getStudentName = (studentId: number) => {
    const student = students?.find(s => s.id === studentId);
    return student ? student.fullName : "Unknown Student";
  };

  const getFeeStructureName = (feeStructureId: number) => {
    const feeStructure = feeStructures?.find(fs => fs.id === feeStructureId);
    return feeStructure ? feeStructure.name : "Unknown Fee Structure";
  };

  // Prepare payment receipt number
  useEffect(() => {
    if (paymentFormMode === "add" && !paymentFormData.receiptNumber) {
      const nextId = (paymentsRaw?.length || 0) + 1;
      setPaymentFormData(prev => ({
        ...prev,
        receiptNumber: `RC-${nextId.toString().padStart(3, '0')}`
      }));
    }
  }, [paymentFormMode, paymentsRaw?.length, paymentFormData.receiptNumber]);

  // Auto-populate reminder message
  useEffect(() => {
    if (reminderFormMode === "add" && reminderFormData.studentId && reminderFormData.feeStructureId) {
      const selectedFee = pendingFees?.find(
        fee => fee.studentId === reminderFormData.studentId && 
               fee.feeStructureId === reminderFormData.feeStructureId
      );
      
      if (selectedFee) {
        const studentName = getStudentName(selectedFee.studentId);
        const feeName = getFeeStructureName(selectedFee.feeStructureId);
        const dueAmount = parseFloat(selectedFee.dueAmount).toFixed(2);
        const dueDate = format(new Date(selectedFee.dueDate), "MMMM d, yyyy");
        
        let defaultMessage = "";
        if (selectedFee.status === "overdue") {
          defaultMessage = `Dear ${studentName}'s Parents,\n\nThis is a friendly reminder that your ${feeName} payment of ${currencySymbol}${dueAmount} was due on ${dueDate} and is currently overdue. Please make the payment as soon as possible.\n\nThank you.`;
        } else {
          defaultMessage = `Dear ${studentName}'s Parents,\n\nThis is a friendly reminder that your ${feeName} payment of ${currencySymbol}${dueAmount} is due on ${dueDate}. Please ensure timely payment to avoid any late fees.\n\nThank you.`;
        }
        
        setReminderFormData(prev => ({
          ...prev,
          message: defaultMessage
        }));
      }
    }
  }, [reminderFormMode, reminderFormData.studentId, reminderFormData.feeStructureId, pendingFees]);

  // Format status badge
  const formatStatusBadge = (status: string) => {
    switch (status) {
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "sent":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Sent</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fee Collection</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 w-[500px]">
          <TabsTrigger value="pending">Pending Fees</TabsTrigger>
          <TabsTrigger value="payments">Payment Records</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Pending Fee Payments</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setReminderFormMode("add");
                  resetReminderForm();
                  setIsReminderFormOpen(true);
                }}
              >
                <BellIcon className="mr-2 h-4 w-4" /> Send Reminder
              </Button>
              <Button 
                onClick={() => {
                  setPaymentFormMode("add");
                  resetPaymentForm();
                  setIsPaymentFormOpen(true);
                }}
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <DataTable
              data={pendingFees || []}
              isLoading={isLoadingPendingFees}
              searchKey="studentName"
              columns={[
                {
                  accessorKey: "studentName",
                  header: "Student",
                  cell: (item) => (
                    <div className="text-sm font-medium text-gray-900">{item.studentName}</div>
                  )
                },
                {
                  accessorKey: "className",
                  header: "Class",
                  cell: (item) => (
                    <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">
                      {item.className}
                    </Badge>
                  )
                },
                {
                  accessorKey: "feeName",
                  header: "Fee Structure",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{item.feeName}</div>
                  )
                },
                {
                  accessorKey: "dueDate",
                  header: "Due Date",
                  cell: (item) => (
                    <div className="text-sm text-gray-500">
                      {format(new Date(item.dueDate), "MMM d, yyyy")}
                    </div>
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
                  accessorKey: "paidAmount",
                  header: "Paid Amount",
                  cell: (item) => (
                    <div className="text-sm text-gray-900">${parseFloat(item.paidAmount).toFixed(2)}</div>
                  )
                },
                {
                  accessorKey: "dueAmount",
                  header: "Due Amount",
                  cell: (item) => (
                    <div className="text-sm font-medium text-red-600">{formatCurrency(parseFloat(item.dueAmount))}</div>
                  )
                },
                {
                  accessorKey: "status",
                  header: "Status",
                  cell: (item) => formatStatusBadge(item.status)
                },
                {
                  accessorKey: "actions",
                  header: "Actions",
                  cell: (item) => (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReminderFormMode("add");
                          setReminderFormData({
                            studentId: item.studentId,
                            feeStructureId: item.feeStructureId,
                            message: "",
                            status: "pending"
                          });
                          setIsReminderFormOpen(true);
                        }}
                      >
                        <BellIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => {
                          setPaymentFormMode("add");
                          const dueAmount = item.dueAmount.toString();
                          setPaymentFormData(prev => ({
                            ...prev,
                            studentId: item.studentId,
                            feeStructureId: item.feeStructureId,
                            amount: dueAmount,
                            discountAmount: "0",
                            miscAmount: "0",
                            totalAmount: dueAmount // Initialize the total amount
                          }));
                          setIsPaymentFormOpen(true);
                        }}
                      >
                        <ReceiptIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Payment Records</h2>
            <Button 
              onClick={() => {
                setPaymentFormMode("add");
                resetPaymentForm();
                setIsPaymentFormOpen(true);
              }}
            >
              <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Payment
            </Button>
          </div>

          <div className="bg-white shadow rounded-lg">
            <DataTable
              data={paymentsRaw || []}
              isLoading={isLoadingPayments}
              searchKey="studentId"
              searchFunction={(item, query) => {
                const studentName = getStudentName(item.studentId).toLowerCase();
                return studentName.includes(query.toLowerCase());
              }}
              columns={[
                {
                  accessorKey: "receiptNumber",
                  header: "Receipt No.",
                  cell: (item) => (
                    <div className="text-sm font-medium text-gray-900">{item.receiptNumber || "-"}</div>
                  )
                },
                {
                  accessorKey: "studentId",
                  header: "Student",
                  cell: (item) => (
                    <div className="text-sm text-gray-900">{getStudentName(item.studentId)}</div>
                  )
                },
                {
                  accessorKey: "feeStructureId",
                  header: "Fee Structure",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{getFeeStructureName(item.feeStructureId)}</div>
                  )
                },
                {
                  accessorKey: "paymentDate",
                  header: "Payment Date",
                  cell: (item) => (
                    <div className="text-sm text-gray-500">
                      {format(new Date(item.paymentDate), "MMM d, yyyy")}
                    </div>
                  )
                },
                {
                  accessorKey: "amount",
                  header: "Amount",
                  cell: (item) => (
                    <div className="text-sm text-gray-900">{formatCurrency(parseFloat(item.amount))}</div>
                  )
                },
                {
                  accessorKey: "paymentMethod",
                  header: "Method",
                  cell: (item) => (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                      {item.paymentMethod}
                    </Badge>
                  )
                },
                {
                  accessorKey: "id",
                  header: "Actions",
                  cell: (item) => (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditPayment(item)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeletePayment(item.id)}
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

        <TabsContent value="reminders" className="mt-4">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Payment Reminders</h2>
            <Button 
              onClick={() => {
                setReminderFormMode("add");
                resetReminderForm();
                setIsReminderFormOpen(true);
              }}
            >
              <PlusCircleIcon className="mr-2 h-4 w-4" /> Create Reminder
            </Button>
          </div>

          <div className="bg-white shadow rounded-lg">
            <DataTable
              data={remindersRaw || []}
              isLoading={isLoadingReminders}
              searchKey="studentId"
              searchFunction={(item, query) => {
                const studentName = getStudentName(item.studentId).toLowerCase();
                return studentName.includes(query.toLowerCase());
              }}
              columns={[
                {
                  accessorKey: "studentId",
                  header: "Student",
                  cell: (item) => (
                    <div className="text-sm font-medium text-gray-900">{getStudentName(item.studentId)}</div>
                  )
                },
                {
                  accessorKey: "feeStructureId",
                  header: "Fee Structure",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{getFeeStructureName(item.feeStructureId)}</div>
                  )
                },
                {
                  accessorKey: "createdAt",
                  header: "Created",
                  cell: (item) => (
                    <div className="text-sm text-gray-500">
                      {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "-"}
                    </div>
                  )
                },
                {
                  accessorKey: "sentDate",
                  header: "Sent",
                  cell: (item) => (
                    <div className="text-sm text-gray-500">
                      {item.sentDate ? format(new Date(item.sentDate), "MMM d, yyyy") : "-"}
                    </div>
                  )
                },
                {
                  accessorKey: "message",
                  header: "Message",
                  cell: (item) => (
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {item.message}
                    </div>
                  )
                },
                {
                  accessorKey: "status",
                  header: "Status",
                  cell: (item) => formatStatusBadge(item.status)
                },
                {
                  accessorKey: "id",
                  header: "Actions",
                  cell: (item) => (
                    <div className="flex space-x-2">
                      {item.status === "pending" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleMarkReminderSent(item.id)}
                        >
                          <BellIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEditReminder(item)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteReminder(item.id)}
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

      {/* Payment Form Dialog */}
      <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {paymentFormMode === "add" ? "Record Fee Payment" : "Edit Fee Payment"}
            </DialogTitle>
            <DialogDescription>
              {paymentFormMode === "add" 
                ? "Record a new payment for a student's fee installment." 
                : "Update the details of this payment record."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="feeStructureId">Fee Structure</Label>
                </div>
                <Select 
                  value={paymentFormData.feeStructureId.toString()} 
                  onValueChange={(value) => {
                    const feeStructureId = parseInt(value);
                    const selectedFeeStructure = pendingFees?.find(fee => fee.feeStructureId === feeStructureId);
                    
                    // Check if this is an unassigned fee structure
                    const isUnassigned = selectedFeeStructure?.studentId === null;
                    
                    // Get the due amount for calculations
                    const dueAmount = selectedFeeStructure?.dueAmount.toString() || "0";
                    
                    setPaymentFormData(prev => ({
                      ...prev,
                      feeStructureId: feeStructureId,
                      isUnassignedFeeStructure: isUnassigned || false,
                      // If the fee structure is unassigned, reset studentId
                      studentId: isUnassigned ? 0 : (selectedFeeStructure?.studentId || prev.studentId),
                      // Set the amount to the due amount if available
                      amount: dueAmount,
                      // Reset discount and misc amounts
                      discountAmount: "0",
                      miscAmount: "0",
                      // Set total amount equal to due amount initially
                      totalAmount: dueAmount
                    }));
                  }}
                  disabled={paymentFormMode === "edit"}
                >
                  <SelectTrigger id="feeStructureId">
                    <SelectValue placeholder="Select a fee structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Use a Set to filter out duplicate fee structures */}
                    {pendingFees?.reduce((unique, fee) => {
                      // Use both feeStructureId and feeName to create a unique key
                      const key = `${fee.feeStructureId}-${fee.feeName}`;
                      
                      // Check if we've already added this fee structure
                      if (!unique.some(item => `${item.feeStructureId}-${item.feeName}` === key)) {
                        unique.push(fee);
                      }
                      return unique;
                    }, [] as any[]).map((fee) => (
                      <SelectItem 
                        key={`fee-${fee.feeStructureId}`}
                        value={fee.feeStructureId.toString()}
                      >
                        {fee.feeName} - {formatCurrency(parseFloat(fee.dueAmount))}
                        {fee.studentId === null && " (Unassigned)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show student selection only if the fee structure is not unassigned */}
              {!paymentFormData.isUnassignedFeeStructure && (
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student</Label>
                  <Select 
                    value={paymentFormData.studentId.toString()} 
                    onValueChange={(value) => {
                      setPaymentFormData(prev => ({
                        ...prev,
                        studentId: parseInt(value)
                      }));
                    }}
                    disabled={paymentFormMode === "edit" || paymentFormData.isUnassignedFeeStructure}
                  >
                    <SelectTrigger id="studentId">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={handlePaymentInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">{currencySymbol}</span>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentFormData.amount}
                      onChange={(e) => {
                        const amount = e.target.value;
                        const discountAmount = paymentFormData.discountAmount || "0";
                        const miscAmount = paymentFormData.miscAmount || "0";
                        
                        // Calculate total amount: amount - discount + misc
                        const totalAmount = (
                          parseFloat(amount || "0") - 
                          parseFloat(discountAmount) + 
                          parseFloat(miscAmount)
                        ).toFixed(2);
                        
                        setPaymentFormData(prev => ({
                          ...prev,
                          amount,
                          totalAmount
                        }));
                      }}
                      className="pl-7"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Discount Amount</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">{currencySymbol}</span>
                    <Input
                      id="discountAmount"
                      name="discountAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentFormData.discountAmount}
                      onChange={(e) => {
                        const discountAmount = e.target.value;
                        const amount = paymentFormData.amount || "0";
                        const miscAmount = paymentFormData.miscAmount || "0";
                        
                        // Calculate total amount: amount - discount + misc
                        const totalAmount = (
                          parseFloat(amount) - 
                          parseFloat(discountAmount || "0") + 
                          parseFloat(miscAmount)
                        ).toFixed(2);
                        
                        setPaymentFormData(prev => ({
                          ...prev,
                          discountAmount,
                          totalAmount
                        }));
                      }}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="miscAmount">Misc Amount</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">{currencySymbol}</span>
                    <Input
                      id="miscAmount"
                      name="miscAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentFormData.miscAmount}
                      onChange={(e) => {
                        const miscAmount = e.target.value;
                        const amount = paymentFormData.amount || "0";
                        const discountAmount = paymentFormData.discountAmount || "0";
                        
                        // Calculate total amount: amount - discount + misc
                        const totalAmount = (
                          parseFloat(amount) - 
                          parseFloat(discountAmount) + 
                          parseFloat(miscAmount || "0")
                        ).toFixed(2);
                        
                        setPaymentFormData(prev => ({
                          ...prev,
                          miscAmount,
                          totalAmount
                        }));
                      }}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">{currencySymbol}</span>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      type="number"
                      value={paymentFormData.totalAmount}
                      className="pl-7 bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select 
                    value={paymentFormData.paymentMethod} 
                    onValueChange={(value) => {
                      setPaymentFormData(prev => ({
                        ...prev,
                        paymentMethod: value
                      }));
                    }}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">Receipt Number</Label>
                  <Input
                    id="receiptNumber"
                    name="receiptNumber"
                    value={paymentFormData.receiptNumber}
                    onChange={handlePaymentInputChange}
                    placeholder="e.g., RC-001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={paymentFormData.notes}
                  onChange={handlePaymentInputChange}
                  placeholder="Any additional notes about this payment..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPaymentFormOpen(false);
                  resetPaymentForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addPaymentMutation.isPending || updatePaymentMutation.isPending}
              >
                {paymentFormMode === "add" ? "Record Payment" : "Update Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reminder Form Dialog */}
      <Dialog open={isReminderFormOpen} onOpenChange={setIsReminderFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {reminderFormMode === "add" ? "Create Payment Reminder" : "Edit Payment Reminder"}
            </DialogTitle>
            <DialogDescription>
              {reminderFormMode === "add" 
                ? "Create a new payment reminder for a student." 
                : "Update the details of this payment reminder."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReminderSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student</Label>
                <Select 
                  value={reminderFormData.studentId.toString()} 
                  onValueChange={(value) => {
                    setReminderFormData(prev => ({
                      ...prev,
                      studentId: parseInt(value)
                    }));
                  }}
                >
                  <SelectTrigger id="studentId">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeStructureId">Fee Structure</Label>
                <Select 
                  value={reminderFormData.feeStructureId.toString()} 
                  onValueChange={(value) => {
                    setReminderFormData(prev => ({
                      ...prev,
                      feeStructureId: parseInt(value)
                    }));
                  }}
                >
                  <SelectTrigger id="feeStructureId">
                    <SelectValue placeholder="Select a fee structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Filter fees for the selected student and eliminate duplicates */}
                    {pendingFees?.filter(fee => fee.studentId === reminderFormData.studentId)
                      .reduce((unique, fee) => {
                        // Use both feeStructureId and feeName to create a unique key
                        const key = `${fee.feeStructureId}-${fee.feeName}`;
                        
                        // Check if we've already added this fee structure
                        if (!unique.some(item => `${item.feeStructureId}-${item.feeName}` === key)) {
                          unique.push(fee);
                        }
                        return unique;
                      }, [] as any[])
                      .map((fee) => (
                        <SelectItem 
                          key={`reminder-fee-${fee.feeStructureId}`}
                          value={fee.feeStructureId.toString()}
                        >
                          {fee.feeName} - {formatCurrency(parseFloat(fee.dueAmount))} ({fee.status})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Reminder Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={reminderFormData.message}
                  onChange={handleReminderInputChange}
                  placeholder="Enter reminder message..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={reminderFormData.status} 
                  onValueChange={(value) => {
                    setReminderFormData(prev => ({
                      ...prev,
                      status: value
                    }));
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsReminderFormOpen(false);
                  resetReminderForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={addReminderMutation.isPending || updateReminderMutation.isPending}
              >
                {reminderFormMode === "add" ? "Create Reminder" : "Update Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}