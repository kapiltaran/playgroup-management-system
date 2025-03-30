import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStudentSchema, 
  insertExpenseSchema, 
  insertInventorySchema,
  insertActivitySchema,
  insertClassSchema,
  insertFeeStructureSchema,
  insertFeeInstallmentSchema,
  insertFeePaymentSchema,
  insertReminderSchema,
  insertSettingsSchema
} from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Student routes
  app.get("/api/students", async (req: Request, res: Response) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req: Request, res: Response) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/students/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertStudentSchema.partial().parse(req.body);
      
      const updatedStudent = await storage.updateStudent(id, updates);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/students/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.getExpense(id);
      
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertExpenseSchema.partial().parse(req.body);
      
      const updatedExpense = await storage.updateExpense(id, updates);
      
      if (!updatedExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.json(updatedExpense);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req: Request, res: Response) => {
    try {
      const inventoryItems = await storage.getInventoryItems();
      res.json(inventoryItems);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  app.post("/api/inventory", async (req: Request, res: Response) => {
    try {
      const itemData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertInventorySchema.partial().parse(req.body);
      
      const updatedItem = await storage.updateInventoryItem(id, updates);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const students = await storage.getStudents();
      const expenses = await storage.getExpenses();
      const inventoryItems = await storage.getInventoryItems();
      
      // Calculate monthly expenses
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() + 1 === currentMonth && 
                 expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + parseFloat(expense.amount as string), 0);
      
      // Find low stock items
      const lowStockItems = inventoryItems.filter(item => item.quantity < item.minQuantity);
      
      res.json({
        totalStudents: students.length,
        monthlyExpenses,
        totalInventoryItems: inventoryItems.length,
        lowStockItems: lowStockItems.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports routes
  app.get("/api/reports/expenses", async (req: Request, res: Response) => {
    try {
      const expenses = await storage.getExpenses();
      
      // Group expenses by category
      const expensesByCategory: Record<string, number> = {};
      expenses.forEach(expense => {
        const category = expense.category;
        const amount = parseFloat(expense.amount as string);
        expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
      });
      
      // Prepare data for chart
      const chartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount,
      }));
      
      res.json(chartData);
    } catch (error) {
      console.error("Error generating expense report:", error);
      res.status(500).json({ message: "Failed to generate expense report" });
    }
  });

  // Export routes
  app.get("/api/export/students", async (req: Request, res: Response) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error exporting students:", error);
      res.status(500).json({ message: "Failed to export students" });
    }
  });

  app.get("/api/export/expenses", async (req: Request, res: Response) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error exporting expenses:", error);
      res.status(500).json({ message: "Failed to export expenses" });
    }
  });

  app.get("/api/export/inventory", async (req: Request, res: Response) => {
    try {
      const inventory = await storage.getInventoryItems();
      res.json(inventory);
    } catch (error) {
      console.error("Error exporting inventory:", error);
      res.status(500).json({ message: "Failed to export inventory" });
    }
  });

  // Fee Management API Routes
  
  // Classes API
  app.get("/api/classes", async (req: Request, res: Response) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  
  app.get("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(classItem);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ message: "Failed to fetch class" });
    }
  });
  
  app.post("/api/classes", async (req: Request, res: Response) => {
    try {
      const insertData = insertClassSchema.parse(req.body);
      const classItem = await storage.createClass(insertData);
      res.status(201).json(classItem);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const updateData = insertClassSchema.partial().parse(req.body);
      const updatedClass = await storage.updateClass(classId, updateData);
      
      if (!updatedClass) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(updatedClass);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/classes/:id", async (req: Request, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const success = await storage.deleteClass(classId);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete class. It may have students assigned or fee structures associated with it." 
        });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ message: "Failed to delete class" });
    }
  });
  
  // Fee Structures API
  app.get("/api/fee-structures", async (req: Request, res: Response) => {
    try {
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      
      let feeStructures;
      if (classId && !isNaN(classId)) {
        feeStructures = await storage.getFeeStructuresByClass(classId);
      } else {
        feeStructures = await storage.getFeeStructures();
      }
      
      res.json(feeStructures);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      res.status(500).json({ message: "Failed to fetch fee structures" });
    }
  });
  
  app.get("/api/fee-structures/:id", async (req: Request, res: Response) => {
    try {
      const feeStructureId = parseInt(req.params.id);
      if (isNaN(feeStructureId)) {
        return res.status(400).json({ message: "Invalid fee structure ID" });
      }
      
      const feeStructure = await storage.getFeeStructure(feeStructureId);
      if (!feeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }
      
      res.json(feeStructure);
    } catch (error) {
      console.error("Error fetching fee structure:", error);
      res.status(500).json({ message: "Failed to fetch fee structure" });
    }
  });
  
  app.post("/api/fee-structures", async (req: Request, res: Response) => {
    try {
      const insertData = insertFeeStructureSchema.parse(req.body);
      const feeStructure = await storage.createFeeStructure(insertData);
      res.status(201).json(feeStructure);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/fee-structures/:id", async (req: Request, res: Response) => {
    try {
      const feeStructureId = parseInt(req.params.id);
      if (isNaN(feeStructureId)) {
        return res.status(400).json({ message: "Invalid fee structure ID" });
      }
      
      const updateData = insertFeeStructureSchema.partial().parse(req.body);
      const updatedFeeStructure = await storage.updateFeeStructure(feeStructureId, updateData);
      
      if (!updatedFeeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }
      
      res.json(updatedFeeStructure);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/fee-structures/:id", async (req: Request, res: Response) => {
    try {
      const feeStructureId = parseInt(req.params.id);
      if (isNaN(feeStructureId)) {
        return res.status(400).json({ message: "Invalid fee structure ID" });
      }
      
      const success = await storage.deleteFeeStructure(feeStructureId);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete fee structure. It may be in use by students or have installments associated with it." 
        });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      res.status(500).json({ message: "Failed to delete fee structure" });
    }
  });
  
  // Fee Installments API
  app.get("/api/fee-installments", async (req: Request, res: Response) => {
    try {
      const feeStructureId = req.query.feeStructureId ? parseInt(req.query.feeStructureId as string) : undefined;
      const installments = await storage.getFeeInstallments(feeStructureId);
      res.json(installments);
    } catch (error) {
      console.error("Error fetching fee installments:", error);
      res.status(500).json({ message: "Failed to fetch fee installments" });
    }
  });
  
  app.get("/api/fee-installments/:id", async (req: Request, res: Response) => {
    try {
      const installmentId = parseInt(req.params.id);
      if (isNaN(installmentId)) {
        return res.status(400).json({ message: "Invalid installment ID" });
      }
      
      const installment = await storage.getFeeInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ message: "Fee installment not found" });
      }
      
      res.json(installment);
    } catch (error) {
      console.error("Error fetching fee installment:", error);
      res.status(500).json({ message: "Failed to fetch fee installment" });
    }
  });
  
  app.post("/api/fee-installments", async (req: Request, res: Response) => {
    try {
      const insertData = insertFeeInstallmentSchema.parse(req.body);
      const installment = await storage.createFeeInstallment(insertData);
      res.status(201).json(installment);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/fee-installments/:id", async (req: Request, res: Response) => {
    try {
      const installmentId = parseInt(req.params.id);
      if (isNaN(installmentId)) {
        return res.status(400).json({ message: "Invalid installment ID" });
      }
      
      const updateData = insertFeeInstallmentSchema.partial().parse(req.body);
      const updatedInstallment = await storage.updateFeeInstallment(installmentId, updateData);
      
      if (!updatedInstallment) {
        return res.status(404).json({ message: "Fee installment not found" });
      }
      
      res.json(updatedInstallment);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/fee-installments/:id", async (req: Request, res: Response) => {
    try {
      const installmentId = parseInt(req.params.id);
      if (isNaN(installmentId)) {
        return res.status(400).json({ message: "Invalid installment ID" });
      }
      
      const success = await storage.deleteFeeInstallment(installmentId);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete installment. It may have payments or reminders associated with it." 
        });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting fee installment:", error);
      res.status(500).json({ message: "Failed to delete fee installment" });
    }
  });
  
  // Fee Payments API
  app.get("/api/fee-payments", async (req: Request, res: Response) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const installmentId = req.query.installmentId ? parseInt(req.query.installmentId as string) : undefined;
      
      const payments = await storage.getFeePayments(studentId, installmentId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching fee payments:", error);
      res.status(500).json({ message: "Failed to fetch fee payments" });
    }
  });
  
  app.get("/api/fee-payments/:id", async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      const payment = await storage.getFeePayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Fee payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      console.error("Error fetching fee payment:", error);
      res.status(500).json({ message: "Failed to fetch fee payment" });
    }
  });
  
  app.post("/api/fee-payments", async (req: Request, res: Response) => {
    try {
      const insertData = insertFeePaymentSchema.parse(req.body);
      const payment = await storage.createFeePayment(insertData);
      res.status(201).json(payment);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/fee-payments/:id", async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      const updateData = insertFeePaymentSchema.partial().parse(req.body);
      const updatedPayment = await storage.updateFeePayment(paymentId, updateData);
      
      if (!updatedPayment) {
        return res.status(404).json({ message: "Fee payment not found" });
      }
      
      res.json(updatedPayment);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/fee-payments/:id", async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }
      
      const success = await storage.deleteFeePayment(paymentId);
      
      if (!success) {
        return res.status(404).json({ message: "Fee payment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting fee payment:", error);
      res.status(500).json({ message: "Failed to delete fee payment" });
    }
  });
  
  // Reminders API
  app.get("/api/reminders", async (req: Request, res: Response) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const reminders = await storage.getReminders(studentId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });
  
  app.get("/api/reminders/:id", async (req: Request, res: Response) => {
    try {
      const reminderId = parseInt(req.params.id);
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: "Invalid reminder ID" });
      }
      
      const reminder = await storage.getReminder(reminderId);
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      res.json(reminder);
    } catch (error) {
      console.error("Error fetching reminder:", error);
      res.status(500).json({ message: "Failed to fetch reminder" });
    }
  });
  
  app.post("/api/reminders", async (req: Request, res: Response) => {
    try {
      const insertData = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(insertData);
      res.status(201).json(reminder);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/reminders/:id", async (req: Request, res: Response) => {
    try {
      const reminderId = parseInt(req.params.id);
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: "Invalid reminder ID" });
      }
      
      const updateData = insertReminderSchema.partial().parse(req.body);
      const updatedReminder = await storage.updateReminder(reminderId, updateData);
      
      if (!updatedReminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      res.json(updatedReminder);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/reminders/:id", async (req: Request, res: Response) => {
    try {
      const reminderId = parseInt(req.params.id);
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: "Invalid reminder ID" });
      }
      
      const success = await storage.deleteReminder(reminderId);
      
      if (!success) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });
  
  // Fee Reports
  app.get("/api/fee-reports/pending", async (req: Request, res: Response) => {
    try {
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      const pendingFees = await storage.getPendingFees(classId);
      res.json(pendingFees);
    } catch (error) {
      console.error("Error fetching pending fees:", error);
      res.status(500).json({ message: "Failed to fetch pending fees" });
    }
  });
  
  app.get("/api/fee-reports/daily", async (req: Request, res: Response) => {
    try {
      const dateStr = req.query.date as string;
      if (!dateStr) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const report = await storage.getDailyFeeCollection(date);
      res.json(report);
    } catch (error) {
      console.error("Error fetching daily fee collection:", error);
      res.status(500).json({ message: "Failed to fetch daily fee collection" });
    }
  });
  
  app.get("/api/fee-reports/monthly", async (req: Request, res: Response) => {
    try {
      const yearStr = req.query.year as string;
      const monthStr = req.query.month as string;
      
      if (!yearStr || !monthStr) {
        return res.status(400).json({ message: "Year and month parameters are required" });
      }
      
      const year = parseInt(yearStr);
      // Month is 0-based in JavaScript Date (0 = January, 11 = December)
      const month = parseInt(monthStr) - 1;
      
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ message: "Invalid year or month format" });
      }
      
      const report = await storage.getMonthlyFeeCollection(year, month);
      res.json(report);
    } catch (error) {
      console.error("Error fetching monthly fee collection:", error);
      res.status(500).json({ message: "Failed to fetch monthly fee collection" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      const insertData = insertSettingsSchema.parse(req.body);
      const setting = await storage.createOrUpdateSetting(insertData);
      res.status(201).json(setting);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.delete("/api/settings/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid setting ID" });
      }
      
      const success = await storage.deleteSetting(id);
      
      if (!success) {
        return res.status(404).json({ message: "Setting not found or cannot be deleted" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
