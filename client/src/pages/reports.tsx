import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  BarChart3Icon, 
  DownloadIcon,
  UsersIcon,
  DollarSignIcon,
  PackageIcon,
  BanknoteIcon,
  CalendarIcon,
  ReceiptText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Student, Expense, Inventory } from "@shared/schema";

// Chart colors
const CHART_COLORS = [
  "#4F46E5", // primary
  "#EC4899", // secondary
  "#10B981", // success
  "#FBBF24", // warning
  "#EF4444", // error
  "#8B5CF6", // purple
  "#3B82F6", // blue
  "#F97316", // orange
  "#06B6D4", // cyan
  "#14B8A6", // teal
];

export default function Reports() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("all");
  const [activeTab, setActiveTab] = useState("expenses");

  // Fetch expense data
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Fetch student data
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch inventory data
  const { data: inventory, isLoading: isLoadingInventory } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });
  
  // Fetch expense report data
  const { data: expenseReportData } = useQuery<any[]>({
    queryKey: ["/api/reports/expenses"],
  });

  // Process expense data for charts
  const getExpenseChartData = () => {
    if (!expenses) return [];
    
    // Filter data by time range
    const filterData = () => {
      if (timeRange === "all") return expenses;
      
      const currentDate = new Date();
      let fromDate = new Date();
      
      if (timeRange === "30") {
        fromDate.setDate(currentDate.getDate() - 30);
      } else if (timeRange === "90") {
        fromDate.setDate(currentDate.getDate() - 90);
      } else if (timeRange === "7") {
        fromDate.setDate(currentDate.getDate() - 7);
      }
      
      return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= fromDate;
      });
    };
    
    const filteredExpenses = filterData();
    
    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category;
      const amount = parseFloat(expense.amount as string);
      expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
    });
    
    // Convert to array for chart
    return Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  };

  // Process inventory data for charts
  const getInventoryChartData = () => {
    if (!inventory) return [];
    
    // Group inventory by category
    const inventoryByCategory: Record<string, number> = {};
    inventory.forEach(item => {
      const category = item.category;
      inventoryByCategory[category] = (inventoryByCategory[category] || 0) + 1;
    });
    
    // Convert to array for chart
    return Object.entries(inventoryByCategory).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Process student data for charts
  const getStudentChartData = () => {
    if (!students) return [];
    
    // Group students by status
    const studentsByStatus: Record<string, number> = {};
    students.forEach(student => {
      const status = student.status;
      studentsByStatus[status] = (studentsByStatus[status] || 0) + 1;
    });
    
    // Convert to array for chart
    return Object.entries(studentsByStatus).map(([name, value]) => ({
      name: name === "active" ? "Active" : name === "inactive" ? "Inactive" : "On Leave",
      value,
    }));
  };

  // Get low stock inventory items
  const getLowStockItems = () => {
    if (!inventory) return [];
    
    return inventory.filter(item => item.quantity <= item.minQuantity);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="font-medium">{`${label || payload[0].name}`}</p>
          {activeTab === "expenses" ? (
            <p className="text-primary">{`$${payload[0].value}`}</p>
          ) : (
            <p className="text-primary">{`${payload[0].value}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Export data
  const exportData = async (type: "students" | "expenses" | "inventory") => {
    try {
      const response = await fetch(`/api/export/${type}`);
      const data = await response.json();
      
      // Define headers and format data based on type
      let headers: string[] = [];
      let formattedData: any[] = [];
      
      if (type === "students") {
        headers = ["ID", "Name", "Date of Birth", "Age", "Gender", "Guardian", "Phone", "Email", "Address", "Status", "Notes"];
        formattedData = data.map((student: Student) => [
          student.id,
          `"${student.fullName}"`,
          student.dateOfBirth,
          student.age,
          `"${student.gender}"`,
          `"${student.guardianName}"`,
          `"${student.phone}"`,
          `"${student.email || ''}"`,
          `"${student.address || ''}"`,
          `"${student.status}"`,
          `"${student.notes || ''}"`
        ]);
      } else if (type === "expenses") {
        headers = ["ID", "Description", "Amount", "Category", "Date", "Notes"];
        formattedData = data.map((expense: Expense) => [
          expense.id,
          `"${expense.description}"`,
          expense.amount,
          `"${expense.category}"`,
          expense.date,
          `"${expense.notes || ''}"`
        ]);
      } else {
        headers = ["ID", "Name", "Category", "Quantity", "Unit", "Min Quantity", "Notes"];
        formattedData = data.map((item: Inventory) => [
          item.id,
          `"${item.name}"`,
          `"${item.category}"`,
          item.quantity,
          `"${item.unit}"`,
          item.minQuantity,
          `"${item.notes || ''}"`
        ]);
      }
      
      // Convert to CSV
      const csvRows = [
        headers.join(','),
        ...formattedData.map(row => row.join(','))
      ];
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to export ${type} data`,
        variant: "destructive",
      });
    }
  };

  const expenseData = getExpenseChartData();
  const inventoryData = getInventoryChartData();
  const studentData = getStudentChartData();
  const lowStockItems = getLowStockItems();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => exportData(activeTab as any)}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Export {activeTab}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <DollarSignIcon className="h-4 w-4" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <PackageIcon className="h-4 w-4" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <BanknotesIcon className="h-4 w-4" /> Fees
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingExpenses ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : expenseData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>No expense data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Expense Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingExpenses ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : expenseData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>No expense data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={expenseData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 40,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={70}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#4F46E5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${isLoadingExpenses ? "..." : 
                        expenses?.reduce((sum, expense) => 
                          sum + parseFloat(expense.amount as string), 0).toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Average per Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${isLoadingExpenses ? "..." : 
                        (expenses?.length ? 
                          (expenses.reduce((sum, expense) => 
                            sum + parseFloat(expense.amount as string), 0) / 
                            Math.max(1, Math.ceil(expenses.length / 30))).toFixed(2) : 
                          "0.00")}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Top Category</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingExpenses ? "..." : 
                        (expenseData.length ? 
                          expenseData.sort((a, b) => b.value - a.value)[0]?.name : 
                          "None")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInventory ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : inventoryData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>No inventory data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={inventoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {inventoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stock Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingInventory ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : inventory?.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>No inventory data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={lowStockItems.map(item => ({
                          name: item.name,
                          current: item.quantity,
                          minimum: item.minQuantity
                        }))}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 80,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 11 }}
                          width={80}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="current" name="Current Quantity" fill="#10B981" />
                        <Bar dataKey="minimum" name="Minimum Required" fill="#FBBF24" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Inventory Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingInventory ? "..." : inventory?.length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingInventory ? "..." : 
                        new Set(inventory?.map(item => item.category)).size || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Low Stock Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingInventory ? "..." : lowStockItems.length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Critical Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingInventory ? "..." : 
                        inventory?.filter(item => item.quantity <= item.minQuantity * 0.5).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="students">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Students by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : studentData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>No student data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {studentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Student Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>Loading chart data...</p>
                  </div>
                ) : !students?.length ? (
                  <div className="h-80 flex items-center justify-center">
                    <p>No student data available</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(() => {
                          const ageDistribution: Record<string, number> = {};
                          students?.forEach(student => {
                            const age = student.age?.toString() || 'Unknown';
                            ageDistribution[age] = (ageDistribution[age] || 0) + 1;
                          });
                          return Object.entries(ageDistribution).map(([name, value]) => ({
                            name,
                            value,
                          }));
                        })()}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Number of Students" fill="#4F46E5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Student Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingStudents ? "..." : students?.length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Active Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingStudents ? "..." : 
                        students?.filter(s => s.status === "active").length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">On Leave</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingStudents ? "..." : 
                        students?.filter(s => s.status === "on_leave").length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Average Age</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingStudents ? "..." : 
                        students?.length ? 
                          (students.reduce((sum, student) => sum + (student.age || 0), 0) / 
                            students.length).toFixed(1) : 
                          "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
