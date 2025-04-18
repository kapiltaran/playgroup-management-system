import { pgTable, text, serial, integer, boolean, numeric, timestamp, json, date, foreignKey, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role definition using enum
export const roleEnum = pgEnum('role', ['parent', 'teacher', 'officeadmin', 'superadmin']);

export const moduleEnum = pgEnum('module', [
  'students', 
  'classes', 
  'fee_management', 
  'fee_payments', 
  'expenses', 
  'inventory', 
  'reports',
  'settings',
  'user_management',
  'role_management',
  'attendance',
  'academic_year',
  'batch_management'
]);

// Academic Year schema
export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "2024-2025"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isCurrent: boolean("is_current").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Class schema
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ageGroup: text("age_group"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  days: text("days").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

// Batch schema
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  academicYearId: integer("academic_year_id").notNull().references(() => academicYears.id),
  classId: integer("class_id").notNull().references(() => classes.id),
  capacity: integer("capacity").notNull().default(20),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Fee structure schema
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull().references(() => classes.id),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  academicYearId: integer("academic_year_id").notNull().references(() => academicYears.id),
  description: text("description"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures)
  .omit({
    id: true,
    createdAt: true,
  })
  .transform((data) => {
    // Ensure totalAmount is always a string in expected format
    return {
      ...data,
      totalAmount: typeof data.totalAmount === 'string' 
        ? data.totalAmount 
        : String(data.totalAmount)
    };
  });

// Removed fee installments as requested

// Student schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  age: integer("age"),
  gender: text("gender").notNull(),
  guardianName: text("guardian_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  state: text("state"),
  country: text("country"),
  status: text("status").notNull().default("active"),
  classId: integer("class_id").references(() => classes.id),
  batchId: integer("batch_id").references(() => batches.id),
  feeStructureId: integer("fee_structure_id").references(() => feeStructures.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

// Expense schema
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

// Inventory schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  minQuantity: integer("min_quantity").notNull(),
  notes: text("notes"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

// Fee payment schema for tracking payments
export const feePayments = pgTable("fee_payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  feeStructureId: integer("fee_structure_id").notNull().references(() => feeStructures.id),
  paymentDate: date("payment_date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // "Cash", "Check", "Online Transfer", etc.
  receiptNumber: text("receipt_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeePaymentSchema = createInsertSchema(feePayments)
  .omit({
    id: true,
    createdAt: true,
  })
  .transform((data) => {
    // Ensure amount is always a string in expected format
    return {
      ...data,
      amount: typeof data.amount === 'string' 
        ? data.amount 
        : String(data.amount)
    };
  });

// Reminder notifications schema
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  feeStructureId: integer("fee_structure_id").notNull().references(() => feeStructures.id),
  status: text("status").notNull().default("pending"), // "pending", "sent", "viewed"
  sentDate: timestamp("sent_date"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  sentDate: true,
  createdAt: true,
});

// Activity log schema for recent activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'student', 'expense', 'inventory', 'fee', 'payment'
  action: text("action").notNull(), // 'create', 'update', 'delete'
  details: json("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

// User schema with roles, email verification and MFA
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull().default("parent"),
  active: boolean("active").notNull().default(true),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpires: timestamp("verification_token_expires"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecret: text("mfa_secret"),
  studentId: integer("student_id").references(() => students.id), // For parent role, linking to their child
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true, // We'll handle password hashing separately
  createdAt: true,
  lastLogin: true,
  emailVerified: true,
  verificationToken: true,
  verificationTokenExpires: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  mfaEnabled: true,
  mfaSecret: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Role permissions schema
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: roleEnum("role").notNull(),
  module: moduleEnum("module").notNull(),
  canView: boolean("can_view").notNull().default(false),
  canCreate: boolean("can_create").notNull().default(false),
  canEdit: boolean("can_edit").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Teacher to Class association schema (many-to-many relationship)
export const teacherClasses = pgTable("teacher_classes", {
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  classId: integer("class_id").notNull().references(() => classes.id),
  assignedDate: timestamp("assigned_date").defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.teacherId, table.classId] })
  };
});

export const insertTeacherClassSchema = createInsertSchema(teacherClasses).omit({
  assignedDate: true,
});

// Attendance schema
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  classId: integer("class_id").notNull().references(() => classes.id),
  date: date("date").notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'late', 'excused'
  notes: text("notes"),
  markedById: integer("marked_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Receipt Number Sequence schema for tracking next available receipt number
export const receiptNumberSequence = pgTable("receipt_number_sequence", {
  id: serial("id").primaryKey(),
  nextValue: integer("next_value").notNull().default(1),
  prefix: text("prefix").notNull().default("RC-"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertReceiptNumberSequenceSchema = createInsertSchema(receiptNumberSequence).omit({
  id: true,
  lastUpdated: true,
});

// Type definitions for TypeScript
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type FeePayment = typeof feePayments.$inferSelect;
export type InsertFeePayment = z.infer<typeof insertFeePaymentSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TeacherClass = typeof teacherClasses.$inferSelect;
export type InsertTeacherClass = z.infer<typeof insertTeacherClassSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type ReceiptNumberSequence = typeof receiptNumberSequence.$inferSelect;
export type InsertReceiptNumberSequence = z.infer<typeof insertReceiptNumberSequenceSchema>;
