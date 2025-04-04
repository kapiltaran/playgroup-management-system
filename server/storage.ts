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
  type InsertReminder,
  type Setting,
  type InsertSetting,
  type User,
  type InsertUser,
  type RolePermission,
  type InsertRolePermission,
  type TeacherClass,
  type InsertTeacherClass,
  type Attendance,
  type InsertAttendance,
  type AcademicYear,
  type InsertAcademicYear
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Student methods
  getStudents(userId?: number): Promise<Student[]>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  getStudentsByParent(userId: number): Promise<Student[]>;
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
  
  // Settings methods
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  createOrUpdateSetting(setting: InsertSetting): Promise<Setting>;
  deleteSetting(id: number): Promise<boolean>;
  
  // User methods
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(userData: Omit<InsertUser, 'password' | 'confirmPassword'> & { 
    passwordHash: string,
    emailVerified?: boolean,
    verificationToken?: string | null,
    verificationTokenExpires?: Date | null,
    resetPasswordToken?: string | null,
    resetPasswordExpires?: Date | null,
    mfaEnabled?: boolean,
    mfaSecret?: string | null
  }): Promise<User>;
  updateUser(id: number, userData: Partial<Omit<InsertUser, 'password' | 'confirmPassword'>> & {
    emailVerified?: boolean,
    verificationToken?: string | null,
    verificationTokenExpires?: Date | null,
    resetPasswordToken?: string | null,
    resetPasswordExpires?: Date | null,
    mfaEnabled?: boolean,
    mfaSecret?: string | null
  }): Promise<User | undefined>;
  updateUserPassword(id: number, passwordHash: string): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  updateLastLogin(id: number): Promise<boolean>;
  
  // Role Permission methods
  getRolePermissions(role?: string): Promise<RolePermission[]>;
  getRolePermission(id: number): Promise<RolePermission | undefined>;
  getRoleModulePermission(role: string, module: string): Promise<RolePermission | undefined>;
  createRolePermission(permission: InsertRolePermission): Promise<RolePermission>;
  updateRolePermission(id: number, permission: Partial<InsertRolePermission>): Promise<RolePermission | undefined>;
  deleteRolePermission(id: number): Promise<boolean>;
  
  // Check module permissions
  checkPermission(role: string, module: string, permission: 'view' | 'create' | 'edit' | 'delete'): Promise<boolean>;
  getModulePermissions(role: string): Promise<Record<string, {canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean}>>;
  
  // Teacher-Class methods
  getTeacherClasses(teacherId?: number): Promise<(TeacherClass & { class: Class })[]>;
  getClassTeachers(classId: number): Promise<(TeacherClass & { teacher: User })[]>;
  assignTeacherToClass(teacherId: number, classId: number): Promise<TeacherClass>;
  removeTeacherFromClass(teacherId: number, classId: number): Promise<boolean>;
  
  // Attendance methods
  getAttendance(classId: number, date?: Date): Promise<Attendance[]>;
  getStudentAttendance(studentId: number, startDate?: Date, endDate?: Date): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  getClassAttendanceReport(classId: number, month: number, year: number): Promise<any[]>;
  
  // Academic Year methods
  getAllAcademicYears(): Promise<AcademicYear[]>;
  getCurrentAcademicYear(): Promise<AcademicYear | undefined>;
  getAcademicYearById(id: number): Promise<AcademicYear | undefined>;
  createAcademicYear(data: InsertAcademicYear): Promise<AcademicYear>;
  updateAcademicYear(id: number, data: Partial<InsertAcademicYear>): Promise<AcademicYear | undefined>;
  deleteAcademicYear(id: number): Promise<boolean>;
  updateAllAcademicYearsToNotCurrent(): Promise<void>;
  checkAcademicYearReferences(id: number): Promise<boolean>;
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
  private settings: Map<number, Setting>;
  private users: Map<number, User>;
  private rolePermissions: Map<number, RolePermission>;
  private teacherClasses: Map<string, TeacherClass>; // Key: teacherId-classId
  private attendance: Map<number, Attendance>;
  private academicYears: Map<number, AcademicYear>;
  
  private studentId: number;
  private expenseId: number;
  private inventoryId: number;
  private activityId: number;
  private classId: number;
  private feeStructureId: number;
  private feeInstallmentId: number;
  private feePaymentId: number;
  private reminderId: number;
  private settingId: number;
  private userId: number;
  private rolePermissionId: number;
  private attendanceId: number;
  private academicYearId: number;

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
    this.settings = new Map();
    this.users = new Map();
    this.rolePermissions = new Map();
    this.teacherClasses = new Map();
    this.attendance = new Map();
    this.academicYears = new Map();
    
    this.studentId = 1;
    this.expenseId = 1;
    this.inventoryId = 1;
    this.activityId = 1;
    this.classId = 1;
    this.feeStructureId = 1;
    this.feeInstallmentId = 1;
    this.feePaymentId = 1;
    this.reminderId = 1;
    this.settingId = 1;
    this.userId = 1;
    this.rolePermissionId = 1;
    this.attendanceId = 1;
    this.academicYearId = 1;
    
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
  async getStudents(userId?: number): Promise<Student[]> {
    // If no userId provided, return all students
    if (!userId) {
      return Array.from(this.students.values()).sort((a, b) => b.id - a.id);
    }
    
    // Get the user and check their role
    const user = this.users.get(userId);
    if (!user) {
      return [];
    }
    
    // If the user is a parent, return only their students
    if (user.role === 'parent') {
      return this.getStudentsByParent(userId);
    }
    
    // If the user is a teacher, return only students in their assigned classes
    if (user.role === 'teacher') {
      // Get all classes the teacher is assigned to
      const teacherClasses = Array.from(this.teacherClasses.values())
        .filter(tc => tc.teacherId === userId)
        .map(tc => tc.classId);
      
      if (teacherClasses.length === 0) {
        return []; // Teacher is not assigned to any classes
      }
      
      // Get all students in those classes
      return Array.from(this.students.values())
        .filter(student => student.classId !== null && teacherClasses.includes(student.classId))
        .sort((a, b) => b.id - a.id);
    }
    
    // For admin roles, return all students
    return Array.from(this.students.values()).sort((a, b) => b.id - a.id);
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return Array.from(this.students.values())
      .filter(student => student.classId === classId)
      .sort((a, b) => b.id - a.id);
  }

  async getStudentsByParent(userId: number): Promise<Student[]> {
    // Get the user to check if it's a parent
    const user = this.users.get(userId);
    if (!user || user.role !== 'parent') {
      console.log(`User ${userId} is not a parent or doesn't exist`);
      return [];
    }

    console.log(`🔍 Finding students for parent user ID ${userId}, username: ${user.username}, email: ${user.email}, linked student: ${user.studentId}`);

    // For parents, we only return students linked to their account
    const allStudents = Array.from(this.students.values());
    console.log(`Total students in system: ${allStudents.length}`);
    
    // Keep track of matched student IDs to avoid duplicates
    const matchedStudentIds = new Set<number>();
    
    const matchingStudents = allStudents.filter(student => {
      // Skip if already matched
      if (matchedStudentIds.has(student.id)) {
        return true;
      }
      
      console.log(`Checking student ${student.id} (${student.fullName}), email: ${student.email || 'none'}`);
      
      // Check if the student is linked to this parent user via studentId
      if (user.studentId && user.studentId === student.id) {
        console.log(`✅ MATCH: Student ${student.id} (${student.fullName}) matches parent's studentId: ${user.studentId}`);
        matchedStudentIds.add(student.id);
        return true;
      }
      
      // Check if the parent's email matches the student's email
      if (student.email && user.email && student.email.toLowerCase() === user.email.toLowerCase()) {
        console.log(`✅ MATCH: Student ${student.id} (${student.fullName}) email matches parent's email: ${user.email}`);
        matchedStudentIds.add(student.id);
        return true;
      }
      
      // Special case for test users - match by guardian email
      // For real applications, we would probably have a more robust parent-student relationship table
      if (user.email && student.email && user.email.toLowerCase() === student.email.toLowerCase()) {
        console.log(`✅ MATCH: Parent email ${user.email} matches student ${student.id} (${student.fullName}) email ${student.email}`);
        matchedStudentIds.add(student.id);
        return true;
      }
        
      return false;
    });
    
    console.log(`Found ${matchingStudents.length} students for parent ${user.username} (ID: ${userId})`);
    return matchingStudents.sort((a, b) => b.id - a.id);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = this.studentId++;
    const now = new Date();
    const student: Student = { 
      id,
      fullName: insertStudent.fullName,
      dateOfBirth: insertStudent.dateOfBirth,
      age: insertStudent.age || null,
      gender: insertStudent.gender,
      guardianName: insertStudent.guardianName,
      phone: insertStudent.phone,
      email: insertStudent.email,
      address: insertStudent.address || null,
      city: insertStudent.city || null,
      postalCode: insertStudent.postalCode || null,
      state: insertStudent.state || null,
      country: insertStudent.country || null,
      status: insertStudent.status || "active",
      classId: insertStudent.classId || null,
      feeStructureId: insertStudent.feeStructureId || null,
      notes: insertStudent.notes || null,
      createdAt: now
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

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values()).sort((a, b) => b.id - a.id);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    // Find the setting with the matching key
    const settings = Array.from(this.settings.values());
    return settings.find(setting => setting.key === key);
  }

  async createOrUpdateSetting(setting: InsertSetting): Promise<Setting> {
    // Check if the setting with this key already exists
    const existingSetting = await this.getSetting(setting.key);
    
    if (existingSetting) {
      // Update existing setting
      const updatedSetting = {
        ...existingSetting,
        value: setting.value,
        description: setting.description || null,
        updatedAt: new Date()
      };
      this.settings.set(existingSetting.id, updatedSetting);

      // Log activity
      this.createActivity({
        type: 'settings',
        action: 'update',
        details: { settingKey: setting.key, value: setting.value }
      });
      
      return updatedSetting;
    } else {
      // Create new setting
      const id = this.settingId++;
      const now = new Date();
      const newSetting: Setting = { 
        id,
        key: setting.key,
        value: setting.value,
        description: setting.description || null,
        updatedAt: now
      };
      this.settings.set(id, newSetting);

      // Log activity
      this.createActivity({
        type: 'settings',
        action: 'create',
        details: { settingKey: setting.key, value: setting.value }
      });
      
      return newSetting;
    }
  }

  async deleteSetting(id: number): Promise<boolean> {
    const setting = this.settings.get(id);
    if (!setting) return false;
    
    const success = this.settings.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'settings',
        action: 'delete',
        details: { settingKey: setting.key }
      });
    }
    
    return success;
  }

  // Initialize sample data
  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => b.id - a.id);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === role)
      .sort((a, b) => b.id - a.id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(userData: Omit<InsertUser, 'password' | 'confirmPassword'> & { 
    passwordHash: string,
    emailVerified?: boolean,
    verificationToken?: string | null,
    verificationTokenExpires?: Date | null,
    resetPasswordToken?: string | null,
    resetPasswordExpires?: Date | null,
    mfaEnabled?: boolean,
    mfaSecret?: string | null
  }): Promise<User> {
    console.log("\n\n🚨🚨🚨 STORAGE - createUser called 🚨🚨🚨");
    console.log("🔹 User data:", {
      ...userData,
      passwordHash: "REDACTED", // Don't log sensitive information
      studentId: userData.studentId || null,
      emailVerified: userData.emailVerified || false,
      hasVerificationToken: !!userData.verificationToken,
      hasVerificationTokenExpires: !!userData.verificationTokenExpires
    });
    
    // Check if user with the same email exists
    try {
      const existingByEmail = await this.getUserByEmail(userData.email);
      if (existingByEmail) {
        console.log("🔸 WARNING: User with this email already exists:", existingByEmail.email);
      }
      
      // Check if user with the same username exists
      const existingByUsername = await this.getUserByUsername(userData.username);
      if (existingByUsername) {
        console.log("🔸 WARNING: User with this username already exists:", existingByUsername.username);
      }
    } catch (error) {
      console.error("🔻 ERROR checking existing users:", error);
    }
    
    const id = this.userId++;
    const now = new Date();
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      lastLogin: null,
      active: userData.active !== undefined ? userData.active : true,
      studentId: userData.studentId || null,
      role: userData.role || 'parent', // Ensure role is never undefined
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
      verificationToken: userData.verificationToken || null,
      verificationTokenExpires: userData.verificationTokenExpires || null,
      resetPasswordToken: userData.resetPasswordToken || null,
      resetPasswordExpires: userData.resetPasswordExpires || null,
      mfaEnabled: userData.mfaEnabled !== undefined ? userData.mfaEnabled : false,
      mfaSecret: userData.mfaSecret || null
    };
    
    this.users.set(id, user);
    
    // Log activity
    this.createActivity({
      type: 'user',
      action: 'create',
      details: { userId: id, username: user.username, role: user.role }
    });
    
    return user;
  }

  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'password' | 'confirmPassword'>>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    // Log activity
    this.createActivity({
      type: 'user',
      action: 'update',
      details: { userId: id, username: updatedUser.username }
    });
    
    return updatedUser;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const updatedUser = { ...user, passwordHash };
    this.users.set(id, updatedUser);
    
    // Log activity
    this.createActivity({
      type: 'user',
      action: 'password_update',
      details: { userId: id, username: user.username }
    });
    
    return true;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    // Check if this is the last superadmin
    if (user.role === 'superadmin') {
      const superAdmins = Array.from(this.users.values()).filter(u => u.role === 'superadmin');
      if (superAdmins.length <= 1) {
        return false; // Cannot delete the last superadmin
      }
    }
    
    const success = this.users.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'user',
        action: 'delete',
        details: { userId: id, username: user.username }
      });
    }
    
    return success;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    const now = new Date();
    const updatedUser = { ...user, lastLogin: now };
    this.users.set(id, updatedUser);
    
    return true;
  }

  // Role Permission methods
  async getRolePermissions(role?: string): Promise<RolePermission[]> {
    let permissions = Array.from(this.rolePermissions.values());
    
    if (role) {
      permissions = permissions.filter(perm => perm.role === role);
    }
    
    return permissions.sort((a, b) => b.id - a.id);
  }

  async getRolePermission(id: number): Promise<RolePermission | undefined> {
    return this.rolePermissions.get(id);
  }

  async getRoleModulePermission(role: string, module: string): Promise<RolePermission | undefined> {
    return Array.from(this.rolePermissions.values()).find(
      perm => perm.role === role && perm.module === module
    );
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const id = this.rolePermissionId++;
    const now = new Date();
    // Ensure all boolean fields are defined
    const newPermission: RolePermission = {
      ...permission,
      id,
      createdAt: now,
      updatedAt: now,
      canView: permission.canView === undefined ? false : permission.canView,
      canCreate: permission.canCreate === undefined ? false : permission.canCreate,
      canEdit: permission.canEdit === undefined ? false : permission.canEdit,
      canDelete: permission.canDelete === undefined ? false : permission.canDelete
    };
    this.rolePermissions.set(id, newPermission);
    
    // Log activity
    this.createActivity({
      type: 'role',
      action: 'create',
      details: { role: newPermission.role, module: newPermission.module }
    });
    
    return newPermission;
  }

  async updateRolePermission(id: number, permissionData: Partial<InsertRolePermission>): Promise<RolePermission | undefined> {
    const permission = this.rolePermissions.get(id);
    if (!permission) return undefined;
    
    const now = new Date();
    const updatedPermission = { ...permission, ...permissionData, updatedAt: now };
    this.rolePermissions.set(id, updatedPermission);
    
    // Log activity
    this.createActivity({
      type: 'role',
      action: 'update',
      details: { role: updatedPermission.role, module: updatedPermission.module }
    });
    
    return updatedPermission;
  }

  async deleteRolePermission(id: number): Promise<boolean> {
    const permission = this.rolePermissions.get(id);
    if (!permission) return false;
    
    const success = this.rolePermissions.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'role',
        action: 'delete',
        details: { role: permission.role, module: permission.module }
      });
    }
    
    return success;
  }

  // Check module permissions
  async checkPermission(role: string, module: string, permission: 'view' | 'create' | 'edit' | 'delete'): Promise<boolean> {
    // Superadmin always has all permissions
    if (role === 'superadmin') return true;
    
    const rolePermission = await this.getRoleModulePermission(role, module);
    if (!rolePermission) return false;
    
    switch (permission) {
      case 'view':
        return rolePermission.canView;
      case 'create':
        return rolePermission.canCreate;
      case 'edit':
        return rolePermission.canEdit;
      case 'delete':
        return rolePermission.canDelete;
      default:
        return false;
    }
  }

  async getModulePermissions(role: string): Promise<Record<string, {canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean}>> {
    // If superadmin, return all permissions
    if (role === 'superadmin') {
      const modules = [
        'students', 
        'classes', 
        'fee_management', 
        'fee_payments', 
        'expenses', 
        'inventory', 
        'reports',
        'settings',
        'user_management',
        'role_management'
      ];
      
      const result: Record<string, {canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean}> = {};
      
      modules.forEach(module => {
        result[module] = {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true
        };
      });
      
      return result;
    }
    
    // Otherwise get the role's permissions
    const permissions = await this.getRolePermissions(role);
    const result: Record<string, {canView: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean}> = {};
    
    permissions.forEach(perm => {
      result[perm.module] = {
        canView: perm.canView,
        canCreate: perm.canCreate,
        canEdit: perm.canEdit,
        canDelete: perm.canDelete
      };
    });
    
    return result;
  }

  private async initializeTeacherClassAssociations() {
    try {
      // Get teachers
      const teacher1 = await this.getUserByUsername('john.teacher');
      const teacher2 = await this.getUserByUsername('mary.teacher');
      
      if (!teacher1 && !teacher2) {
        console.log("No teachers found to assign classes");
        return;
      }
      
      // Create a new teacher if needed
      let teacher2Id = 0;
      if (!teacher2) {
        const newTeacher = await this.createUser({
          username: 'mary.teacher',
          email: 'mary.teacher@playgroupms.com',
          passwordHash: 'hashed_teacher123',
          fullName: 'Mary Teacher',
          role: 'teacher',
          emailVerified: true,
          active: true
        });
        teacher2Id = newTeacher.id;
      } else {
        teacher2Id = teacher2.id;
      }
      
      // Get classes
      const classes = await this.getClasses();
      
      if (classes.length < 3) {
        console.log("Not enough classes to assign teachers");
        return;
      }
      
      // Assign teachers to classes (make sure assignments match the expected class IDs in student data)
      if (teacher1) {
        // Assign first teacher to all classes to ensure coverage
        for (const classObj of classes) {
          await this.assignTeacherToClass(teacher1.id, classObj.id);
        }
        console.log(`Assigned teacher ${teacher1.fullName} to all classes for full coverage`);
      }
      
      // Also assign second teacher to all classes as backup
      if (teacher2Id) {
        for (const classObj of classes) {
          await this.assignTeacherToClass(teacher2Id, classObj.id);
        }
        console.log(`Assigned second teacher to all classes as backup`);
      }
    } catch (error) {
      console.error("Error initializing teacher-class associations:", error);
    }
  }
  
  private async initializeAttendanceRecords() {
    try {
      // Get students by class
      const students = await this.getStudents();
      
      if (students.length === 0) {
        console.log("No students found for attendance records");
        return;
      }
      
      // Create dates for attendance records
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Track successfully marked attendance
      let markedCount = 0;
      
      // Create sample attendance for each student
      for (const student of students) {
        if (!student.classId) continue;
        
        // Find teachers assigned to the student's class
        const classTeachers = await this.getClassTeachers(student.classId);
        
        if (classTeachers.length === 0) {
          console.log(`No teachers found for class ID ${student.classId}, skipping attendance for student ${student.fullName}`);
          continue;
        }
        
        // Use the first teacher in the list to mark attendance
        const markingTeacherId = classTeachers[0].teacherId;
        
        // Mark yesterday's attendance with random statuses
        const yesterdayStatus = ['present', 'absent', 'late', 'excused'][Math.floor(Math.random() * 4)] as 'present' | 'absent' | 'late' | 'excused';
        
        try {
          await this.markAttendance({
            studentId: student.id,
            classId: student.classId,
            date: yesterday.toISOString().split('T')[0],
            status: yesterdayStatus,
            markedById: markingTeacherId,
            notes: yesterdayStatus === 'late' ? 'Arrived 15 minutes late' : 
                   yesterdayStatus === 'excused' ? 'Doctor appointment' : null
          });
          
          // Mark today's attendance with random statuses, weighted toward present
          const todayStatus = ['present', 'present', 'present', 'late', 'absent', 'excused'][Math.floor(Math.random() * 6)] as 'present' | 'absent' | 'late' | 'excused';
          
          await this.markAttendance({
            studentId: student.id,
            classId: student.classId,
            date: today.toISOString().split('T')[0],
            status: todayStatus,
            markedById: markingTeacherId,
            notes: todayStatus === 'late' ? 'Traffic delay' : 
                   todayStatus === 'excused' ? 'Family emergency' : null
          });
          
          markedCount++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`Error marking attendance for student ${student.fullName}: ${errorMessage}`);
        }
      }
      
      console.log(`Created attendance records for ${markedCount} students over 2 days`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error initializing attendance records:", errorMessage);
    }
  }
  
  private async initializeSampleData() {
    // Create a default admin user
    const adminExists = await this.getUserByUsername('admin');
    if (!adminExists) {
      await this.createUser({
        username: 'admin',
        email: 'admin@playgroup.com',
        fullName: 'Administrator',
        role: 'superadmin' as 'superadmin', // Type assertion to match required type
        passwordHash: 'hashed_admin123', // In a real app, this would be properly hashed
        emailVerified: true,
        mfaEnabled: false,
        active: true
      });
    }
    
    // Create test users for different roles
    const testUsers = [
      {
        username: 'john.teacher',
        email: 'john.teacher@playgroup.com',
        fullName: 'John Teacher',
        role: 'teacher' as 'teacher', // Type assertion to match required type
        passwordHash: 'hashed_teacher123',
        emailVerified: true,
        mfaEnabled: false,
        active: true
      },
      {
        username: 'sarah.admin',
        email: 'sarah.admin@playgroup.com',
        fullName: 'Sarah Admin',
        role: 'officeadmin' as 'officeadmin', // Type assertion to match required type
        passwordHash: 'hashed_admin123',
        emailVerified: true,
        mfaEnabled: false,
        active: true
      },
      {
        username: 'emily.parent',
        email: 'john.smith@example.com', // Match with the first student's guardian email
        fullName: 'Emily Parent',
        role: 'parent' as 'parent', // Type assertion to match required type
        passwordHash: 'hashed_parent123',
        emailVerified: true,
        mfaEnabled: false,
        active: true
      }
    ];
    
    // Create users if they don't exist
    for (const userData of testUsers) {
      const userExists = await this.getUserByUsername(userData.username);
      if (!userExists) {
        await this.createUser(userData);
        console.log(`Created test user: ${userData.username} (${userData.role})`);
      }
    }
    
    // Create default role permissions with proper type definitions
    // Helper function to create properly typed role permissions
    const createPermissionConfig = (
      role: "parent" | "teacher" | "officeadmin" | "superadmin", 
      module: "students" | "classes" | "fee_management" | "fee_payments" | "expenses" | "inventory" | "reports" | "settings" | "user_management" | "role_management" | "attendance",
      canView: boolean, 
      canCreate: boolean, 
      canEdit: boolean, 
      canDelete: boolean
    ) => {
      return { role, module, canView, canCreate, canEdit, canDelete };
    };
    
    // Parent role - can only view student and fee data related to their children
    const parentPermissions = [
      createPermissionConfig('parent', 'students', true, false, false, false),
      createPermissionConfig('parent', 'fee_payments', true, true, false, false),
    ];
    
    // Teacher role - can manage students, classes, and attendance
    const teacherPermissions = [
      createPermissionConfig('teacher', 'students', true, true, true, false),
      createPermissionConfig('teacher', 'classes', true, false, true, false),
      createPermissionConfig('teacher', 'attendance', true, true, true, true),
    ];
    
    // Office admin role - can manage most modules except user and role management
    const officeAdminPermissions = [
      createPermissionConfig('officeadmin', 'students', true, true, true, true),
      createPermissionConfig('officeadmin', 'classes', true, true, true, true),
      createPermissionConfig('officeadmin', 'fee_management', true, true, true, true),
      createPermissionConfig('officeadmin', 'fee_payments', true, true, true, true),
      createPermissionConfig('officeadmin', 'expenses', true, true, true, true),
      createPermissionConfig('officeadmin', 'inventory', true, true, true, true),
      createPermissionConfig('officeadmin', 'reports', true, false, false, false),
      createPermissionConfig('officeadmin', 'settings', true, false, true, false),
      createPermissionConfig('officeadmin', 'user_management', true, true, true, false),
      createPermissionConfig('officeadmin', 'attendance', true, true, true, true),
    ];
    
    // Combine all permissions
    const allDefaultPermissions = [
      ...parentPermissions, 
      ...teacherPermissions, 
      ...officeAdminPermissions
    ];
    
    // Add default permissions if they don't exist
    for (const permission of allDefaultPermissions) {
      const existingPermission = await this.getRoleModulePermission(permission.role, permission.module);
      if (!existingPermission) {
        await this.createRolePermission(permission);
      }
    }
    
    // Initial settings
    await this.createOrUpdateSetting({
      key: "currency",
      value: "USD",
      description: "Default currency for fees and expenses"
    });
    
    // Initial academic years
    const academicYears = [
      {
        name: "2023-2024",
        startDate: "2023-08-01",
        endDate: "2024-05-31",
        isCurrent: true
      },
      {
        name: "2024-2025",
        startDate: "2024-08-01",
        endDate: "2025-05-31",
        isCurrent: false
      }
    ];
    
    // Create academic years and collect their IDs
    const academicYearIds: Record<string, number> = {};
    for (const yearData of academicYears) {
      const newYear = await this.createAcademicYear(yearData);
      academicYearIds[newYear.name] = newYear.id;
    }
    
    // Initial classes
    const classes = [
      {
        name: "Toddler Group",
        academicYearId: academicYearIds["2023-2024"],
        description: "Ages 2-3 years"
      },
      {
        name: "Preschool Group",
        academicYearId: academicYearIds["2023-2024"],
        description: "Ages 3-4 years"
      },
      {
        name: "Kindergarten Ready",
        academicYearId: academicYearIds["2023-2024"],
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
        academicYearId: academicYearIds["2023-2024"],
        description: "Standard fee structure for toddler group"
      },
      {
        name: "Standard Tuition - Preschool",
        classId: classIds[1],
        totalAmount: "5000.00",
        academicYearId: academicYearIds["2023-2024"],
        description: "Standard fee structure for preschool group"
      },
      {
        name: "Standard Tuition - Kindergarten Ready",
        classId: classIds[2],
        totalAmount: "5500.00",
        academicYearId: academicYearIds["2023-2024"],
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
    
    // Initialize teacher-class associations
    await this.initializeTeacherClassAssociations();
    
    // Initialize attendance records
    await this.initializeAttendanceRecords();
    
    console.log("✅ Sample data initialization complete, including teacher-class associations and attendance records");
  }
  
  // Teacher-Class methods
  async getTeacherClasses(teacherId?: number): Promise<(TeacherClass & { class: Class })[]> {
    // Get all teacher-class associations
    const associations = Array.from(this.teacherClasses.values());
    
    // Filter by teacherId if provided
    const filteredAssociations = teacherId 
      ? associations.filter(tc => tc.teacherId === teacherId)
      : associations;
    
    // Enrich with class data
    return filteredAssociations.map(tc => {
      const classData = this.classes.get(tc.classId);
      return {
        ...tc,
        class: classData!
      };
    });
  }
  
  async getClassTeachers(classId: number): Promise<(TeacherClass & { teacher: User })[]> {
    // Get teacher associations for this class
    const associations = Array.from(this.teacherClasses.values())
      .filter(tc => tc.classId === classId);
    
    // Enrich with teacher data
    return associations.map(tc => {
      const teacher = this.users.get(tc.teacherId);
      return {
        ...tc,
        teacher: teacher!
      };
    });
  }
  
  async assignTeacherToClass(teacherId: number, classId: number): Promise<TeacherClass> {
    // Ensure the teacher and class exist
    const teacher = this.users.get(teacherId);
    const classObj = this.classes.get(classId);
    
    if (!teacher || !classObj) {
      throw new Error("Teacher or class not found");
    }
    
    if (teacher.role !== 'teacher') {
      throw new Error("User is not a teacher");
    }
    
    const key = `${teacherId}-${classId}`;
    const now = new Date();
    
    // Check if the association already exists
    if (this.teacherClasses.has(key)) {
      return this.teacherClasses.get(key)!;
    }
    
    // Create the association
    const association: TeacherClass = {
      teacherId,
      classId,
      assignedDate: now
    };
    
    this.teacherClasses.set(key, association);
    
    // Log activity
    this.createActivity({
      type: 'teacher',
      action: 'assign',
      details: { 
        teacherId, 
        teacherName: teacher.fullName, 
        classId, 
        className: classObj.name 
      }
    });
    
    return association;
  }
  
  async removeTeacherFromClass(teacherId: number, classId: number): Promise<boolean> {
    const key = `${teacherId}-${classId}`;
    
    // Check if the association exists
    if (!this.teacherClasses.has(key)) {
      return false;
    }
    
    const teacher = this.users.get(teacherId);
    const classObj = this.classes.get(classId);
    
    const success = this.teacherClasses.delete(key);
    
    if (success && teacher && classObj) {
      // Log activity
      this.createActivity({
        type: 'teacher',
        action: 'unassign',
        details: { 
          teacherId, 
          teacherName: teacher.fullName, 
          classId, 
          className: classObj.name 
        }
      });
    }
    
    return success;
  }
  
  // Attendance methods
  async getAttendance(classId: number, date?: Date): Promise<Attendance[]> {
    let attendanceRecords = Array.from(this.attendance.values())
      .filter(a => a.classId === classId);
    
    if (date) {
      const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      attendanceRecords = attendanceRecords.filter(a => {
        const attendanceDate = new Date(a.date).toISOString().split('T')[0];
        return attendanceDate === dateStr;
      });
    }
    
    return attendanceRecords.sort((a, b) => {
      // Sort by date (descending) then by student name (ascending)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      
      const studentA = this.students.get(a.studentId);
      const studentB = this.students.get(b.studentId);
      
      if (studentA && studentB) {
        return studentA.fullName.localeCompare(studentB.fullName);
      }
      
      return 0;
    });
  }
  
  async getStudentAttendance(studentId: number, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    let attendanceRecords = Array.from(this.attendance.values())
      .filter(a => a.studentId === studentId);
    
    if (startDate) {
      const startDateTimestamp = startDate.getTime();
      attendanceRecords = attendanceRecords.filter(a => {
        const attendanceDate = new Date(a.date).getTime();
        return attendanceDate >= startDateTimestamp;
      });
    }
    
    if (endDate) {
      const endDateTimestamp = endDate.getTime();
      attendanceRecords = attendanceRecords.filter(a => {
        const attendanceDate = new Date(a.date).getTime();
        return attendanceDate <= endDateTimestamp;
      });
    }
    
    return attendanceRecords.sort((a, b) => {
      // Sort by date (descending)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }
  
  async markAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceId++;
    const now = new Date();
    
    // Ensure the student and class exist
    const student = this.students.get(attendanceData.studentId);
    const classObj = this.classes.get(attendanceData.classId);
    const teacher = this.users.get(attendanceData.markedById);
    
    if (!student || !classObj || !teacher) {
      throw new Error("Student, class, or teacher not found");
    }
    
    // Check if student belongs to the class
    if (student.classId !== attendanceData.classId) {
      throw new Error("Student does not belong to this class");
    }
    
    // Check if the user marking attendance is a teacher or admin
    if (!['teacher', 'officeadmin', 'superadmin'].includes(teacher.role)) {
      throw new Error("Only teachers and administrators can mark attendance");
    }
    
    // If it's a teacher, check if they're assigned to this class
    if (teacher.role === 'teacher') {
      const key = `${teacher.id}-${attendanceData.classId}`;
      if (!this.teacherClasses.has(key)) {
        throw new Error("Teacher is not assigned to this class");
      }
    }
    
    // Create the attendance record
    const attendance: Attendance = {
      ...attendanceData,
      id,
      createdAt: now,
      updatedAt: now,
      notes: attendanceData.notes || null
    };
    
    this.attendance.set(id, attendance);
    
    // Log activity
    this.createActivity({
      type: 'attendance',
      action: 'mark',
      details: { 
        studentId: student.id, 
        studentName: student.fullName, 
        classId: classObj.id, 
        className: classObj.name,
        date: attendanceData.date,
        status: attendanceData.status
      }
    });
    
    return attendance;
  }
  
  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    // If student or class is being changed, verify the new data
    if (attendanceData.studentId || attendanceData.classId) {
      const studentId = attendanceData.studentId || attendance.studentId;
      const classId = attendanceData.classId || attendance.classId;
      
      const student = this.students.get(studentId);
      const classObj = this.classes.get(classId);
      
      if (!student || !classObj) {
        throw new Error("Student or class not found");
      }
      
      // Check if student belongs to the class
      if (student.classId !== classId) {
        throw new Error("Student does not belong to this class");
      }
    }
    
    // If the user marking is being changed, verify the new user
    if (attendanceData.markedById) {
      const teacher = this.users.get(attendanceData.markedById);
      
      if (!teacher) {
        throw new Error("Teacher not found");
      }
      
      // Check if the user is a teacher or admin
      if (!['teacher', 'officeadmin', 'superadmin'].includes(teacher.role)) {
        throw new Error("Only teachers and administrators can mark attendance");
      }
      
      // If it's a teacher, check if they're assigned to this class
      if (teacher.role === 'teacher') {
        const classId = attendanceData.classId || attendance.classId;
        const key = `${teacher.id}-${classId}`;
        if (!this.teacherClasses.has(key)) {
          throw new Error("Teacher is not assigned to this class");
        }
      }
    }
    
    const now = new Date();
    const updatedAttendance = { 
      ...attendance, 
      ...attendanceData,
      updatedAt: now,
      notes: attendanceData.notes !== undefined ? (attendanceData.notes || null) : attendance.notes
    };
    
    this.attendance.set(id, updatedAttendance);
    
    // Log activity
    const student = this.students.get(updatedAttendance.studentId);
    const classObj = this.classes.get(updatedAttendance.classId);
    
    if (student && classObj) {
      this.createActivity({
        type: 'attendance',
        action: 'update',
        details: { 
          studentId: student.id, 
          studentName: student.fullName, 
          classId: classObj.id, 
          className: classObj.name,
          date: updatedAttendance.date,
          status: updatedAttendance.status
        }
      });
    }
    
    return updatedAttendance;
  }
  
  async getClassAttendanceReport(classId: number, month: number, year: number): Promise<any[]> {
    // Get students in this class
    const students = await this.getStudentsByClass(classId);
    
    // Get attendance for this class in the specified month
    const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
    const endDate = new Date(year, month, 0); // Last day of the month
    
    const classAttendance = Array.from(this.attendance.values())
      .filter(a => {
        const attendanceDate = new Date(a.date);
        return (
          a.classId === classId &&
          attendanceDate >= startDate &&
          attendanceDate <= endDate
        );
      });
    
    // Group attendance by student
    const studentAttendance = students.map(student => {
      const attendanceRecords = classAttendance.filter(a => a.studentId === student.id);
      
      // Count attendance by status
      const statusCounts = {
        present: attendanceRecords.filter(a => a.status === 'present').length,
        absent: attendanceRecords.filter(a => a.status === 'absent').length,
        late: attendanceRecords.filter(a => a.status === 'late').length,
        excused: attendanceRecords.filter(a => a.status === 'excused').length,
        total: attendanceRecords.length
      };
      
      // Calculate attendance percentage
      const attendancePercentage = statusCounts.total > 0
        ? Math.round(((statusCounts.present + statusCounts.late) / statusCounts.total) * 100)
        : 0;
      
      return {
        student,
        statusCounts,
        attendancePercentage,
        records: attendanceRecords
      };
    });
    
    return studentAttendance;
  }

  // Academic Year methods
  async getAllAcademicYears(): Promise<AcademicYear[]> {
    return Array.from(this.academicYears.values()).sort((a, b) => b.id - a.id);
  }

  async getCurrentAcademicYear(): Promise<AcademicYear | undefined> {
    return Array.from(this.academicYears.values()).find(year => year.isCurrent);
  }

  async getAcademicYearById(id: number): Promise<AcademicYear | undefined> {
    return this.academicYears.get(id);
  }

  async createAcademicYear(data: InsertAcademicYear): Promise<AcademicYear> {
    const id = this.academicYearId++;
    const now = new Date();
    
    // If this is set as current academic year, update all others to not current
    if (data.isCurrent) {
      await this.updateAllAcademicYearsToNotCurrent();
    }
    
    const academicYear: AcademicYear = {
      id,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isCurrent: data.isCurrent === true ? true : false,
      createdAt: now,
      updatedAt: now
    };
    
    this.academicYears.set(id, academicYear);
    
    // Log activity
    this.createActivity({
      type: 'academic_year',
      action: 'create',
      details: { academicYearId: id, name: academicYear.name }
    });
    
    return academicYear;
  }

  async updateAcademicYear(id: number, data: Partial<InsertAcademicYear>): Promise<AcademicYear | undefined> {
    const academicYear = this.academicYears.get(id);
    if (!academicYear) return undefined;
    
    // If setting this as current academic year, update all others to not current
    if (data.isCurrent) {
      await this.updateAllAcademicYearsToNotCurrent();
    }
    
    const updatedAcademicYear = { ...academicYear, ...data };
    this.academicYears.set(id, updatedAcademicYear);
    
    // Log activity
    this.createActivity({
      type: 'academic_year',
      action: 'update',
      details: { academicYearId: id, name: updatedAcademicYear.name }
    });
    
    return updatedAcademicYear;
  }

  async updateAllAcademicYearsToNotCurrent(): Promise<void> {
    this.academicYears.forEach(year => {
      if (year.isCurrent) {
        year.isCurrent = false;
        this.academicYears.set(year.id, year);
      }
    });
  }

  async checkAcademicYearReferences(id: number): Promise<boolean> {
    // Check if any classes reference this academic year
    const classesWithAcademicYear = Array.from(this.classes.values())
      .filter(classItem => classItem.academicYearId === id);
    
    if (classesWithAcademicYear.length > 0) {
      return true;
    }
    
    // Check if any fee structures reference this academic year
    const feeStructuresWithAcademicYear = Array.from(this.feeStructures.values())
      .filter(fee => fee.academicYearId === id);
    
    if (feeStructuresWithAcademicYear.length > 0) {
      return true;
    }
    
    return false;
  }

  async deleteAcademicYear(id: number): Promise<boolean> {
    const academicYear = this.academicYears.get(id);
    if (!academicYear) return false;
    
    // Check if there are any references to this academic year
    const hasReferences = await this.checkAcademicYearReferences(id);
    if (hasReferences) {
      return false; // Cannot delete academic year that is being referenced
    }
    
    const success = this.academicYears.delete(id);
    
    if (success) {
      // Log activity
      this.createActivity({
        type: 'academic_year',
        action: 'delete',
        details: { academicYearId: id, name: academicYear.name }
      });
    }
    
    return success;
  }
}

export const storage = new MemStorage();
