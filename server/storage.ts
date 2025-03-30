import {
  type Student,
  type InsertStudent,
  type Expense,
  type InsertExpense,
  type Inventory,
  type InsertInventory,
  type Activity,
  type InsertActivity,
  type Class,
  type InsertClass,
  type FeeStructure,
  type InsertFeeStructure,
  type FeeInstallment,
  type InsertFeeInstallment,
  type FeePayment,
  type InsertFeePayment,
  type Reminder,
  type InsertReminder
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Student methods
  getStudents(): Promise<Student[]>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Class methods
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;
  
  // Fee Structure methods
  getFeeStructures(): Promise<FeeStructure[]>;
  getFeeStructuresByClass(classId: number): Promise<FeeStructure[]>;
  getFeeStructure(id: number): Promise<FeeStructure | undefined>;
  createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure>;
  updateFeeStructure(id: number, feeStructure: Partial<InsertFeeStructure>): Promise<FeeStructure | undefined>;
  deleteFeeStructure(id: number): Promise<boolean>;
  
  // Fee Installment methods
  getFeeInstallments(feeStructureId?: number): Promise<FeeInstallment[]>;
  getFeeInstallment(id: number): Promise<FeeInstallment | undefined>;
  createFeeInstallment(installment: InsertFeeInstallment): Promise<FeeInstallment>;
  updateFeeInstallment(id: number, installment: Partial<InsertFeeInstallment>): Promise<FeeInstallment | undefined>;
  deleteFeeInstallment(id: number): Promise<boolean>;
  
  // Fee Payment methods
  getFeePayments(studentId?: number, installmentId?: number): Promise<FeePayment[]>;
  getFeePayment(id: number): Promise<FeePayment | undefined>;
  createFeePayment(payment: InsertFeePayment): Promise<FeePayment>;
  updateFeePayment(id: number, payment: Partial<InsertFeePayment>): Promise<FeePayment | undefined>;
  deleteFeePayment(id: number): Promise<boolean>;
  
  // Reminder methods
  getReminders(studentId?: number): Promise<Reminder[]>;
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;
  
  // Fee Reports methods
  getPendingFees(classId?: number): Promise<any[]>;
  getDailyFeeCollection(date: Date): Promise<any[]>;
  getMonthlyFeeCollection(year: number, month: number): Promise<any[]>;
  
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
  private classes: Map<number, Class>;
  private feeStructures: Map<number, FeeStructure>;
  private feeInstallments: Map<number, FeeInstallment>;
  private feePayments: Map<number, FeePayment>;
  private reminders: Map<number, Reminder>;
  
  private studentId: number;
  private expenseId: number;
  private inventoryId: number;
  private activityId: number;
  private classId: number;
  private feeStructureId: number;
  private feeInstallmentId: number;
  private feePaymentId: number;
  private reminderId: number;

  constructor() {
    this.students = new Map();
    this.expenses = new Map();
    this.inventory = new Map();
    this.activities = new Map();
    this.classes = new Map();
    this.feeStructures = new Map();
    this.feeInstallments = new Map();
    this.feePayments = new Map();
    this.reminders = new Map();
    
    this.studentId = 1;
    this.expenseId = 1;
    this.inventoryId = 1;
    this.activityId = 1;
    this.classId = 1;
    this.feeStructureId = 1;
    this.feeInstallmentId = 1;
    this.feePaymentId = 1;
    this.reminderId = 1;
    
    // Initialize with sample data asynchronously
    setTimeout(() => {
      this.initializeSampleData().catch(err => {
        console.error("Error initializing sample data:", err);
      });
    }, 0);
  }

  // Class methods
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classes.values()).sort((a, b) => b.id - a.id);
  }

  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.classId++;
    const now = new Date();
    const newClass: Class = { 
      ...classData, 
      id, 
      createdAt: now,
      description: classData.description || null 
    };
    this.classes.set(id, newClass);
    
    // Log activity
    this.createActivity({
      type: 'class',
      action: 'create',
      details: { classId: id, name: newClass.name }
    });
    
    return newClass;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const classItem = this.classes.get(id);
    if (!classItem) return undefined;
    
    const updatedClass = { ...classItem, ...classData };
    this.classes.set(id, updatedClass);
    
    // Log activity
    this.createActivity({
      type: 'class',
      action: 'update',
      details: { classId: id, name: updatedClass.name }
    });
    
    return updatedClass;
  }

  async deleteClass(id: number): Promise<boolean> {
    const classItem = this.classes.get(id);
    if (!classItem) return false;
    
    // Check if any students are assigned to this class
    const studentsInClass = Array.from(this.students.values()).filter(student => student.classId === id);
    if (studentsInClass.length > 0) {
      return false; // Cannot delete class with students assigned
    }
    
    // Check if any fee structures are associated with this class
    const feeStructuresForClass = Array.from(this.feeStructures.values()).filter(fee => fee.classId === id);
    if (feeStructuresForClass.length > 0) {
      return false; // Cannot delete class with fee structures
    }
    
    const success = this.classes.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'class',
        action: 'delete',
        details: { classId: id, name: classItem.name }
      });
    }
    
    return success;
  }

  // Fee Structure methods
  async getFeeStructures(): Promise<FeeStructure[]> {
    return Array.from(this.feeStructures.values()).sort((a, b) => b.id - a.id);
  }

  async getFeeStructuresByClass(classId: number): Promise<FeeStructure[]> {
    return Array.from(this.feeStructures.values())
      .filter(fs => fs.classId === classId)
      .sort((a, b) => b.id - a.id);
  }

  async getFeeStructure(id: number): Promise<FeeStructure | undefined> {
    return this.feeStructures.get(id);
  }

  async createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const id = this.feeStructureId++;
    const now = new Date();
    const newFeeStructure: FeeStructure = { 
      ...feeStructure, 
      id, 
      createdAt: now,
      description: feeStructure.description || null
    };
    this.feeStructures.set(id, newFeeStructure);
    
    // Log activity
    this.createActivity({
      type: 'fee',
      action: 'create',
      details: { feeStructureId: id, name: newFeeStructure.name }
    });
    
    return newFeeStructure;
  }

  async updateFeeStructure(id: number, feeStructureData: Partial<InsertFeeStructure>): Promise<FeeStructure | undefined> {
    const feeStructure = this.feeStructures.get(id);
    if (!feeStructure) return undefined;
    
    const updatedFeeStructure = { ...feeStructure, ...feeStructureData };
    this.feeStructures.set(id, updatedFeeStructure);
    
    // Log activity
    this.createActivity({
      type: 'fee',
      action: 'update',
      details: { feeStructureId: id, name: updatedFeeStructure.name }
    });
    
    return updatedFeeStructure;
  }

  async deleteFeeStructure(id: number): Promise<boolean> {
    const feeStructure = this.feeStructures.get(id);
    if (!feeStructure) return false;
    
    // Check if any students are using this fee structure
    const studentsWithFee = Array.from(this.students.values()).filter(student => student.feeStructureId === id);
    if (studentsWithFee.length > 0) {
      return false; // Cannot delete fee structure in use by students
    }
    
    // Check if any fee installments are associated with this fee structure
    const installmentsForFee = Array.from(this.feeInstallments.values()).filter(inst => inst.feeStructureId === id);
    if (installmentsForFee.length > 0) {
      return false; // Cannot delete fee structure with installments
    }
    
    const success = this.feeStructures.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'fee',
        action: 'delete',
        details: { feeStructureId: id, name: feeStructure.name }
      });
    }
    
    return success;
  }

  // Fee Installment methods
  async getFeeInstallments(feeStructureId?: number): Promise<FeeInstallment[]> {
    let installments = Array.from(this.feeInstallments.values());
    
    if (feeStructureId) {
      installments = installments.filter(inst => inst.feeStructureId === feeStructureId);
    }
    
    return installments.sort((a, b) => b.id - a.id);
  }

  async getFeeInstallment(id: number): Promise<FeeInstallment | undefined> {
    return this.feeInstallments.get(id);
  }

  async createFeeInstallment(installment: InsertFeeInstallment): Promise<FeeInstallment> {
    const id = this.feeInstallmentId++;
    const now = new Date();
    const newInstallment: FeeInstallment = { ...installment, id, createdAt: now };
    this.feeInstallments.set(id, newInstallment);
    
    // Log activity
    this.createActivity({
      type: 'fee',
      action: 'create',
      details: { installmentId: id, name: newInstallment.name }
    });
    
    return newInstallment;
  }

  async updateFeeInstallment(id: number, installmentData: Partial<InsertFeeInstallment>): Promise<FeeInstallment | undefined> {
    const installment = this.feeInstallments.get(id);
    if (!installment) return undefined;
    
    const updatedInstallment = { ...installment, ...installmentData };
    this.feeInstallments.set(id, updatedInstallment);
    
    // Log activity
    this.createActivity({
      type: 'fee',
      action: 'update',
      details: { installmentId: id, name: updatedInstallment.name }
    });
    
    return updatedInstallment;
  }

  async deleteFeeInstallment(id: number): Promise<boolean> {
    const installment = this.feeInstallments.get(id);
    if (!installment) return false;
    
    // Check if any payments are associated with this installment
    const paymentsForInstallment = Array.from(this.feePayments.values()).filter(payment => payment.installmentId === id);
    if (paymentsForInstallment.length > 0) {
      return false; // Cannot delete installment with payments
    }
    
    // Check if any reminders are associated with this installment
    const remindersForInstallment = Array.from(this.reminders.values()).filter(reminder => reminder.installmentId === id);
    if (remindersForInstallment.length > 0) {
      return false; // Cannot delete installment with reminders
    }
    
    const success = this.feeInstallments.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'fee',
        action: 'delete',
        details: { installmentId: id, name: installment.name }
      });
    }
    
    return success;
  }

  // Student methods
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).sort((a, b) => b.id - a.id);
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return Array.from(this.students.values())
      .filter(student => student.classId === classId)
      .sort((a, b) => b.id - a.id);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.studentId++;
    const now = new Date();
    const student: Student = { 
      ...insertStudent, 
      id, 
      createdAt: now,
      // Ensure correct null types for optional fields
      email: insertStudent.email || null,
      address: insertStudent.address || null,
      notes: insertStudent.notes || null,
      classId: insertStudent.classId || null,
      feeStructureId: insertStudent.feeStructureId || null,
      age: insertStudent.age || null,
      status: insertStudent.status || "active"
    };
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
    
    // Check for fee payments associated with this student
    const paymentsForStudent = Array.from(this.feePayments.values()).filter(payment => payment.studentId === id);
    if (paymentsForStudent.length > 0) {
      return false; // Cannot delete student with payment history
    }
    
    // Check for reminders associated with this student
    const remindersForStudent = Array.from(this.reminders.values()).filter(reminder => reminder.studentId === id);
    if (remindersForStudent.length > 0) {
      return false; // Cannot delete student with reminders
    }
    
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
    const expense: Expense = { 
      ...insertExpense, 
      id, 
      createdAt: now,
      notes: insertExpense.notes || null 
    };
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
    const item: Inventory = { 
      ...insertInventory, 
      id, 
      lastUpdated: now,
      notes: insertInventory.notes || null 
    };
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

  // Fee Payment methods
  async getFeePayments(studentId?: number, installmentId?: number): Promise<FeePayment[]> {
    let payments = Array.from(this.feePayments.values());
    
    if (studentId) {
      payments = payments.filter(payment => payment.studentId === studentId);
    }
    
    if (installmentId) {
      payments = payments.filter(payment => payment.installmentId === installmentId);
    }
    
    return payments.sort((a, b) => b.id - a.id);
  }

  async getFeePayment(id: number): Promise<FeePayment | undefined> {
    return this.feePayments.get(id);
  }

  async createFeePayment(payment: InsertFeePayment): Promise<FeePayment> {
    const id = this.feePaymentId++;
    const now = new Date();
    const newPayment: FeePayment = { 
      ...payment, 
      id, 
      createdAt: now,
      notes: payment.notes || null,
      receiptNumber: payment.receiptNumber || null
    };
    this.feePayments.set(id, newPayment);
    
    // Get student and installment details for the activity log
    const student = this.students.get(newPayment.studentId);
    const installment = this.feeInstallments.get(newPayment.installmentId);
    
    // Log activity
    this.createActivity({
      type: 'payment',
      action: 'create',
      details: { 
        paymentId: id, 
        studentName: student?.fullName || 'Unknown', 
        installmentName: installment?.name || 'Unknown',
        amount: newPayment.amount
      }
    });
    
    return newPayment;
  }

  async updateFeePayment(id: number, paymentData: Partial<InsertFeePayment>): Promise<FeePayment | undefined> {
    const payment = this.feePayments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...paymentData };
    this.feePayments.set(id, updatedPayment);
    
    // Log activity
    this.createActivity({
      type: 'payment',
      action: 'update',
      details: { paymentId: id, amount: updatedPayment.amount }
    });
    
    return updatedPayment;
  }

  async deleteFeePayment(id: number): Promise<boolean> {
    const payment = this.feePayments.get(id);
    if (!payment) return false;
    
    const success = this.feePayments.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'payment',
        action: 'delete',
        details: { paymentId: id }
      });
    }
    
    return success;
  }

  // Reminder methods
  async getReminders(studentId?: number): Promise<Reminder[]> {
    let reminders = Array.from(this.reminders.values());
    
    if (studentId) {
      reminders = reminders.filter(reminder => reminder.studentId === studentId);
    }
    
    return reminders.sort((a, b) => b.id - a.id);
  }

  async getReminder(id: number): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const id = this.reminderId++;
    const now = new Date();
    const newReminder: Reminder = { 
      ...reminder, 
      id, 
      createdAt: now,
      sentDate: null,
      status: reminder.status || "pending"
    };
    this.reminders.set(id, newReminder);
    
    // Get student details for the activity log
    const student = this.students.get(newReminder.studentId);
    
    // Log activity
    this.createActivity({
      type: 'reminder',
      action: 'create',
      details: { 
        reminderId: id, 
        studentName: student?.fullName || 'Unknown',
        status: newReminder.status
      }
    });
    
    return newReminder;
  }

  async updateReminder(id: number, reminderData: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const reminder = this.reminders.get(id);
    if (!reminder) return undefined;
    
    // If status is changing to "sent", update sentDate
    let sentDate = reminder.sentDate;
    if (reminderData.status === 'sent' && reminder.status !== 'sent') {
      sentDate = new Date();
    }
    
    const updatedReminder = { ...reminder, ...reminderData, sentDate };
    this.reminders.set(id, updatedReminder);
    
    // Log activity
    this.createActivity({
      type: 'reminder',
      action: 'update',
      details: { 
        reminderId: id, 
        status: updatedReminder.status 
      }
    });
    
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const reminder = this.reminders.get(id);
    if (!reminder) return false;
    
    const success = this.reminders.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'reminder',
        action: 'delete',
        details: { reminderId: id }
      });
    }
    
    return success;
  }

  // Fee Reports methods
  async getPendingFees(classId?: number): Promise<any[]> {
    let students: Student[] = [];
    
    if (classId) {
      // Get students in the specific class
      students = Array.from(this.students.values())
        .filter(student => student.classId === classId && student.status === 'active');
    } else {
      // Get all active students
      students = Array.from(this.students.values())
        .filter(student => student.status === 'active');
    }
    
    // Get fee installments and payments for students
    const result = [];
    
    for (const student of students) {
      // Skip if student has no fee structure assigned
      if (!student.feeStructureId) continue;
      
      const feeStructure = this.feeStructures.get(student.feeStructureId);
      if (!feeStructure) continue;
      
      // Get installments for this fee structure
      const installments = Array.from(this.feeInstallments.values())
        .filter(inst => inst.feeStructureId === feeStructure.id);
      
      for (const installment of installments) {
        // Check if payment for this installment exists
        const payments = Array.from(this.feePayments.values())
          .filter(payment => 
            payment.studentId === student.id && 
            payment.installmentId === installment.id
          );
        
        // Calculate total paid amount
        const totalPaid = payments.reduce((sum, payment) => {
          return sum + parseFloat(payment.amount.toString());
        }, 0);
        
        // Calculate due amount
        const dueAmount = parseFloat(installment.amount.toString()) - totalPaid;
        
        // Add to result if there's a pending amount
        if (dueAmount > 0) {
          result.push({
            studentId: student.id,
            studentName: student.fullName,
            classId: student.classId,
            className: student.classId ? (this.classes.get(student.classId)?.name || 'Unknown') : 'Not Assigned',
            feeStructureId: feeStructure.id,
            feeStructureName: feeStructure.name,
            installmentId: installment.id,
            installmentName: installment.name,
            dueDate: installment.dueDate,
            totalAmount: installment.amount,
            paidAmount: totalPaid,
            dueAmount,
            status: new Date(installment.dueDate) < new Date() ? 'overdue' : 'upcoming'
          });
        }
      }
    }
    
    // Sort by due date, with overdue first
    return result.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  async getDailyFeeCollection(date: Date): Promise<any> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Get payments made on the specified date
    const paymentsOnDate = Array.from(this.feePayments.values())
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= targetDate && paymentDate < nextDay;
      });
    
    // Group payments by payment method
    const paymentsByMethod: { [key: string]: number } = {};
    let totalCollected = 0;
    
    for (const payment of paymentsOnDate) {
      const amount = parseFloat(payment.amount.toString());
      totalCollected += amount;
      
      if (paymentsByMethod[payment.paymentMethod]) {
        paymentsByMethod[payment.paymentMethod] += amount;
      } else {
        paymentsByMethod[payment.paymentMethod] = amount;
      }
    }
    
    return {
      date: targetDate.toISOString().split('T')[0],
      totalCollected,
      paymentDetails: paymentsOnDate.map(payment => {
        const student = this.students.get(payment.studentId);
        const installment = this.feeInstallments.get(payment.installmentId);
        
        return {
          paymentId: payment.id,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          receiptNumber: payment.receiptNumber,
          studentName: student ? student.fullName : 'Unknown',
          installmentName: installment ? installment.name : 'Unknown'
        };
      }),
      summary: Object.entries(paymentsByMethod).map(([method, amount]) => ({
        paymentMethod: method,
        amount
      }))
    };
  }

  async getMonthlyFeeCollection(year: number, month: number): Promise<any> {
    // Month is 0-based (0 = January, 11 = December)
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month
    
    // Get payments made during the specified month
    const paymentsInMonth = Array.from(this.feePayments.values())
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    
    // Group payments by day of month
    const paymentsByDay: { [key: number]: number } = {};
    let totalCollected = 0;
    
    for (const payment of paymentsInMonth) {
      const paymentDate = new Date(payment.paymentDate);
      const day = paymentDate.getDate();
      const amount = parseFloat(payment.amount.toString());
      
      totalCollected += amount;
      
      if (paymentsByDay[day]) {
        paymentsByDay[day] += amount;
      } else {
        paymentsByDay[day] = amount;
      }
    }
    
    // Group payments by payment method
    const paymentsByMethod: { [key: string]: number } = {};
    
    for (const payment of paymentsInMonth) {
      const amount = parseFloat(payment.amount.toString());
      
      if (paymentsByMethod[payment.paymentMethod]) {
        paymentsByMethod[payment.paymentMethod] += amount;
      } else {
        paymentsByMethod[payment.paymentMethod] = amount;
      }
    }
    
    return {
      year,
      month: month + 1, // Convert to 1-based for reporting
      totalCollected,
      dailyCollection: Object.entries(paymentsByDay).map(([day, amount]) => ({
        day: parseInt(day),
        amount
      })),
      methodSummary: Object.entries(paymentsByMethod).map(([method, amount]) => ({
        paymentMethod: method,
        amount
      }))
    };
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
  private async initializeSampleData() {
    // Initial classes
    const classes = [
      {
        name: "Toddler Group",
        academicYear: "2023-2024",
        description: "Ages 2-3 years"
      },
      {
        name: "Preschool Group",
        academicYear: "2023-2024",
        description: "Ages 3-4 years"
      },
      {
        name: "Kindergarten Ready",
        academicYear: "2023-2024",
        description: "Ages 4-5 years"
      }
    ];

    // Create classes and collect their IDs
    const classIds: number[] = [];
    for (const classData of classes) {
      const newClass = await this.createClass(classData);
      classIds.push(newClass.id);
    }

    // Initial fee structures
    const feeStructures = [
      {
        name: "Standard Tuition - Toddler",
        classId: classIds[0],
        totalAmount: "4500.00",
        academicYear: "2023-2024",
        description: "Standard fee structure for toddler group"
      },
      {
        name: "Standard Tuition - Preschool",
        classId: classIds[1],
        totalAmount: "5000.00",
        academicYear: "2023-2024",
        description: "Standard fee structure for preschool group"
      },
      {
        name: "Standard Tuition - Kindergarten Ready",
        classId: classIds[2],
        totalAmount: "5500.00",
        academicYear: "2023-2024",
        description: "Standard fee structure for kindergarten ready group"
      }
    ];

    // Create fee structures and collect their IDs
    const feeStructureIds: number[] = [];
    for (const feeStructureData of feeStructures) {
      const newFeeStructure = await this.createFeeStructure(feeStructureData);
      feeStructureIds.push(newFeeStructure.id);
    }

    // Initial fee installments for each fee structure
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextMonth = (now.getMonth() + 1) % 12;
    const twoMonthsLater = (now.getMonth() + 2) % 12;

    // Create 3 installments for each fee structure (e.g., fall, winter, spring terms)
    for (let i = 0; i < feeStructureIds.length; i++) {
      const feeStructureId = feeStructureIds[i];
      const baseFee = parseFloat(feeStructures[i].totalAmount);
      const installmentAmount = (baseFee / 3).toFixed(2);
      
      // Format dates as ISO strings
      const prevMonthDate = new Date(currentYear, now.getMonth() - 1, 15);
      const nextMonthDate = new Date(currentYear, nextMonth, 15);
      const twoMonthsLaterDate = new Date(currentYear, twoMonthsLater, 15);
      
      // First installment (already due)
      await this.createFeeInstallment({
        feeStructureId,
        name: "Fall Term",
        amount: installmentAmount,
        dueDate: prevMonthDate.toISOString().split('T')[0]
      });
      
      // Second installment (due next month)
      await this.createFeeInstallment({
        feeStructureId,
        name: "Winter Term",
        amount: installmentAmount,
        dueDate: nextMonthDate.toISOString().split('T')[0]
      });
      
      // Third installment (due in two months)
      await this.createFeeInstallment({
        feeStructureId,
        name: "Spring Term",
        amount: installmentAmount,
        dueDate: twoMonthsLaterDate.toISOString().split('T')[0]
      });
    }

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
        classId: classIds[2], // Kindergarten Ready
        feeStructureId: feeStructureIds[2], // Kindergarten Ready fee structure
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
        classId: classIds[1], // Preschool Group
        feeStructureId: feeStructureIds[1], // Preschool fee structure
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
        classId: classIds[2], // Kindergarten Ready
        feeStructureId: feeStructureIds[2], // Kindergarten Ready fee structure
        notes: "On vacation until next week"
      }
    ];

    // Create students
    const studentIds: number[] = [];
    for (const student of students) {
      const newStudent = await this.createStudent(student);
      studentIds.push(newStudent.id);
    }

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

    for (const expense of expenses) {
      await this.createExpense(expense);
    }

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

    for (const item of inventoryItems) {
      await this.createInventoryItem(item);
    }
    
    // Add sample fee payments for the first student and first installment
    if (studentIds.length > 0 && feeStructureIds.length > 0) {
      // Get the first installment for the student's fee structure
      const studentId = studentIds[0];
      const student = await this.getStudent(studentId);
      
      if (student && student.feeStructureId) {
        const installments = await this.getFeeInstallments(student.feeStructureId);
        
        if (installments.length > 0) {
          const firstInstallment = installments[0];
          const halfAmount = parseFloat(firstInstallment.amount.toString()) / 2;
          
          // Create a partial payment for the first installment
          await this.createFeePayment({
            studentId,
            installmentId: firstInstallment.id,
            paymentDate: new Date().toISOString().split('T')[0],
            amount: halfAmount.toFixed(2),
            paymentMethod: "Cash",
            receiptNumber: "RC-001",
            notes: "Partial payment for Fall Term"
          });
        }
      }
    }
  }
}

export const storage = new MemStorage();
