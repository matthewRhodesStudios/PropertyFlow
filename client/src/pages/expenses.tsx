import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Receipt, Calendar, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import type { Expense, InsertExpense, Property, Task, Job, Contractor, Quote } from "@shared/schema";
import { insertExpenseSchema } from "@shared/schema";

const formSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  taskId: z.string().optional(),
  jobId: z.string().optional(),
  quoteId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  supplier: z.string().optional(),
  contractorType: z.enum(["existing", "custom"]).optional(),
  contractorId: z.string().optional(),
  customSupplier: z.string().optional(),
  receiptNumber: z.string().optional(),
  vatAmount: z.string().optional(),
  vatRate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Expenses() {
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [expenseFormTab, setExpenseFormTab] = useState<"quote" | "manual">("quote");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      title: "",
      description: "",
      amount: "",
      category: "",
      paymentMethod: "",
      supplier: "",
      contractorType: "custom",
      contractorId: "",
      customSupplier: "",
      receiptNumber: "",
      vatAmount: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Fetch data
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data: InsertExpense) => apiRequest("POST", "/api/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsDialogOpen(false);
      setEditingExpense(null);
      form.reset();
      toast({
        title: "Success",
        description: "Expense saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save expense",
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertExpense> }) => 
      apiRequest("PATCH", `/api/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsDialogOpen(false);
      setEditingExpense(null);
      form.reset();
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const expenseData: InsertExpense = {
      propertyId: parseInt(data.propertyId),
      taskId: data.taskId ? parseInt(data.taskId) : null,
      jobId: data.jobId ? parseInt(data.jobId) : null,
      title: data.title,
      description: data.description || null,
      amount: data.amount,
      category: data.category,
      paymentMethod: data.paymentMethod || null,
      supplier: data.contractorType === "existing" && data.contractorId 
        ? contractors.find(c => c.id === parseInt(data.contractorId!))?.name || null
        : data.customSupplier || null,
      receiptNumber: data.receiptNumber || null,
      vatAmount: data.vatAmount || null,
      date: new Date(data.date),
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data: expenseData });
    } else {
      addExpenseMutation.mutate(expenseData);
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      propertyId: expense.propertyId.toString(),
      taskId: expense.taskId?.toString() || "",
      jobId: expense.jobId?.toString() || "",
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount,
      category: expense.category,
      paymentMethod: expense.paymentMethod || "",
      supplier: expense.supplier || "",
      receiptNumber: expense.receiptNumber || "",
      vatAmount: expense.vatAmount || "",
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingExpense(null);
    form.reset({
      propertyId: selectedProperty?.toString() || "",
      title: "",
      description: "",
      amount: "",
      category: "",
      paymentMethod: "",
      supplier: "",
      receiptNumber: "",
      vatAmount: "",
      date: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  // Filter expenses by selected property
  const filteredExpenses = selectedProperty 
    ? expenses.filter(expense => expense.propertyId === selectedProperty)
    : expenses;

  // Get property name
  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.address || `Property ${propertyId}`;
  };

  // Get task name
  const getTaskName = (taskId: number | null) => {
    if (!taskId) return null;
    const task = tasks.find(t => t.id === taskId);
    return task?.title || `Task ${taskId}`;
  };

  // Get job name
  const getJobName = (jobId: number | null) => {
    if (!jobId) return null;
    const job = jobs.find(j => j.id === jobId);
    return job?.title || `Job ${jobId}`;
  };

  // Calculate totals
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const totalVAT = filteredExpenses.reduce((sum, expense) => 
    sum + (expense.vatAmount ? parseFloat(expense.vatAmount) : 0), 0);

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      materials: "bg-blue-100 text-blue-800",
      labor: "bg-green-100 text-green-800",
      professional_fees: "bg-purple-100 text-purple-800",
      legal: "bg-red-100 text-red-800",
      utilities: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage property-related expenses</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Property Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5" />
            Filter by Property
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select 
              value={selectedProperty?.toString() || "all"} 
              onValueChange={(value) => setSelectedProperty(value === "all" ? null : parseInt(value))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <div>Total: {formatCurrency(totalExpenses)}</div>
              <div>VAT: {formatCurrency(totalVAT)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <div className="grid gap-4">
        {filteredExpenses.map((expense) => (
          <Card key={expense.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{expense.title}</h3>
                    <Badge className={getCategoryColor(expense.category)}>
                      {expense.category.replace('_', ' ')}
                    </Badge>
                    {expense.receiptNumber && (
                      <Badge variant="outline">
                        <Receipt className="h-3 w-3 mr-1" />
                        {expense.receiptNumber}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Property:</span> {getPropertyName(expense.propertyId)}
                    </div>
                    {expense.taskId && (
                      <div>
                        <span className="font-medium">Task:</span> {getTaskName(expense.taskId)}
                      </div>
                    )}
                    {expense.jobId && (
                      <div>
                        <span className="font-medium">Job:</span> {getJobName(expense.jobId)}
                      </div>
                    )}
                    {expense.supplier && (
                      <div>
                        <span className="font-medium">Supplier:</span> {expense.supplier}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(expense.date), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  
                  {expense.description && (
                    <p className="text-sm text-muted-foreground mt-2">{expense.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(parseFloat(expense.amount))}</div>
                    {expense.vatAmount && (
                      <div className="text-sm text-muted-foreground">
                        VAT: {formatCurrency(parseFloat(expense.vatAmount))}
                      </div>
                    )}
                    {expense.paymentMethod && (
                      <div className="text-sm text-muted-foreground capitalize">
                        {expense.paymentMethod}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(expense)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteExpenseMutation.mutate(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedProperty ? "No expenses for this property yet." : "Start tracking your property expenses by adding your first expense."}
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Expense
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby="expense-form-description">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>
          <p id="expense-form-description" className="sr-only">
            Form to add or edit expense details including amount, category, and supplier information
          </p>

          <div className="flex border-b mb-4">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                expenseFormTab === "quote" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setExpenseFormTab("quote")}
            >
              From Quote
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                expenseFormTab === "manual" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setExpenseFormTab("manual")}
            >
              New Expense
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              
              {expenseFormTab === "quote" && (
                <FormField
                  control={form.control}
                  name="quoteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Quote *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        if (value) {
                          const quote = quotes.find(q => q.id === parseInt(value));
                          if (quote) {
                            setSelectedQuote(quote);
                            form.setValue("amount", quote.amount);
                            form.setValue("title", quote.service);
                            form.setValue("category", "professional_fees");
                            if (quote.contractorId) {
                              form.setValue("contractorType", "existing");
                              form.setValue("contractorId", quote.contractorId.toString());
                            }
                          }
                        } else {
                          setSelectedQuote(null);
                        }
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a quote to convert to expense" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {quotes.map((quote) => (
                            <SelectItem key={quote.id} value={quote.id.toString()}>
                              {quote.service} - {formatCurrency(quote.amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter expense title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (£) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="materials">Materials</SelectItem>
                          <SelectItem value="labor">Labor</SelectItem>
                          <SelectItem value="professional_fees">Professional</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contractorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose supplier type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="existing">Existing Contractor</SelectItem>
                        <SelectItem value="custom">Custom Supplier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("contractorType") === "existing" && (
                <FormField
                  control={form.control}
                  name="contractorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contractor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose contractor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contractors.map((contractor) => (
                            <SelectItem key={contractor.id} value={contractor.id.toString()}>
                              {contractor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("contractorType") === "custom" && (
                <FormField
                  control={form.control}
                  name="customSupplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter supplier name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending}>
                  {editingExpense ? "Update" : "Add"} Expense
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingExpense(null);
                  setSelectedQuote(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.address}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="materials">Materials</SelectItem>
                          <SelectItem value="labor">Labor</SelectItem>
                          <SelectItem value="professional_fees">Professional Fees</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter expense title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter expense description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (£) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vatAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT Amount (£)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="quoteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Quote (Optional)</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      const quote = quotes.find(q => q.id === parseInt(value));
                      if (quote) {
                        setSelectedQuote(quote);
                        form.setValue("amount", quote.amount);
                        form.setValue("title", quote.service || "Quote expense");
                        form.setValue("category", "Quote");
                      }
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a quote to link" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {quotes.map((quote) => (
                          <SelectItem key={quote.id} value={quote.id.toString()}>
                            {quote.service} - {formatCurrency(quote.amount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedQuote && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-900">Quote Details</h4>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-blue-700">Amount:</span> {formatCurrency(selectedQuote.amount)}
                      </div>
                      <div>
                        <span className="text-blue-700">Status:</span> {selectedQuote.status}
                      </div>
                      {selectedQuote.notes && (
                        <div className="col-span-2">
                          <span className="text-blue-700">Notes:</span> {selectedQuote.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <FormField
                control={form.control}
                name="contractorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier/Contractor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose supplier type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="existing">Select Existing Contractor</SelectItem>
                        <SelectItem value="custom">Enter Custom Supplier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("contractorType") === "existing" && (
                <FormField
                  control={form.control}
                  name="contractorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Contractor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose contractor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contractors.map((contractor) => (
                            <SelectItem key={contractor.id} value={contractor.id.toString()}>
                              {contractor.name} - {contractor.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch("contractorType") === "custom" && (
                <FormField
                  control={form.control}
                  name="customSupplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter supplier/company name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter receipt/invoice number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={addExpenseMutation.isPending || updateExpenseMutation.isPending}>
                  {editingExpense ? "Update" : "Add"} Expense
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}