import type { Property, InsertProperty, Contractor, InsertContractor, Quote, InsertQuote, Job, InsertJob, Task, InsertTask, Document, InsertDocument, Contact, InsertContact, Expense, InsertExpense, DocumentAssignment, InsertDocumentAssignment } from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc } from "drizzle-orm";
import { properties, contractors, quotes, jobs, tasks, documents, contacts, expenses, documentAssignments } from "@shared/schema";

export interface IStorage {
  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Contractors
  getContractors(): Promise<Contractor[]>;
  getContractor(id: number): Promise<Contractor | undefined>;
  createContractor(contractor: InsertContractor): Promise<Contractor>;
  updateContractor(id: number, contractor: Partial<InsertContractor>): Promise<Contractor | undefined>;
  deleteContractor(id: number): Promise<boolean>;

  // Quotes
  getQuotes(): Promise<Quote[]>;
  getQuotesByProperty(propertyId: number): Promise<Quote[]>;
  getQuote(id: number): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;

  // Tasks (main categories)
  getTasks(): Promise<Task[]>;
  getTasksByProperty(propertyId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Jobs (sub-tasks under main tasks)
  getJobs(): Promise<Job[]>;
  getJobsByProperty(propertyId: number): Promise<Job[]>;
  getJobsByTask(taskId: number): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocumentsByProperty(propertyId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpensesByProperty(propertyId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Document Assignments
  getDocumentAssignments(documentId: number): Promise<DocumentAssignment[]>;
  createDocumentAssignment(assignment: InsertDocumentAssignment): Promise<DocumentAssignment>;
  deleteDocumentAssignment(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updated] = await db
      .update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id));
    return result.rowCount > 0;
  }

  async getContractors(): Promise<Contractor[]> {
    return await db.select().from(contractors);
  }

  async getContractor(id: number): Promise<Contractor | undefined> {
    const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
    return contractor || undefined;
  }

  async createContractor(contractor: InsertContractor): Promise<Contractor> {
    const [newContractor] = await db
      .insert(contractors)
      .values(contractor)
      .returning();
    return newContractor;
  }

  async updateContractor(id: number, contractor: Partial<InsertContractor>): Promise<Contractor | undefined> {
    const [updated] = await db
      .update(contractors)
      .set(contractor)
      .where(eq(contractors.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContractor(id: number): Promise<boolean> {
    const result = await db.delete(contractors).where(eq(contractors.id, id));
    return result.rowCount > 0;
  }

  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes);
  }

  async getQuotesByProperty(propertyId: number): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.propertyId, propertyId));
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db
      .insert(quotes)
      .values(quote)
      .returning();
    return newQuote;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [updated] = await db
      .update(quotes)
      .set(quote)
      .where(eq(quotes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteQuote(id: number): Promise<boolean> {
    try {
      const client = await pool.connect();
      try {
        console.log(`Attempting to delete quote with ID: ${id}`);
        const result = await client.query('DELETE FROM quotes WHERE id = $1', [id]);
        console.log(`Delete result:`, result.rowCount);
        const wasDeleted = (result.rowCount || 0) > 0;
        console.log(`Quote ${id} deleted successfully: ${wasDeleted}`);
        return wasDeleted;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error deleting quote ${id}:`, error);
      return false;
    }
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJobsByProperty(propertyId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.propertyId, propertyId));
  }

  async getJobsByTask(taskId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.taskId, taskId));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db
      .insert(jobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set(job)
      .where(eq(jobs.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return result.rowCount > 0;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByProperty(propertyId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.propertyId, propertyId));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    // First delete all related jobs
    await db.delete(jobs).where(eq(jobs.taskId, id));
    
    // Then delete the task
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async getDocumentsByProperty(propertyId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.propertyId, propertyId));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set(document)
      .where(eq(documents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount > 0;
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount > 0;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.id));
  }

  async getExpensesByProperty(propertyId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.propertyId, propertyId)).orderBy(desc(expenses.date));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return updated || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return result.rowCount > 0;
  }

  async getDocumentAssignments(documentId: number): Promise<DocumentAssignment[]> {
    return await db.select().from(documentAssignments).where(eq(documentAssignments.documentId, documentId));
  }

  async createDocumentAssignment(assignment: InsertDocumentAssignment): Promise<DocumentAssignment> {
    const [created] = await db
      .insert(documentAssignments)
      .values(assignment)
      .returning();
    return created;
  }

  async deleteDocumentAssignment(id: number): Promise<boolean> {
    const result = await db.delete(documentAssignments).where(eq(documentAssignments.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();