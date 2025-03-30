import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStudentSchema, 
  insertExpenseSchema, 
  insertInventorySchema,
  insertActivitySchema
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

  const httpServer = createServer(app);
  return httpServer;
}
