import { pgTable, text, serial, integer, boolean, numeric, timestamp, json, date, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Class schema
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  academicYear: text("academic_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

// Fee structure schema
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull().references(() => classes.id),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  academicYear: text("academic_year").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({
  id: true,
  createdAt: true,
});

// Fee installment schema
export const feeInstallments = pgTable("fee_installments", {
  id: serial("id").primaryKey(),
  feeStructureId: integer("fee_structure_id").notNull().references(() => feeStructures.id),
  name: text("name").notNull(), // e.g., "First Term", "Second Term"
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeeInstallmentSchema = createInsertSchema(feeInstallments).omit({
  id: true,
  createdAt: true,
});

// Student schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  age: integer("age"),
  gender: text("gender").notNull(),
  guardianName: text("guardian_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  status: text("status").notNull().default("active"),
  classId: integer("class_id").references(() => classes.id),
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
  installmentId: integer("installment_id").notNull().references(() => feeInstallments.id),
  paymentDate: date("payment_date").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // "Cash", "Check", "Online Transfer", etc.
  receiptNumber: text("receipt_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeePaymentSchema = createInsertSchema(feePayments).omit({
  id: true,
  createdAt: true,
});

// Reminder notifications schema
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  installmentId: integer("installment_id").notNull().references(() => feeInstallments.id),
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

// Type definitions for TypeScript
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type FeeInstallment = typeof feeInstallments.$inferSelect;
export type InsertFeeInstallment = z.infer<typeof insertFeeInstallmentSchema>;
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
