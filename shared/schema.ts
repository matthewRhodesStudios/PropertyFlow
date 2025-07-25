import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  city: text("city"),
  postcode: text("postcode"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
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
  contactPerson: text("contact_person"),
  specialty: text("specialty").notNull(), // plumbing, electrical, flooring, etc.
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  preferredContact: text("preferred_contact").default("phone"), // phone, text, whatsapp, email
  rating: decimal("rating", { precision: 2, scale: 1 }), // 1.0-5.0
  notes: text("notes"),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  taskId: integer("task_id").references(() => tasks.id),
  jobId: integer("job_id"),
  contractorId: integer("contractor_id").notNull(),
  service: text("service").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  dateReceived: timestamp("date_received").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  attachmentPath: text("attachment_path"), // path to uploaded file
  attachmentName: text("attachment_name"), // original filename
});

// Quote inquiries - track who you've approached for quotes
export const quoteInquiries = pgTable("quote_inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  contractorId: integer("contractor_id").notNull(),
  dateApproached: timestamp("date_approached").notNull().defaultNow(),
  method: text("method").notNull().default("email"), // email, phone, in_person, website
  status: text("status").notNull().default("awaiting"), // awaiting, received, declined, no_response
  notes: text("notes"),
  quoteId: integer("quote_id").references(() => quotes.id), // linked when quote is received
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"), // renovation, legal, surveying, estate_agent, general
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  quotable: boolean("quotable").notNull().default(false), // whether this task can receive quotes
  dueDate: timestamp("due_date"),
  dependsOnTaskId: integer("depends_on_task_id").references(() => tasks.id, { onDelete: "set null" }),
  relativeDueDays: integer("relative_due_days"), // Number of days relative to dependency
  relativeDirection: text("relative_direction").default("after"), // "before" or "after" the dependency
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  propertyId: integer("property_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("general"), // contractor_work, phone_call, email, meeting, document_review
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  quotable: boolean("quotable").notNull().default(false),
  dueDate: timestamp("due_date"),
  contractorId: integer("contractor_id"), // for contractor_work type
  contactId: integer("contact_id"), // for calls, emails, meetings
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id"),
  contractorId: integer("contractor_id"),
  contactId: integer("contact_id"),
  name: text("name").notNull(),
  type: text("type").notNull(), // contract, invoice, permit, photo, etc.
  filePath: text("file_path").notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  tags: text("tags").array(),
});

export const documentAssignments = pgTable("document_assignments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  entityType: text("entity_type").notNull(), // quote, task, contact, contractor
  entityId: integer("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role").notNull(), // solicitor, surveyor, estate_agent, contractor, supplier, etc.
  specialization: text("specialization"), // conveyancing, structural_survey, residential_sales, etc.
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  propertyId: integer("property_id"), // can be linked to specific property
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  taskId: integer("task_id").references(() => tasks.id),
  jobId: integer("job_id").references(() => jobs.id),
  title: text("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // materials, labor, professional_fees, legal, utilities, etc.
  paymentMethod: text("payment_method"), // cash, card, transfer, cheque
  supplier: text("supplier"),
  receiptNumber: text("receipt_number"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }),
  taxDeductible: boolean("tax_deductible").notNull().default(false),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  taskId: integer("task_id").references(() => tasks.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // survey, viewing, meeting, appointment, inspection, etc.
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration"), // duration in minutes
  location: text("location"),
  contactId: integer("contact_id").references(() => contacts.id),
  contractorId: integer("contractor_id").references(() => contractors.id),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  contractorId: integer("contractor_id").references(() => contractors.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
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
  dateReceived: true,
});

export const insertQuoteInquirySchema = createInsertSchema(quoteInquiries).omit({
  id: true,
  dateApproached: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDate: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform((str) => new Date(str)),
});

export const insertDocumentAssignmentSchema = createInsertSchema(documentAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
}).extend({
  scheduledAt: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

// Types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = z.infer<typeof insertContractorSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type QuoteInquiry = typeof quoteInquiries.$inferSelect;
export type InsertQuoteInquiry = z.infer<typeof insertQuoteInquirySchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type DocumentAssignment = typeof documentAssignments.$inferSelect;
export type InsertDocumentAssignment = z.infer<typeof insertDocumentAssignmentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Property Valuations table
export const propertyValuations = pgTable('property_valuations', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id).notNull(),
  estimatedValue: integer('estimated_value').notNull(), // in pence
  confidence: text('confidence'), // high, medium, low
  source: text('source').notNull(), // API provider name
  dateGenerated: timestamp('date_generated').defaultNow(),
  additionalData: text('additional_data'), // JSON string for extra data
  automaticUpdate: boolean('automatic_update').default(true),
});

export const insertPropertyValuationSchema = createInsertSchema(propertyValuations).omit({ id: true, dateGenerated: true });
export type InsertPropertyValuation = z.infer<typeof insertPropertyValuationSchema>;
export type PropertyValuation = typeof propertyValuations.$inferSelect;
