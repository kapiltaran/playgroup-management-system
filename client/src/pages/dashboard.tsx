import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format, subDays } from "date-fns";
import { Link } from "wouter";
import { 
  UsersIcon, 
  DollarSignIcon, 
  PackageIcon, 
  AlertCircleIcon, 
  ArrowUpIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { StudentForm } from "@/components/students/student-form";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import type { Activity, Student, Expense } from "@shared/schema";

export default function Dashboard() {
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [expenseChartData, setExpenseChartData] = useState<{ name: string; value: number }[]>([]);

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    select: (data) => data.slice(0, 5),
  });

  // Fetch recent students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    select: (data) => data.slice(0, 3),
  });

  // Fetch recent expenses
  const { data: expenses, isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    select: (data) => data.slice(0, 3),
  });

  // Fetch expense report data for chart
  const { data: expenseReportData, isLoading: isLoadingExpenseReport } = useQuery<any[]>({
    queryKey: ["/api/reports/expenses"],
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: (newStudent: any) => 
      apiRequest("POST", "/api/students", newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsStudentFormOpen(false);
    },
  });

  // Process expense report data for chart
  useEffect(() => {
    if (expenseReportData) {
      const formattedData = expenseReportData.map(item => ({
        name: item.category,
        value: parseFloat(item.amount),
      }));
      setExpenseChartData(formattedData);
    }
  }, [expenseReportData]);

  // Helper to format date relative to now
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    } else {
      return format(date, "MMM d, yyyy");
    }
  };

  // Status badge
  const renderStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    } else if (status === "on_leave") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          On Leave
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Inactive
        </Badge>
      );
    }
  };

  // Category badge
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

  const renderStudentInitials = (fullName: string) => {
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Button onClick={() => setIsStudentFormOpen(true)}>
          <UsersIcon className="mr-2 h-4 w-4" /> Add New Student
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          value={isLoadingStats ? "Loading..." : stats?.totalStudents || 0}
          icon={<UsersIcon className="h-6 w-6 text-primary" />}
          change={{
            value: <><ArrowUpIcon className="h-3 w-3 mr-1" />12%</>,
            type: "increase",
            text: "vs last month"
          }}
        />
        <StatCard
          title="Monthly Expenses"
          value={isLoadingStats ? "Loading..." : `$${stats?.monthlyExpenses?.toFixed(2) || "0.00"}`}
          icon={<DollarSignIcon className="h-6 w-6 text-secondary" />}
          change={{
            value: <><ArrowUpIcon className="h-3 w-3 mr-1" />8%</>,
            type: "decrease",
            text: "vs last month"
          }}
          className="border-secondary"
        />
        <StatCard
          title="Inventory Items"
          value={isLoadingStats ? "Loading..." : stats?.totalInventoryItems || 0}
          icon={<PackageIcon className="h-6 w-6 text-success" />}
          change={{
            value: <><ArrowUpIcon className="h-3 w-3 mr-1" />4%</>,
            type: "increase",
            text: "vs last month"
          }}
          className="border-success"
        />
        <StatCard
          title="Low Stock Items"
          value={isLoadingStats ? "Loading..." : stats?.lowStockItems || 0}
          icon={<AlertCircleIcon className="h-6 w-6 text-warning" />}
          change={{
            value: "Requires attention",
            type: "neutral"
          }}
          className="border-warning"
        />
      </div>

      {/* Charts and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ExpenseChart 
          data={expenseChartData}
          isLoading={isLoadingExpenseReport}
          className="lg:col-span-2"
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-2 max-h-80 overflow-y-auto">
              {isLoadingActivities ? (
                <p className="text-center py-4 text-gray-500">Loading activities...</p>
              ) : activities && activities.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {activities.map((activity) => {
                    let title = '';
                    const details = activity.details as any;
                    
                    if (activity.type === 'student') {
                      title = details.name;
                    } else if (activity.type === 'expense') {
                      title = `${details.description} ($${details.amount})`;
                    } else if (activity.type === 'inventory') {
                      title = `${details.name} (${details.quantity})`;
                    }
                    
                    return (
                      <ActivityItem
                        key={activity.id}
                        type={activity.type as any}
                        action={activity.action as any}
                        title={title}
                        timestamp={formatRelativeDate(activity.timestamp.toString())}
                      />
                    );
                  })}
                </ul>
              ) : (
                <p className="text-center py-4 text-gray-500">No recent activities</p>
              )}
            </div>
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <Link href="/reports">
                <a className="text-sm text-primary hover:text-primary-dark font-medium flex items-center justify-center">
                  View all activity
                  <ArrowUpIcon className="ml-1 h-4 w-4 rotate-90" />
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students and Expenses section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold">Recent Students</CardTitle>
            <Link href="/students">
              <a className="text-sm text-primary font-medium">View all</a>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={students || []}
              isLoading={isLoadingStudents}
              columns={[
                {
                  accessorKey: "fullName",
                  header: "Name",
                  cell: (student) => (
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 bg-gray-200 text-gray-500">
                        <AvatarFallback>
                          {renderStudentInitials(student.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-sm text-gray-500">ID: ST-{student.id.toString().padStart(3, '0')}</div>
                      </div>
                    </div>
                  )
                },
                {
                  accessorKey: "age",
                  header: "Age",
                  cell: (student) => (
                    <div className="text-sm text-gray-900">{student.age} years</div>
                  )
                },
                {
                  accessorKey: "guardianName",
                  header: "Guardian",
                  cell: (student) => (
                    <>
                      <div className="text-sm text-gray-900">{student.guardianName}</div>
                      <div className="text-sm text-gray-500">{student.phone}</div>
                    </>
                  )
                },
                {
                  accessorKey: "status",
                  header: "Status",
                  cell: (student) => renderStatusBadge(student.status)
                }
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold">Recent Expenses</CardTitle>
            <Link href="/expenses">
              <a className="text-sm text-primary font-medium">View all</a>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              data={expenses || []}
              isLoading={isLoadingExpenses}
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
                }
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Student Form Modal */}
      <StudentForm
        isOpen={isStudentFormOpen}
        onClose={() => setIsStudentFormOpen(false)}
        onSubmit={(data) => addStudentMutation.mutate(data)}
        isSubmitting={addStudentMutation.isPending}
      />
    </div>
  );
}
