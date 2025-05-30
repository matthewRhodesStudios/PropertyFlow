import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  type: text("type").notNull(), // e.g., "2-bed apartment", "3-bed house"
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).notNull(),
  renovationBudget: decimal("renovation_budget", { precision: 12, scale: 2 }).notNull(),
  projectedSalePrice: decimal("projected_sale_price", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("planning"), // planning, renovation, ready_to_sell, sold
  progress: integer("progress").notNull().default(0), // 0-100
  imageUrl: text("image_url"),
  notes: text("notes"),
});

export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  specialty: text("specialty").notNull(), // plumbing, electrical, flooring, etc.
  email: text("email"),
  phone: text("phone"),
  rating: decimal("rating", { precision: 2, scale: 1 }), // 1.0-5.0
  notes: text("notes"),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  contractorId: integer("contractor_id").notNull(),
  service: text("service").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  dateReceived: timestamp("date_received").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedTo: text("assigned_to"), // contractor name or other assignee
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id"),
  contractorId: integer("contractor_id"),
  name: text("name").notNull(),
  type: text("type").notNull(), // contract, invoice, permit, photo, etc.
  filePath: text("file_path").notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  tags: text("tags").array(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role").notNull(), // agent, supplier, inspector, etc.
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
});

// Insert schemas
export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
});

export const insertContractorSchema = createInsertSchema(contractors).omit({
  id: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

// Types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = z.infer<typeof insertContractorSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
