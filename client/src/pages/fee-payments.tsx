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
import type { Student, FeeInstallment, FeePayment, Reminder } from "@shared/schema";

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
  const [activeTab, setActiveTab] = useState("payments");
  
  // Payment state
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentFormMode, setPaymentFormMode] = useState<"add" | "edit">("add");
  const [currentPayment, setCurrentPayment] = useState<FeePayment | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    studentId: 0,
    installmentId: 0,
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    paymentMethod: "Cash",
    receiptNumber: "",
    notes: ""
  });

  // Reminder state
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);
  const [reminderFormMode, setReminderFormMode] = useState<"add" | "edit">("add");
  const [currentReminder, setCurrentReminder] = useState<Reminder | null>(null);
  const [reminderFormData, setReminderFormData] = useState({
    studentId: 0,
    installmentId: 0,
    message: "",
    status: "pending"
  });

  // Fetch students for dropdown
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch all fee installments
  const { data: installments } = useQuery<FeeInstallment[]>({
    queryKey: ["/api/fee-installments"],
  });

  // Fetch pending fees (overdue and upcoming)
  const { data: pendingFees, isLoading: isLoadingPendingFees } = useQuery({
    queryKey: ["/api/fee-reports/pending"],
  });

  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery<FeePayment[]>({
    queryKey: ["/api/fee-payments"],
  });

  // Fetch reminders
  const { data: reminders, isLoading: isLoadingReminders } = useQuery<Reminder[]>({
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
      installmentId: 0,
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      amount: "",
      paymentMethod: "Cash",
      receiptNumber: "",
      notes: ""
    });
    setCurrentPayment(null);
  };

  // Reset reminder form
  const resetReminderForm = () => {
    setReminderFormData({
      studentId: 0,
      installmentId: 0,
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
      installmentId: payment.installmentId,
      paymentDate: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber || "",
      notes: payment.notes || ""
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
    
    const formDataToSubmit = {
      ...paymentFormData,
      amount: paymentFormData.amount.toString()
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
    
    if (name === "studentId" || name === "installmentId") {
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
      installmentId: reminder.installmentId,
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
    
    if (name === "studentId" || name === "installmentId") {
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

  const getInstallmentName = (installmentId: number) => {
    const installment = installments?.find(i => i.id === installmentId);
    return installment ? installment.name : "Unknown Installment";
  };

  // Prepare payment receipt number
  useEffect(() => {
    if (paymentFormMode === "add" && !paymentFormData.receiptNumber) {
      const nextId = (payments?.length || 0) + 1;
      setPaymentFormData(prev => ({
        ...prev,
        receiptNumber: `RC-${nextId.toString().padStart(3, '0')}`
      }));
    }
  }, [paymentFormMode, payments?.length, paymentFormData.receiptNumber]);

  // Auto-populate reminder message
  useEffect(() => {
    if (reminderFormMode === "add" && reminderFormData.studentId && reminderFormData.installmentId) {
      const selectedFee = pendingFees?.find(
        fee => fee.studentId === reminderFormData.studentId && 
               fee.installmentId === reminderFormData.installmentId
      );
      
      if (selectedFee) {
        const studentName = getStudentName(selectedFee.studentId);
        const installmentName = selectedFee.installmentName;
        const dueAmount = parseFloat(selectedFee.dueAmount).toFixed(2);
        const dueDate = format(new Date(selectedFee.dueDate), "MMMM d, yyyy");
        
        let defaultMessage = "";
        if (selectedFee.status === "overdue") {
          defaultMessage = `Dear ${studentName}'s Parents,\n\nThis is a friendly reminder that your ${installmentName} payment of $${dueAmount} was due on ${dueDate} and is currently overdue. Please make the payment as soon as possible.\n\nThank you.`;
        } else {
          defaultMessage = `Dear ${studentName}'s Parents,\n\nThis is a friendly reminder that your ${installmentName} payment of $${dueAmount} is due on ${dueDate}. Please ensure timely payment to avoid any late fees.\n\nThank you.`;
        }
        
        setReminderFormData(prev => ({
          ...prev,
          message: defaultMessage
        }));
      }
    }
  }, [reminderFormMode, reminderFormData.studentId, reminderFormData.installmentId, pendingFees]);

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
        <h1 className="text-2xl font-bold text-gray-900">Fee Payments</h1>
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
                  accessorKey: "installmentName",
                  header: "Installment",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{item.installmentName}</div>
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
                    <div className="text-sm text-gray-900">${parseFloat(item.totalAmount).toFixed(2)}</div>
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
                    <div className="text-sm font-medium text-red-600">${parseFloat(item.dueAmount).toFixed(2)}</div>
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
                            installmentId: item.installmentId,
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
                          setPaymentFormData(prev => ({
                            ...prev,
                            studentId: item.studentId,
                            installmentId: item.installmentId,
                            amount: item.dueAmount.toString()
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
              data={payments || []}
              isLoading={isLoadingPayments}
              searchKey="receiptNumber"
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
                  accessorKey: "installmentId",
                  header: "Installment",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{getInstallmentName(item.installmentId)}</div>
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
                    <div className="text-sm text-gray-900">${parseFloat(item.amount).toFixed(2)}</div>
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
              data={reminders || []}
              isLoading={isLoadingReminders}
              columns={[
                {
                  accessorKey: "studentId",
                  header: "Student",
                  cell: (item) => (
                    <div className="text-sm font-medium text-gray-900">{getStudentName(item.studentId)}</div>
                  )
                },
                {
                  accessorKey: "installmentId",
                  header: "Installment",
                  cell: (item) => (
                    <div className="text-sm text-gray-700">{getInstallmentName(item.installmentId)}</div>
                  )
                },
                {
                  accessorKey: "createdAt",
                  header: "Created",
                  cell: (item) => (
                    <div className="text-sm text-gray-500">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
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
                <Label htmlFor="studentId">Student</Label>
                <Select 
                  value={paymentFormData.studentId.toString()} 
                  onValueChange={(value) => {
                    setPaymentFormData(prev => ({
                      ...prev,
                      studentId: parseInt(value)
                    }));
                  }}
                  disabled={paymentFormMode === "edit"}
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
                <Label htmlFor="installmentId">Fee Installment</Label>
                <Select 
                  value={paymentFormData.installmentId.toString()} 
                  onValueChange={(value) => {
                    setPaymentFormData(prev => ({
                      ...prev,
                      installmentId: parseInt(value)
                    }));
                  }}
                  disabled={paymentFormMode === "edit"}
                >
                  <SelectTrigger id="installmentId">
                    <SelectValue placeholder="Select an installment" />
                  </SelectTrigger>
                  <SelectContent>
                    {installments?.map((installment) => (
                      <SelectItem key={installment.id} value={installment.id.toString()}>
                        {getInstallmentName(installment.id)} - ${parseFloat(installment.amount).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentFormData.amount}
                      onChange={handlePaymentInputChange}
                      className="pl-7"
                      placeholder="0.00"
                      required
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
                <Label htmlFor="installmentId">Fee Installment</Label>
                <Select 
                  value={reminderFormData.installmentId.toString()} 
                  onValueChange={(value) => {
                    setReminderFormData(prev => ({
                      ...prev,
                      installmentId: parseInt(value)
                    }));
                  }}
                >
                  <SelectTrigger id="installmentId">
                    <SelectValue placeholder="Select an installment" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingFees?.map((fee) => (
                      <SelectItem 
                        key={`${fee.studentId}-${fee.installmentId}`} 
                        value={fee.installmentId.toString()}
                        disabled={fee.studentId !== reminderFormData.studentId}
                      >
                        {fee.installmentName} - ${parseFloat(fee.dueAmount).toFixed(2)} ({fee.status})
                      </SelectItem>
                    ))}
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