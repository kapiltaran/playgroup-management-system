import { pgTable, text, serial, integer, boolean, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Activity log schema for recent activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'student', 'expense', 'inventory'
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
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
