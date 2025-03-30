import {
  type Student,
  type InsertStudent,
  type Expense,
  type InsertExpense,
  type Inventory,
  type InsertInventory,
  type Activity,
  type InsertActivity
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Student methods
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Expense methods
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;
  
  // Inventory methods
  getInventoryItems(): Promise<Inventory[]>;
  getInventoryItem(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Activity methods
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private students: Map<number, Student>;
  private expenses: Map<number, Expense>;
  private inventory: Map<number, Inventory>;
  private activities: Map<number, Activity>;
  
  private studentId: number;
  private expenseId: number;
  private inventoryId: number;
  private activityId: number;

  constructor() {
    this.students = new Map();
    this.expenses = new Map();
    this.inventory = new Map();
    this.activities = new Map();
    
    this.studentId = 1;
    this.expenseId = 1;
    this.inventoryId = 1;
    this.activityId = 1;
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).sort((a, b) => b.id - a.id);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.studentId++;
    const now = new Date();
    const student: Student = { ...insertStudent, id, createdAt: now };
    this.students.set(id, student);
    
    // Log activity
    this.createActivity({
      type: 'student',
      action: 'create',
      details: { studentId: id, name: student.fullName }
    });
    
    return student;
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...studentData };
    this.students.set(id, updatedStudent);
    
    // Log activity
    this.createActivity({
      type: 'student',
      action: 'update',
      details: { studentId: id, name: updatedStudent.fullName }
    });
    
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const student = this.students.get(id);
    if (!student) return false;
    
    const success = this.students.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'student',
        action: 'delete',
        details: { studentId: id, name: student.fullName }
      });
    }
    
    return success;
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) => b.id - a.id);
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.expenseId++;
    const now = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt: now };
    this.expenses.set(id, expense);
    
    // Log activity
    this.createActivity({
      type: 'expense',
      action: 'create',
      details: { expenseId: id, description: expense.description, amount: expense.amount }
    });
    
    return expense;
  }

  async updateExpense(id: number, expenseData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...expenseData };
    this.expenses.set(id, updatedExpense);
    
    // Log activity
    this.createActivity({
      type: 'expense',
      action: 'update',
      details: { expenseId: id, description: updatedExpense.description, amount: updatedExpense.amount }
    });
    
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const expense = this.expenses.get(id);
    if (!expense) return false;
    
    const success = this.expenses.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'expense',
        action: 'delete',
        details: { expenseId: id, description: expense.description }
      });
    }
    
    return success;
  }

  // Inventory methods
  async getInventoryItems(): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).sort((a, b) => b.id - a.id);
  }

  async getInventoryItem(id: number): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async createInventoryItem(insertInventory: InsertInventory): Promise<Inventory> {
    const id = this.inventoryId++;
    const now = new Date();
    const item: Inventory = { ...insertInventory, id, lastUpdated: now };
    this.inventory.set(id, item);
    
    // Log activity
    this.createActivity({
      type: 'inventory',
      action: 'create',
      details: { inventoryId: id, name: item.name, quantity: item.quantity }
    });
    
    return item;
  }

  async updateInventoryItem(id: number, itemData: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    
    const now = new Date();
    const updatedItem = { ...item, ...itemData, lastUpdated: now };
    this.inventory.set(id, updatedItem);
    
    // Log activity
    this.createActivity({
      type: 'inventory',
      action: 'update',
      details: { inventoryId: id, name: updatedItem.name, quantity: updatedItem.quantity }
    });
    
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const item = this.inventory.get(id);
    if (!item) return false;
    
    const success = this.inventory.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'inventory',
        action: 'delete',
        details: { inventoryId: id, name: item.name }
      });
    }
    
    return success;
  }

  // Activity methods
  async getActivities(limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.id - a.id);
    
    if (limit) {
      return activities.slice(0, limit);
    }
    
    return activities;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, timestamp: now };
    this.activities.set(id, activity);
    return activity;
  }

  // Initialize sample data
  private initializeSampleData() {
    // Initial students
    const students = [
      {
        fullName: "Emma Smith",
        dateOfBirth: "2019-05-15",
        age: 4,
        gender: "female",
        guardianName: "John Smith",
        phone: "+1 (555) 123-4567",
        email: "john.smith@example.com",
        address: "123 Main St, Anytown, USA",
        status: "active",
        notes: "Allergic to peanuts"
      },
      {
        fullName: "Leo Johnson",
        dateOfBirth: "2020-03-10",
        age: 3,
        gender: "male",
        guardianName: "Maria Johnson",
        phone: "+1 (555) 234-5678",
        email: "maria.johnson@example.com",
        address: "456 Oak Ave, Somewhere, USA",
        status: "active",
        notes: ""
      },
      {
        fullName: "Sophia Wilson",
        dateOfBirth: "2019-07-22",
        age: 4,
        gender: "female",
        guardianName: "Robert Wilson",
        phone: "+1 (555) 345-6789",
        email: "robert.wilson@example.com",
        address: "789 Pine St, Nowhere, USA",
        status: "on_leave",
        notes: "On vacation until next week"
      }
    ];

    students.forEach(student => {
      this.createStudent(student);
    });

    // Initial expenses
    const expenses = [
      {
        description: "Art Supplies",
        amount: "235.50",
        category: "Materials",
        date: "2023-10-10",
        notes: "Purchased from ArtStore"
      },
      {
        description: "Snacks for Week",
        amount: "128.75",
        category: "Food",
        date: "2023-10-08",
        notes: "Weekly snacks for all classes"
      },
      {
        description: "Field Trip to Museum",
        amount: "450.00",
        category: "Activities",
        date: "2023-10-05",
        notes: "Transportation and entrance fees"
      }
    ];

    expenses.forEach(expense => {
      this.createExpense(expense);
    });

    // Initial inventory
    const inventoryItems = [
      {
        name: "Crayons (24-pack)",
        category: "Art Supplies",
        quantity: 15,
        unit: "box",
        minQuantity: 20,
        notes: "Running low"
      },
      {
        name: "Construction Paper",
        category: "Art Supplies",
        quantity: 500,
        unit: "sheet",
        minQuantity: 200,
        notes: ""
      },
      {
        name: "Juice Boxes",
        category: "Food",
        quantity: 100,
        unit: "box",
        minQuantity: 50,
        notes: ""
      },
      {
        name: "Building Blocks",
        category: "Toys",
        quantity: 4,
        unit: "set",
        minQuantity: 3,
        notes: "Need more variety"
      }
    ];

    inventoryItems.forEach(item => {
      this.createInventoryItem(item);
    });
  }
}

export const storage = new MemStorage();
