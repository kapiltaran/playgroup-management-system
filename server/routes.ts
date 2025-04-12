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
  insertFeePaymentSchema,
  insertReminderSchema,
  insertSettingsSchema,
  insertUserSchema,
  insertAttendanceSchema,
  insertAcademicYearSchema,
  insertBatchSchema,
  roleEnum
} from "@shared/schema";
import { ZodError, z } from "zod";
import { createUserFromStudent } from "./services/auth";
import { sendWelcomeEmail } from "./services/email";

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
  
  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if user is active
      if (!user.active) {
        return res.status(403).json({ message: "Your account is inactive. Please contact administrator." });
      }
      
      // In a real application, we would verify the password hash
      // For this demo, we'll check our simple hashed password
      const hashedPassword = `hashed_${password}`;
      
      console.log(`Login attempt for ${username} with password ${password}`);
      console.log(`Comparing: ${hashedPassword} with stored: ${user.passwordHash}`);
      
      if (user.passwordHash !== hashedPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Create a user session
      const session = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentId: user.studentId
      };
      
      // Store user in session
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        active: user.active,
        studentId: user.studentId
      };
      
      console.log(`User ${username} (${user.role}) logged in successfully and saved to session`);
      
      // Return user data (excluding password hash)
      const { passwordHash, ...userData } = user;
      res.json({ 
        message: "Login successful",
        user: userData
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "An error occurred during login" });
    }
  });
  
  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      // Check if the user is logged in
      const user = (req as any).user;
      if (user) {
        console.log(`User ${user.username} (${user.role}) logged out`);
      }
      
      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Error logging out" });
        }
        
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "An error occurred during logout" });
    }
  });
  
  // Current user endpoint - returns current authenticated user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });

  // Student routes
  app.get("/api/students", async (req: Request, res: Response) => {
    try {
      // Check if the request has a user property (from an auth middleware)
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get students based on the user's role
      console.log(`Getting students for user ID: ${user.id}, role: ${user.role}`);
      const students = await storage.getStudents(user.id);
      console.log(`Total students returned: ${students.length}`);
      
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
      
      // Check if the request has a user property (from an auth middleware)
      const user = (req as any).user;
      
      // If there's a logged-in user and they are a parent, check access
      if (user && user.role === 'parent') {
        // Get students this parent has access to
        const allowedStudents = await storage.getStudentsByParent(user.id);
        const hasAccess = allowedStudents.some(s => s.id === student.id);
        
        if (!hasAccess) {
          console.log(`Parent ${user.id} denied access to student ${id}`);
          return res.status(403).json({ message: "Access denied" });
        }
        
        console.log(`Parent ${user.id} granted access to student ${id}`);
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req: Request, res: Response) => {
    try {
      // Check user permission
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to create students
      const canCreate = await storage.checkPermission(user.role, 'students', 'create');
      if (!canCreate) {
        console.log(`User ${user.username} (${user.role}) denied permission to create student`);
        return res.status(403).json({ message: "You don't have permission to create students" });
      }
      
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      console.log("Created student with ID:", student.id);
      
      // Make sure we return the complete student object with ID
      if (!student || !student.id) {
        throw new Error("Student was created but no valid student object was returned");
      }
      
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      handleZodError(error, res);
    }
  });

  app.patch("/api/students/:id", async (req: Request, res: Response) => {
    try {
      // Check user permission
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to edit students
      const canEdit = await storage.checkPermission(user.role, 'students', 'edit');
      if (!canEdit) {
        console.log(`User ${user.username} (${user.role}) denied permission to edit student`);
        return res.status(403).json({ message: "You don't have permission to edit students" });
      }
      
      const id = parseInt(req.params.id);
      
      // For parents, check if they have access to this specific student
      if (user.role === 'parent') {
        const allowedStudents = await storage.getStudentsByParent(user.id);
        const hasAccess = allowedStudents.some(s => s.id === id);
        
        if (!hasAccess) {
          console.log(`Parent ${user.id} denied access to edit student ${id}`);
          return res.status(403).json({ message: "You don't have permission to edit this student" });
        }
      }
      
      const updates = z.object({
        fullName: z.string().optional(),
        dateOfBirth: z.string().optional(),
        age: z.number().optional().nullable(),
        gender: z.string().optional(),
        guardianName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        postalCode: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        status: z.string().optional(),
        classId: z.number().optional().nullable(),
        batchId: z.number().optional().nullable(),
        feeStructureId: z.number().optional().nullable(),
        notes: z.string().optional().nullable()
      }).parse(req.body);
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
      // Check user permission
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to delete students
      const canDelete = await storage.checkPermission(user.role, 'students', 'delete');
      if (!canDelete) {
        console.log(`User ${user.username} (${user.role}) denied permission to delete student`);
        return res.status(403).json({ message: "You don't have permission to delete students" });
      }
      
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
  
  // Create parent account from student ID


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
      const updates = z.object({
        description: z.string().optional(),
        amount: z.string().optional(),
        category: z.string().optional(),
        date: z.string().optional(),
        notes: z.string().optional().nullable()
      }).parse(req.body);
      
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
      const updates = z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        quantity: z.number().optional(),
        minQuantity: z.number().optional(),
        unitPrice: z.string().optional(),
        supplier: z.string().optional().nullable(),
        notes: z.string().optional().nullable()
      }).parse(req.body);
      
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
      const user = (req as any).user;
      const students = user ? await storage.getStudents(user.id) : await storage.getStudents();
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
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const students = await storage.getStudents(user.id);
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
      
      const updateData = z.object({
        name: z.string().optional(),
        academicYearId: z.number().optional(),
        ageGroup: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        capacity: z.number().optional().nullable(),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
        days: z.array(z.string()).optional().nullable()
      }).parse(req.body);
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
      
      // Auto-link this fee structure to all students in the corresponding class and academic year
      try {
        // Get all batches for this class and academic year
        const allBatches = await storage.getAllBatches();
        const matchingBatches = allBatches.filter(
          batch => batch.classId === insertData.classId && batch.academicYearId === insertData.academicYearId
        );
        
        if (matchingBatches.length > 0) {
          // Get all students in these batches 
          const batchIds = matchingBatches.map(batch => batch.id);
          const allStudents = await storage.getStudents();
          const affectedStudents = allStudents.filter(
            student => student.batchId !== null && batchIds.includes(student.batchId)
          );
          
          // Link the fee structure to each student
          for (const student of affectedStudents) {
            await storage.updateStudent(student.id, { feeStructureId: feeStructure.id });
            
            // Log activity for each student
            await storage.createActivity({
              type: 'fee',
              action: 'assign',
              details: { 
                studentId: student.id, 
                feeStructureId: feeStructure.id,
                feeName: feeStructure.name,
                operation: 'auto-link-on-creation'
              }
            });
          }
        }
      } catch (linkError) {
        console.error("Error auto-linking fee structure to students:", linkError);
        // Don't fail the main request due to auto-linking issues
      }
      
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
      
      // Get existing fee structure first
      const existingFeeStructure = await storage.getFeeStructure(feeStructureId);
      if (!existingFeeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }
      
      // Check if the fee structure has a due date in the past
      if (existingFeeStructure.dueDate) {
        const dueDate = new Date(existingFeeStructure.dueDate);
        const today = new Date();
        
        if (dueDate < today) {
          // Check if there are payments associated with this fee structure
          const payments = await storage.getFeePayments(undefined, feeStructureId);
          
          if (payments.length > 0) {
            return res.status(400).json({ 
              message: "Cannot modify fee structure with past due date that has payments associated with it" 
            });
          }
        }
      }
      
      // Use the full schema to validate but make all fields optional
      const updateData = z.object({
        name: z.string().optional(),
        classId: z.number().optional(),
        totalAmount: z.string().optional(),
        academicYearId: z.number().optional(),
        description: z.string().nullable().optional(),
        dueDate: z.string().nullable().optional()
      }).parse(req.body);
      
      // If class or academic year ID is changing, note the old and new values
      const classChanged = updateData.classId !== undefined && updateData.classId !== existingFeeStructure.classId;
      const academicYearChanged = updateData.academicYearId !== undefined && 
                                  updateData.academicYearId !== existingFeeStructure.academicYearId;
      
      // Update the fee structure
      const updatedFeeStructure = await storage.updateFeeStructure(feeStructureId, updateData);
      
      if (!updatedFeeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }
      
      // If the class or academic year changed, update the fee structure assignments
      if (classChanged || academicYearChanged) {
        try {
          // Get new target class and academic year ID 
          const targetClassId = updateData.classId || existingFeeStructure.classId;
          const targetAcademicYearId = updateData.academicYearId || existingFeeStructure.academicYearId;
          
          // Get all batches for this class and academic year
          const allBatches = await storage.getAllBatches();
          const matchingBatches = allBatches.filter(
            batch => batch.classId === targetClassId && batch.academicYearId === targetAcademicYearId
          );
          
          if (matchingBatches.length > 0) {
            // Get all students in these batches 
            const batchIds = matchingBatches.map(batch => batch.id);
            const allStudents = await storage.getStudents();
            const affectedStudents = allStudents.filter(
              student => student.batchId !== null && batchIds.includes(student.batchId)
            );
            
            // Link the updated fee structure to these students
            for (const student of affectedStudents) {
              await storage.updateStudent(student.id, { feeStructureId: feeStructureId });
              
              // Log activity for each student
              await storage.createActivity({
                type: 'fee',
                action: 'assign',
                details: { 
                  studentId: student.id, 
                  feeStructureId: feeStructureId,
                  feeName: updatedFeeStructure.name,
                  operation: 'auto-link-on-update'
                }
              });
            }
          }
        } catch (linkError) {
          console.error("Error auto-linking updated fee structure to students:", linkError);
          // Don't fail the main request due to auto-linking issues
        }
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
  
  // API endpoint to clone fee structures from one class/academic year to another
  app.post("/api/fee-structures/clone", async (req: Request, res: Response) => {
    try {
      const { sourceAcademicYearId, sourceClassId, targetAcademicYearId, targetClassId } = req.body;
      
      if (!sourceAcademicYearId || !sourceClassId || !targetAcademicYearId || !targetClassId) {
        return res.status(400).json({ 
          message: "sourceAcademicYearId, sourceClassId, targetAcademicYearId, and targetClassId are required" 
        });
      }
      
      // Get fee structures for the source academic year and class
      const allFeeStructures = await storage.getFeeStructures();
      const feeStructuresToClone = allFeeStructures.filter(
        fs => fs.academicYearId === sourceAcademicYearId && fs.classId === sourceClassId
      );
      
      if (feeStructuresToClone.length === 0) {
        return res.status(404).json({ 
          message: "No fee structures found for the selected source academic year and class" 
        });
      }
      
      // Clone each fee structure
      const clonedStructures = [];
      for (const structure of feeStructuresToClone) {
        // Create the new fee structure with updated details
        const newStructure = {
          name: structure.name,
          academicYearId: targetAcademicYearId,
          classId: targetClassId,
          totalAmount: structure.totalAmount,
          description: structure.description,
          dueDate: structure.dueDate,
        };
        
        const created = await storage.createFeeStructure(newStructure);
        clonedStructures.push(created);
        
        try {
          // Get all batches for this class and academic year
          const allBatches = await storage.getAllBatches();
          const matchingBatches = allBatches.filter(
            batch => batch.classId === targetClassId && batch.academicYearId === targetAcademicYearId
          );
          
          if (matchingBatches.length > 0) {
            // Get all students in these batches 
            const batchIds = matchingBatches.map(batch => batch.id);
            const allStudents = await storage.getStudents();
            const studentsToLink = allStudents.filter(
              student => student.batchId !== null && batchIds.includes(student.batchId)
            );
            
            // Link each student to the newly created fee structure
            for (const student of studentsToLink) {
              await storage.updateStudent(student.id, { feeStructureId: created.id });
              
              // Log activity for each student
              await storage.createActivity({
                type: 'fee',
                action: 'assign',
                details: { 
                  studentId: student.id, 
                  feeStructureId: created.id,
                  feeName: created.name,
                  operation: 'auto-link-on-clone'
                }
              });
            }
          }
        } catch (linkError) {
          console.error("Error auto-linking cloned fee structure to students:", linkError);
          // Don't fail the main request due to auto-linking issues
        }
      }
      
      res.status(201).json({
        message: `Successfully cloned ${clonedStructures.length} fee structures`,
        clonedStructures
      });
    } catch (error) {
      console.error("Error cloning fee structures:", error);
      res.status(500).json({ message: "Failed to clone fee structures" });
    }
  });
  
  // Fee installments API removed as per restructuring
  // Fees are now directly associated with fee structures
  
  // Fee Payments API
  app.get("/api/fee-payments", async (req: Request, res: Response) => {
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const feeStructureId = req.query.feeStructureId ? parseInt(req.query.feeStructureId as string) : undefined;
      
      // Check if the request has a user property (from an auth middleware)
      const user = (req as any).user;
      
      // If there's a specific student ID requested and user is a parent
      if (studentId && user && user.role === 'parent') {
        // Get students this parent has access to
        const allowedStudents = await storage.getStudentsByParent(user.id);
        const hasAccess = allowedStudents.some(s => s.id === studentId);
        
        if (!hasAccess) {
          console.log(`Parent ${user.id} denied access to fee payments for student ${studentId}`);
          return res.status(403).json({ message: "Access denied" });
        }
        
        console.log(`Parent ${user.id} granted access to fee payments for student ${studentId}`);
      }
      // If no specific student ID but user is a parent, we need to filter to only show their students' payments
      else if (!studentId && user && user.role === 'parent') {
        // Get all students this parent has access to
        const allowedStudents = await storage.getStudentsByParent(user.id);
        
        if (allowedStudents.length === 0) {
          // No students to check, return empty array
          return res.json([]);
        }
        
        // Get payments for all their students
        let allPayments: any[] = [];
        for (const student of allowedStudents) {
          const studentPayments = await storage.getFeePayments(student.id, feeStructureId);
          allPayments = allPayments.concat(studentPayments);
        }
        
        console.log(`Parent ${user.id} accessed fee payments for their ${allowedStudents.length} students`);
        return res.json(allPayments);
      }
      
      // For non-parent users or when parent requests their specific student with proper access
      const payments = await storage.getFeePayments(studentId, feeStructureId);
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
      
      // Check if the request has a user property (from an auth middleware)
      const user = (req as any).user;
      
      // If user is a parent, check if they have access to this payment's student
      if (user && user.role === 'parent') {
        // Get students this parent has access to
        const allowedStudents = await storage.getStudentsByParent(user.id);
        const hasAccess = allowedStudents.some(s => s.id === payment.studentId);
        
        if (!hasAccess) {
          console.log(`Parent ${user.id} denied access to fee payment ${paymentId} for student ${payment.studentId}`);
          return res.status(403).json({ message: "Access denied" });
        }
        
        console.log(`Parent ${user.id} granted access to fee payment ${paymentId}`);
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
      
      // Check if we're trying to pay more than what's due
      const { studentId, feeStructureId, amount } = insertData;
      
      // Get the fee structure
      const feeStructure = await storage.getFeeStructure(feeStructureId);
      if (!feeStructure) {
        return res.status(404).json({ message: "Fee structure not found" });
      }
      
      // Get existing payments for this student and fee structure
      const existingPayments = await storage.getFeePayments(studentId, feeStructureId);
      
      // Calculate total paid amount so far
      const totalPaid = existingPayments.reduce((sum, payment) => {
        return sum + parseFloat(payment.amount.toString());
      }, 0);
      
      // Total amount due from fee structure
      const totalDue = parseFloat(feeStructure.totalAmount.toString());
      
      // Calculate remaining amount due
      const remainingDue = totalDue - totalPaid;
      
      // Validate the payment amount
      const paymentAmount = parseFloat(amount);
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Payment amount must be greater than zero" });
      }
      
      if (paymentAmount > remainingDue) {
        return res.status(400).json({ 
          message: `Payment amount exceeds remaining balance. Maximum payment allowed: ${remainingDue}`
        });
      }
      
      // Create the payment
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
      
      const updateData = z.object({
        studentId: z.number().optional(),
        feeStructureId: z.number().optional(),
        paymentDate: z.string().optional(),
        amount: z.string().optional(),
        paymentMethod: z.string().optional(),
        receiptNumber: z.string().nullable().optional(),
        notes: z.string().nullable().optional()
      }).parse(req.body);
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
      
      // Check if the request has a user property (from an auth middleware)
      const user = (req as any).user;
      
      // If there's a specific student ID requested and user is a parent
      if (studentId && user && user.role === 'parent') {
        // Get students this parent has access to
        const allowedStudents = await storage.getStudentsByParent(user.id);
        const hasAccess = allowedStudents.some(s => s.id === studentId);
        
        if (!hasAccess) {
          console.log(`Parent ${user.id} denied access to reminders for student ${studentId}`);
          return res.status(403).json({ message: "Access denied" });
        }
        
        console.log(`Parent ${user.id} granted access to reminders for student ${studentId}`);
      }
      // If no specific student ID but user is a parent, filter to only show their students' reminders
      else if (!studentId && user && user.role === 'parent') {
        // Get all students this parent has access to
        const allowedStudents = await storage.getStudentsByParent(user.id);
        
        if (allowedStudents.length === 0) {
          // No students to check, return empty array
          return res.json([]);
        }
        
        // Get reminders for all their students
        let allReminders: any[] = [];
        for (const student of allowedStudents) {
          const studentReminders = await storage.getReminders(student.id);
          allReminders = allReminders.concat(studentReminders);
        }
        
        console.log(`Parent ${user.id} accessed reminders for their ${allowedStudents.length} students`);
        return res.json(allReminders);
      }
      
      // For non-parent users or when parent requests their specific student with proper access
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
      
      // Check if the request has a user property (from an auth middleware)
      const user = (req as any).user;
      
      // If user is a parent, check if they have access to this reminder's student
      if (user && user.role === 'parent') {
        // Get students this parent has access to
        const allowedStudents = await storage.getStudentsByParent(user.id);
        const hasAccess = allowedStudents.some(s => s.id === reminder.studentId);
        
        if (!hasAccess) {
          console.log(`Parent ${user.id} denied access to reminder ${reminderId} for student ${reminder.studentId}`);
          return res.status(403).json({ message: "Access denied" });
        }
        
        console.log(`Parent ${user.id} granted access to reminder ${reminderId}`);
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
      
      const updateData = z.object({
        studentId: z.number().optional(),
        feeStructureId: z.number().optional(),
        status: z.string().optional(),
        sentDate: z.date().optional().nullable(),
        message: z.string().optional()
      }).parse(req.body);
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
      
      // Check if the request has a user property (from an auth middleware)
      const user = (req as any).user;
      
      // If user is a parent, we need to filter the pending fees to only their students
      if (user && user.role === 'parent') {
        // Get allowed students for this parent
        const allowedStudents = await storage.getStudentsByParent(user.id);
        
        if (allowedStudents.length === 0) {
          // No students, return empty array
          return res.json([]);
        }
        
        // Get all pending fees for the class (if specified) or all classes
        const allPendingFees = await storage.getPendingFees(classId);
        
        // Filter to only include fees for this parent's students
        const filteredFees = allPendingFees.filter(fee => 
          allowedStudents.some(student => student.id === fee.studentId)
        );
        
        console.log(`Parent ${user.id} accessed pending fees report for their ${allowedStudents.length} students`);
        return res.json(filteredFees);
      }
      
      // For non-parent users, show all pending fees
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
  
  // Role permission routes
  app.get("/api/role-permissions", async (req: Request, res: Response) => {
    try {
      const role = req.query.role as string;
      const permissions = await storage.getRolePermissions(role);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });
  
  app.get("/api/role-permissions/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid permission ID" });
      }
      
      const permission = await storage.getRolePermission(id);
      if (!permission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      res.json(permission);
    } catch (error) {
      console.error("Error fetching role permission:", error);
      res.status(500).json({ message: "Failed to fetch role permission" });
    }
  });
  
  app.post("/api/role-permissions", async (req: Request, res: Response) => {
    try {
      // Check if the user has superadmin role
      const userRole = req.body.userRole;
      if (userRole !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can manage role permissions" });
      }
      
      const { role, module, canView, canCreate, canEdit, canDelete } = req.body;
      
      // Validate required fields
      if (!role || !module) {
        return res.status(400).json({ message: "Role and module are required" });
      }
      
      // Check if permission already exists
      const existingPermission = await storage.getRoleModulePermission(role, module);
      if (existingPermission) {
        return res.status(400).json({ message: "Permission for this role and module already exists" });
      }
      
      const newPermission = await storage.createRolePermission({
        role,
        module,
        canView: canView === undefined ? false : canView,
        canCreate: canCreate === undefined ? false : canCreate,
        canEdit: canEdit === undefined ? false : canEdit,
        canDelete: canDelete === undefined ? false : canDelete
      });
      
      res.status(201).json(newPermission);
    } catch (error) {
      console.error("Error creating role permission:", error);
      res.status(500).json({ message: "Failed to create role permission" });
    }
  });
  
  app.patch("/api/role-permissions/:id", async (req: Request, res: Response) => {
    try {
      // Check if the user has superadmin role
      const userRole = req.body.userRole;
      if (userRole !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can manage role permissions" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid permission ID" });
      }
      
      const { canView, canCreate, canEdit, canDelete } = req.body;
      
      // Get existing permission
      const existingPermission = await storage.getRolePermission(id);
      if (!existingPermission) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      // Update the permission
      const updatedPermission = await storage.updateRolePermission(id, {
        canView: canView !== undefined ? canView : existingPermission.canView,
        canCreate: canCreate !== undefined ? canCreate : existingPermission.canCreate,
        canEdit: canEdit !== undefined ? canEdit : existingPermission.canEdit,
        canDelete: canDelete !== undefined ? canDelete : existingPermission.canDelete
      });
      
      res.json(updatedPermission);
    } catch (error) {
      console.error("Error updating role permission:", error);
      res.status(500).json({ message: "Failed to update role permission" });
    }
  });
  
  app.delete("/api/role-permissions/:id", async (req: Request, res: Response) => {
    try {
      // Check if the user has superadmin role
      const userRole = req.query.userRole as string;
      if (userRole !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can manage role permissions" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid permission ID" });
      }
      
      const success = await storage.deleteRolePermission(id);
      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting role permission:", error);
      res.status(500).json({ message: "Failed to delete role permission" });
    }
  });
  
  // Module permissions check endpoint
  app.get("/api/module-permissions", async (req: Request, res: Response) => {
    try {
      const role = req.query.role as string;
      if (!role) {
        return res.status(400).json({ message: "Role parameter is required" });
      }
      
      const permissions = await storage.getModulePermissions(role);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching module permissions:", error);
      res.status(500).json({ message: "Failed to fetch module permissions" });
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
      
      // Add activity log for tracking settings changes
      await storage.createActivity({
        type: 'settings',
        action: 'update',
        details: { 
          key: setting.key, 
          value: setting.value,
          oldValue: req.body.oldValue || 'unknown'
        }
      });
      
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
  
  // Academic Years endpoints
  app.get("/api/academic-years", async (req: Request, res: Response) => {
    try {
      const academicYears = await storage.getAllAcademicYears();
      res.json(academicYears);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.get("/api/academic-years/current", async (req: Request, res: Response) => {
    try {
      const currentYear = await storage.getCurrentAcademicYear();
      if (!currentYear) {
        return res.status(404).json({ message: "No current academic year found" });
      }
      res.json(currentYear);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.get("/api/academic-years/:id", async (req: Request, res: Response) => {
    try {
      const academicYear = await storage.getAcademicYearById(parseInt(req.params.id));
      if (!academicYear) {
        return res.status(404).json({ message: "Academic year not found" });
      }
      res.json(academicYear);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.post("/api/academic-years", async (req: Request, res: Response) => {
    try {
      // Check if user is superadmin
      const user = (req as any).user;
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can manage academic years" });
      }
      
      const parsedData = insertAcademicYearSchema.parse(req.body);
      
      // If this academic year is set as current, update all others to not be current
      if (parsedData.isCurrent) {
        await storage.updateAllAcademicYearsToNotCurrent();
      }
      
      const academicYear = await storage.createAcademicYear(parsedData);
      
      // Log activity
      await storage.createActivity({
        type: 'settings',
        action: 'create',
        details: { academicYear: academicYear.name }
      });
      
      res.status(201).json(academicYear);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/academic-years/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is superadmin
      const user = (req as any).user;
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can manage academic years" });
      }
      
      const id = parseInt(req.params.id);
      const parsedData = insertAcademicYearSchema.parse(req.body);
      
      // If this academic year is set as current, update all others to not be current
      if (parsedData.isCurrent) {
        await storage.updateAllAcademicYearsToNotCurrent();
      }
      
      const academicYear = await storage.updateAcademicYear(id, parsedData);
      
      if (!academicYear) {
        return res.status(404).json({ message: "Academic year not found" });
      }
      
      // Log activity
      await storage.createActivity({
        type: 'settings',
        action: 'update',
        details: { academicYear: academicYear.name }
      });
      
      res.json(academicYear);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  app.delete("/api/academic-years/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is superadmin
      const user = (req as any).user;
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmins can manage academic years" });
      }
      
      const id = parseInt(req.params.id);
      
      // Check if any classes or fee structures reference this academic year
      const hasReferences = await storage.checkAcademicYearReferences(id);
      
      if (hasReferences) {
        return res.status(400).json({ 
          message: "Cannot delete academic year that is referenced by classes or fee structures" 
        });
      }
      
      const deleted = await storage.deleteAcademicYear(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Academic year not found" });
      }
      
      // Log activity
      await storage.createActivity({
        type: 'settings',
        action: 'delete',
        details: { academicYearId: id }
      });
      
      res.json({ message: "Academic year deleted successfully" });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // User Management Routes
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      // Optionally filter by role
      const role = req.query.role as string | undefined;
      let users;
      
      if (role && ['parent', 'teacher', 'officeadmin', 'superadmin'].includes(role)) {
        users = await storage.getUsersByRole(role);
      } else {
        users = await storage.getUsers();
      }
      
      // Remove sensitive data like passwordHash before sending
      const safeUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only remove sensitive data if showPassword query param is not set to true
      if (req.query.showPassword === 'true') {
        res.json(user);
      } else {
        // Remove sensitive data
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      // Basic validation for required fields and password matching
      const { username, email, fullName, password, confirmPassword, role, active, studentId } = req.body;
      
      // Validate required fields
      if (!username || !email || !fullName || !password) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "Required fields missing" }] 
        });
      }
      
      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "Password must be at least 8 characters long" }] 
        });
      }
      
      // Validate password matching
      if (password !== confirmPassword) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "Passwords do not match" }] 
        });
      }
      
      // Validate role if provided
      if (role && !['parent', 'teacher', 'officeadmin', 'superadmin'].includes(role)) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "Invalid role value" }] 
        });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // In a real app, we would hash the password here
      // For this demo, we'll just use a simple "hash" prefix
      const passwordHash = `hashed_${password}`;
      
      // Prepare user data for storage
      const userData = {
        username,
        email,
        fullName,
        role: role || 'parent',
        active: active !== undefined ? active : true,
        studentId: studentId || null,
        passwordHash
      };
      
      const newUser = await storage.createUser(userData);
      
      // Remove sensitive data before sending response
      const { passwordHash: _, ...safeUser } = newUser;
      
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get existing user to verify it exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Extract updatable fields, excluding password fields
      const { username, email, fullName, role, active, studentId } = req.body;
      
      const updateData: Record<string, any> = {};
      
      // Only include fields that are provided
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email; 
      if (fullName !== undefined) updateData.fullName = fullName;
      if (role !== undefined) updateData.role = role;
      if (active !== undefined) updateData.active = active;
      if (studentId !== undefined) updateData.studentId = studentId;
      
      // Validate role if provided
      if (updateData.role && !['parent', 'teacher', 'officeadmin', 'superadmin'].includes(updateData.role)) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "Invalid role value" }] 
        });
      }
      
      // Check if username is being updated and if it already exists
      if (updateData.username) {
        const existingUsername = await storage.getUserByUsername(updateData.username);
        if (existingUsername && existingUsername.id !== id) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }
      
      // Check if email is being updated and if it already exists
      if (updateData.email) {
        const existingEmail = await storage.getUserByEmail(updateData.email);
        if (existingEmail && existingEmail.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      const updatedUser = await storage.updateUser(id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.post("/api/users/:id/password", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get request fields
      const { currentPassword, password, confirmPassword } = req.body;
      
      // Validate required fields
      if (!currentPassword || !password || !confirmPassword) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "All password fields are required" }] 
        });
      }
      
      // Validate new password length
      if (password.length < 8) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "New password must be at least 8 characters long" }] 
        });
      }
      
      // Validate that new passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "New passwords do not match" }] 
        });
      }
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // In a real app, we would verify the current password here
      // For demo purposes, we're skipping actual password verification
      
      // In a real app, we would hash the new password
      const passwordHash = `hashed_${password}`;
      
      const success = await storage.updateUserPassword(id, passwordHash);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Failed to update user password" });
    }
  });
  
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete user. It may be the last superadmin user." 
        });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Create user account from student
  app.post("/api/students/:id/create-account", async (req: Request, res: Response) => {
    console.log("\n\n==============================================");
    console.log("💥 PARENT ACCOUNT CREATION REQUEST RECEIVED 💥");
    console.log("==============================================");
    console.log("Request params:", req.params);
    console.log("Request user session:", req.session);
    console.log("Student ID from request:", req.params.id);
    
    try {
      // Import necessary services
      const { createUserFromStudent } = await import('./services/auth');
      const { sendWelcomeEmail } = await import('./services/email');
      
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        console.error("❌ CRITICAL ERROR: Invalid student ID format:", req.params.id);
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      
      console.log("➡️ Step 1: Looking up student with ID:", studentId);
      
      // DIRECT DATABASE ACCESS - Most reliable approach
      const student = await storage.getStudent(studentId);
      console.log("Student lookup result:", student ? "FOUND" : "NOT FOUND");
      
      if (!student) {
        console.error("❌ CRITICAL ERROR: Student not found with ID:", studentId);
        return res.status(404).json({ message: "Student not found" });
      }
      
      console.log("✅ SUCCESS: Found student record:", { 
        id: student.id,
        fullName: student.fullName,
        guardianName: student.guardianName,
        email: student.email || "NO_EMAIL"
      });
      
      // Check if student has an email
      if (!student.email) {
        console.error("❌ VALIDATION ERROR: Student has no email:", studentId);
        return res.status(400).json({ message: "Student must have an email to create an account" });
      }
      
      // Step 2: Check if email is already registered
      console.log("➡️ Step 2: Checking if email is already registered:", student.email);
      const existingUser = await storage.getUserByEmail(student.email);
      
      if (existingUser) {
        console.log("✅ FOUND EXISTING USER - Linking student to existing user:", { 
          email: student.email, 
          userId: existingUser.id,
          studentId: student.id
        });
        
        // If user exists, associate the student with this user account
        console.log("➡️ Step 3A: Updating existing user to link with student");
        const updatedUser = await storage.updateUser(existingUser.id, { 
          studentId: studentId 
        });
        
        if (!updatedUser) {
          console.error("❌ ERROR: Failed to update existing user:", existingUser.id);
          return res.status(500).json({ message: "Failed to update existing user" });
        }
        
        console.log("✅ SUCCESS: User updated successfully:", {
          id: updatedUser.id,
          username: updatedUser.username,
          role: updatedUser.role
        });
        
        // Record the link in activity log
        console.log("➡️ Step 4A: Logging activity");
        await storage.createActivity({
          type: 'user',
          action: 'link_student_to_account',
          details: {
            message: `Linked student ${student.fullName} to existing account for ${existingUser.fullName}`,
            studentId: student.id,
            userId: existingUser.id
          }
        });
        
        console.log("✅ SUCCESS: Activity logged, returning response");
        return res.status(200).json({ 
          message: "Student linked to existing account successfully", 
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            role: existingUser.role
          },
          linked: true
        });
      }
      
      console.log("➡️ Step 3B: No existing user found - Creating new parent account");
      console.log("Creating new user account for student:", { 
        studentId: student.id, 
        fullName: student.fullName,
        guardianName: student.guardianName,
        email: student.email
      });
      
      // Create user from student
      console.log("➡️ Step 4B: Calling createUserFromStudent function");
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      try {
        const { user, password } = await createUserFromStudent(
          storage, 
          studentId, 
          student.guardianName, 
          student.email,
          baseUrl
        );
        console.log("✅ SUCCESS: User creation function completed");
      
        console.log("User account created successfully:", { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        });
        
        // Send welcome email with temporary password
        console.log("➡️ Step 5B: Sending welcome email");
        const loginUrl = `${baseUrl}/login`;
        await sendWelcomeEmail(user, password, loginUrl);
        
        console.log("✅ SUCCESS: Welcome email sent to:", user.email);
        
        console.log("➡️ Step 6B: Returning successful response");
        res.status(201).json({ 
          message: "User account created successfully",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          },
          linked: false
        });
      } catch (error) {
        console.error("❌ CRITICAL ERROR: Failed to create user account:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Failed to create user account", error: errorMessage });
      }
    } catch (outerError) {
      console.error("❌ OUTER ERROR in create-account endpoint:", outerError);
      const errorMessage = outerError instanceof Error ? outerError.message : String(outerError);
      res.status(500).json({ message: "Fatal error in account creation process", error: errorMessage });
    }
  });

  // Teacher-Class association routes
  app.get("/api/teacher-classes", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // If teacher, only return their associations
      if (user.role === 'teacher') {
        const teacherClasses = await storage.getTeacherClasses(user.id);
        return res.json(teacherClasses);
      }
      
      // For admin roles, return all teacher-class associations
      const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : undefined;
      const teacherClasses = await storage.getTeacherClasses(teacherId);
      res.json(teacherClasses);
    } catch (error) {
      console.error("Error fetching teacher-class associations:", error);
      res.status(500).json({ message: "Failed to fetch teacher-class associations" });
    }
  });
  
  app.get("/api/class-teachers/:classId", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const classId = parseInt(req.params.classId);
      const classTeachers = await storage.getClassTeachers(classId);
      res.json(classTeachers);
    } catch (error) {
      console.error("Error fetching class teachers:", error);
      res.status(500).json({ message: "Failed to fetch class teachers" });
    }
  });
  
  app.post("/api/teacher-classes", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only admins can assign teachers to classes
      if (!['officeadmin', 'superadmin'].includes(user.role)) {
        return res.status(403).json({ message: "Only administrators can assign teachers to classes" });
      }
      
      const { teacherId, classId } = req.body;
      
      if (!teacherId || !classId) {
        return res.status(400).json({ message: "Teacher ID and Class ID are required" });
      }
      
      const assignment = await storage.assignTeacherToClass(
        parseInt(teacherId), 
        parseInt(classId)
      );
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning teacher to class:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to assign teacher to class" });
    }
  });
  
  app.delete("/api/teacher-classes/:teacherId/:classId", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only admins can remove teachers from classes
      if (!['officeadmin', 'superadmin'].includes(user.role)) {
        return res.status(403).json({ message: "Only administrators can remove teachers from classes" });
      }
      
      const teacherId = parseInt(req.params.teacherId);
      const classId = parseInt(req.params.classId);
      
      const success = await storage.removeTeacherFromClass(teacherId, classId);
      
      if (!success) {
        return res.status(404).json({ message: "Teacher-class association not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing teacher from class:", error);
      res.status(500).json({ message: "Failed to remove teacher from class" });
    }
  });
  
  // Attendance management routes
  app.get("/api/attendance", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view attendance
      const canView = await storage.checkPermission(user.role, 'attendance', 'view');
      if (!canView) {
        return res.status(403).json({ message: "You don't have permission to view attendance records" });
      }
      
      // Parse query parameters
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID is required" });
      }
      
      // For teachers, check if they're assigned to this class
      if (user.role === 'teacher') {
        const teacherClasses = await storage.getTeacherClasses(user.id);
        const hasAccess = teacherClasses.some(tc => tc.classId === classId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You are not assigned to this class" });
        }
      }
      
      const attendanceRecords = await storage.getAttendance(classId, date);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });
  
  app.get("/api/attendance/student/:studentId", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view attendance
      const canView = await storage.checkPermission(user.role, 'attendance', 'view');
      if (!canView) {
        return res.status(403).json({ message: "You don't have permission to view attendance records" });
      }
      
      const studentId = parseInt(req.params.studentId);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      // For parents, check if they have access to this student
      if (user.role === 'parent') {
        const allowedStudents = await storage.getStudentsByParent(user.id);
        const hasAccess = allowedStudents.some(s => s.id === studentId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have access to this student's records" });
        }
      }
      
      // For teachers, check if this student is in one of their classes
      if (user.role === 'teacher') {
        const student = await storage.getStudent(studentId);
        
        if (!student || !student.classId) {
          return res.status(404).json({ message: "Student not found or not assigned to any class" });
        }
        
        const teacherClasses = await storage.getTeacherClasses(user.id);
        const hasAccess = teacherClasses.some(tc => tc.classId === student.classId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You are not assigned to this student's class" });
        }
      }
      
      const attendanceRecords = await storage.getStudentAttendance(studentId, startDate, endDate);
      res.json(attendanceRecords);
    } catch (error) {
      console.error("Error fetching student attendance records:", error);
      res.status(500).json({ message: "Failed to fetch student attendance records" });
    }
  });
  
  app.post("/api/attendance", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to mark attendance
      const canCreate = await storage.checkPermission(user.role, 'attendance', 'create');
      if (!canCreate) {
        return res.status(403).json({ message: "You don't have permission to mark attendance" });
      }
      
      // Parse and validate request data
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        markedById: user.id // Ensure the markedById is the logged-in user
      });
      
      // For teachers, check if they're assigned to this class
      if (user.role === 'teacher') {
        const teacherClasses = await storage.getTeacherClasses(user.id);
        const hasAccess = teacherClasses.some(tc => tc.classId === attendanceData.classId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You are not assigned to this class" });
        }
      }
      
      const attendance = await storage.markAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error marking attendance:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      handleZodError(error, res);
    }
  });
  
  app.patch("/api/attendance/:id", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to update attendance
      const canEdit = await storage.checkPermission(user.role, 'attendance', 'edit');
      if (!canEdit) {
        return res.status(403).json({ message: "You don't have permission to update attendance records" });
      }
      
      const id = parseInt(req.params.id);
      
      // Get the existing attendance record
      const existing = await storage.getAttendance(id);
      
      // If it's a teacher, check if they're assigned to this class
      if (user.role === 'teacher' && existing) {
        const teacherClasses = await storage.getTeacherClasses(user.id);
        const hasAccess = teacherClasses.some(tc => tc.classId === existing[0].classId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You are not assigned to this class" });
        }
      }
      
      // Parse and validate the updates
      const updates = z.object({
        classId: z.number().optional(),
        studentId: z.number().optional(),
        date: z.string().optional(),
        status: z.string().optional(),
        notes: z.string().optional().nullable()
      }).parse(req.body);
      
      // Apply the update
      const updatedAttendance = await storage.updateAttendance(id, updates);
      
      if (!updatedAttendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(updatedAttendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      handleZodError(error, res);
    }
  });
  
  app.get("/api/attendance/report/:classId/:month/:year", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view attendance
      const canView = await storage.checkPermission(user.role, 'attendance', 'view');
      if (!canView) {
        return res.status(403).json({ message: "You don't have permission to view attendance reports" });
      }
      
      const classId = parseInt(req.params.classId);
      const month = parseInt(req.params.month);
      const year = parseInt(req.params.year);
      
      // For teachers, check if they're assigned to this class
      if (user.role === 'teacher') {
        const teacherClasses = await storage.getTeacherClasses(user.id);
        const hasAccess = teacherClasses.some(tc => tc.classId === classId);
        
        if (!hasAccess) {
          return res.status(403).json({ message: "You are not assigned to this class" });
        }
      }
      
      const report = await storage.getClassAttendanceReport(classId, month, year);
      res.json(report);
    } catch (error) {
      console.error("Error generating attendance report:", error);
      res.status(500).json({ message: "Failed to generate attendance report" });
    }
  });

  // Batch Management Routes
  app.get("/api/batches", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view batches
      const canView = await storage.checkPermission(user.role, 'batch_management', 'view');
      if (!canView) {
        return res.status(403).json({ message: "You don't have permission to view batches" });
      }
      
      const batches = await storage.getAllBatches();
      res.json(batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  });
  
  app.get("/api/batches/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view batches
      const canView = await storage.checkPermission(user.role, 'batch_management', 'view');
      if (!canView) {
        return res.status(403).json({ message: "You don't have permission to view batches" });
      }
      
      const batchId = parseInt(req.params.id);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      const batch = await storage.getBatch(batchId);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      res.json(batch);
    } catch (error) {
      console.error("Error fetching batch:", error);
      res.status(500).json({ message: "Failed to fetch batch" });
    }
  });
  
  app.post("/api/batches", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to create batches
      const canCreate = await storage.checkPermission(user.role, 'batch_management', 'create');
      if (!canCreate) {
        return res.status(403).json({ message: "You don't have permission to create batches" });
      }
      
      const result = insertBatchSchema.safeParse(req.body);
      
      if (!result.success) {
        return handleZodError(result.error, res);
      }
      
      const batch = await storage.createBatch(result.data);
      
      // Create activity log entry
      await storage.createActivity({
        type: 'batch',
        action: 'create',
        details: { batchId: batch.id, name: batch.name }
      });
      
      res.status(201).json(batch);
    } catch (error) {
      console.error("Error creating batch:", error);
      res.status(500).json({ message: "Failed to create batch" });
    }
  });
  
  app.patch("/api/batches/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to edit batches
      const canEdit = await storage.checkPermission(user.role, 'batch_management', 'edit');
      if (!canEdit) {
        return res.status(403).json({ message: "You don't have permission to edit batches" });
      }
      
      const batchId = parseInt(req.params.id);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      const result = z.object({
        name: z.string().optional(),
        classId: z.number().optional(),
        academicYearId: z.number().optional(),
        description: z.string().optional().nullable()
      }).safeParse(req.body);
      
      if (!result.success) {
        return handleZodError(result.error, res);
      }
      
      const updatedBatch = await storage.updateBatch(batchId, result.data);
      
      if (!updatedBatch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      // Create activity log entry
      await storage.createActivity({
        type: 'batch',
        action: 'update',
        details: { batchId: updatedBatch.id, name: updatedBatch.name }
      });
      
      res.json(updatedBatch);
    } catch (error) {
      console.error("Error updating batch:", error);
      res.status(500).json({ message: "Failed to update batch" });
    }
  });
  
  app.delete("/api/batches/:id", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to delete batches
      const canDelete = await storage.checkPermission(user.role, 'batch_management', 'delete');
      if (!canDelete) {
        return res.status(403).json({ message: "You don't have permission to delete batches" });
      }
      
      const batchId = parseInt(req.params.id);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      const batch = await storage.getBatch(batchId);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      // Check if there are students assigned to this batch
      const studentsInBatch = await storage.getStudentsByBatch(batchId);
      
      if (studentsInBatch.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete batch with students assigned. Reassign students first." 
        });
      }
      
      await storage.deleteBatch(batchId);
      
      // Create activity log entry
      await storage.createActivity({
        type: 'batch',
        action: 'delete',
        details: { batchId, name: batch.name }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting batch:", error);
      res.status(500).json({ message: "Failed to delete batch" });
    }
  });
  
  app.get("/api/batches/class/:classId", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view batches
      const canView = await storage.checkPermission(user.role, 'batch_management', 'view');
      if (!canView) {
        return res.status(403).json({ message: "You don't have permission to view batches" });
      }
      
      const classId = parseInt(req.params.classId);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      
      const batches = await storage.getBatchesByClass(classId);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching batches by class:", error);
      res.status(500).json({ message: "Failed to fetch batches by class" });
    }
  });
  
  app.get("/api/batches/academic-year/:academicYearId", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view batches
      const canView = await storage.checkPermission(user.role, 'batch_management', 'view');
      if (!canView) {
        return res.status(403).json({ message: "You don't have permission to view batches" });
      }
      
      const academicYearId = parseInt(req.params.academicYearId);
      
      if (isNaN(academicYearId)) {
        return res.status(400).json({ message: "Invalid academic year ID" });
      }
      
      const batches = await storage.getBatchesByAcademicYear(academicYearId);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching batches by academic year:", error);
      res.status(500).json({ message: "Failed to fetch batches by academic year" });
    }
  });
  
  app.get("/api/students/batch/:batchId", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to view students
      const canViewStudents = await storage.checkPermission(user.role, 'students', 'view');
      if (!canViewStudents) {
        return res.status(403).json({ message: "You don't have permission to view students" });
      }
      
      const batchId = parseInt(req.params.batchId);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      const students = await storage.getStudentsByBatch(batchId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students by batch:", error);
      res.status(500).json({ message: "Failed to fetch students by batch" });
    }
  });
  
  // Link students to batch route
  app.post("/api/students/batch/:batchId", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to link students
      const canUpdate = await storage.checkPermission(user.role, 'students', 'edit');
      if (!canUpdate) {
        return res.status(403).json({ message: "You don't have permission to link students" });
      }
      
      const batchId = parseInt(req.params.batchId);
      
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      // Get batch details to find academicYearId and classId
      const batch = await storage.getBatch(batchId);
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      // Get the fee structures for this class and academic year
      const allFeeStructures = await storage.getFeeStructures();
      const matchingFeeStructures = allFeeStructures.filter(
        fee => fee.classId === batch.classId && fee.academicYearId === batch.academicYearId
      );
      
      // Validate body
      if (!req.body.studentIds || !Array.isArray(req.body.studentIds)) {
        return res.status(400).json({ message: "studentIds array is required" });
      }
      
      const studentIds = req.body.studentIds.map(Number);
      
      // Validate each student ID
      for (const id of studentIds) {
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid student ID in array" });
        }
      }
      
      // Link students to batch and associate fee structure (if available)
      for (const studentId of studentIds) {
        try {
          // Get the student to check if they already have a fee structure
          const student = await storage.getStudent(studentId);
          if (!student) {
            console.warn(`Student with ID ${studentId} not found, skipping`);
            continue;
          }
          
          // First link student to batch and class
          await storage.updateStudent(studentId, { 
            batchId,
            classId: batch.classId // Ensure the class is set correctly
          });
          
          // Then associate fee structure if one exists for this class and academic year
          if (matchingFeeStructures.length > 0) {
            let selectedFeeStructure;
            
            // If there are multiple fee structures, try to pick the most appropriate one
            if (matchingFeeStructures.length > 1) {
              // Logic to choose the most appropriate fee structure
              // For example, we could prioritize fee structures with due dates in the future
              // or pick the newest one if multiple exist
              
              // Sort by due date (null dates last) and then by creation date (newest first)
              const sortedFeeStructures = [...matchingFeeStructures].sort((a, b) => {
                // Put fee structures with null due dates at the end
                if (!a.dueDate && b.dueDate) return 1;
                if (a.dueDate && !b.dueDate) return -1;
                
                if (a.dueDate && b.dueDate) {
                  const dateA = new Date(a.dueDate);
                  const dateB = new Date(b.dueDate);
                  
                  // Sort by due date (furthest in future first)
                  if (dateA > dateB) return -1;
                  if (dateA < dateB) return 1;
                }
                
                // If due dates are the same or both null, sort by creation date (newest first)
                const createdAtA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                const createdAtB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                return createdAtB.getTime() - createdAtA.getTime();
              });
              
              selectedFeeStructure = sortedFeeStructures[0];
            } else {
              // Only one fee structure, use it
              selectedFeeStructure = matchingFeeStructures[0];
            }
            
            // Update the student with the selected fee structure
            await storage.updateStudent(studentId, { feeStructureId: selectedFeeStructure.id });
            
            // Create activity log for fee structure assignment
            await storage.createActivity({
              type: 'fee',
              action: 'assign',
              details: { 
                studentId, 
                feeStructureId: selectedFeeStructure.id,
                feeName: selectedFeeStructure.name,
                className: batch.classId,
                academicYearId: batch.academicYearId,
                operation: 'auto-link-on-batch-assignment'
              }
            });
          }
        } catch (error) {
          console.error(`Error processing student ${studentId}:`, error);
          // Continue with next student
        }
      }
      
      // Create activity logs
      await storage.createActivity({
        type: 'student',
        action: 'update',
        details: { batchId, studentCount: studentIds.length, action: 'link to batch' }
      });
      
      res.status(200).json({ message: "Students linked to batch successfully" });
    } catch (error) {
      console.error("Error linking students to batch:", error);
      res.status(500).json({ message: "Failed to link students to batch" });
    }
  });
  
  // Remove student from batch route
  app.delete("/api/students/batch/:batchId/:studentId", async (req: Request, res: Response) => {
    try {
      const user = (req.session as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has permission to unlink students
      const canUpdate = await storage.checkPermission(user.role, 'students', 'edit');
      if (!canUpdate) {
        return res.status(403).json({ message: "You don't have permission to unlink students" });
      }
      
      const batchId = parseInt(req.params.batchId);
      const studentId = parseInt(req.params.studentId);
      
      if (isNaN(batchId) || isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid batch ID or student ID" });
      }
      
      // First check if student is in the specified batch
      const student = await storage.getStudent(studentId);
      if (!student || student.batchId !== batchId) {
        return res.status(400).json({ message: "Student is not in the specified batch" });
      }
      
      // Remove student from batch by setting batchId to null
      await storage.updateStudent(studentId, { batchId: null });
      
      // Remove fee structure association as well
      if (student.feeStructureId) {
        // Optional: Check if fee structure is related to this batch before removing
        const batch = await storage.getBatch(batchId);
        if (batch) {
          const feeStructure = await storage.getFeeStructure(student.feeStructureId);
          if (feeStructure && 
              feeStructure.classId === batch.classId && 
              feeStructure.academicYearId === batch.academicYearId) {
            // Only reset the fee structure if it was associated with this batch's class and academic year
            await storage.updateStudent(studentId, { feeStructureId: null });
            
            // Create activity log for fee structure removal
            await storage.createActivity({
              type: 'fee',
              action: 'unassign',
              details: { 
                studentId, 
                feeStructureId: student.feeStructureId,
                reason: 'batch-removal'
              }
            });
          }
        }
      }
      
      // Create activity log
      await storage.createActivity({
        type: 'student',
        action: 'update',
        details: { studentId, action: 'removed from batch', batchId }
      });
      
      res.status(200).json({ message: "Student removed from batch successfully" });
    } catch (error) {
      console.error("Error removing student from batch:", error);
      res.status(500).json({ message: "Failed to remove student from batch" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
