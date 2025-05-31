import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PoundSterling, Edit2, Trash2, Clock, CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertQuoteSchema, type Quote, type Property, type Contractor, type Task, type Job } from "@shared/schema";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Quotes() {
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Queries
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Filter to only show quotable tasks and jobs
  const quotableTasks = tasks.filter(task => task.quotable);
  const quotableJobs = jobs.filter(job => job.quotable);

  // Mutations
  const createQuoteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/quotes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setNewQuoteOpen(false);
      form.reset();
      toast({ title: "Quote created successfully" });
    },
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/quotes/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote status updated" });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PATCH", `/api/quotes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setEditingQuote(null);
      form.reset();
      toast({ title: "Quote updated successfully" });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote deleted successfully" });
    },
  });

  // Form
  const form = useForm({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      propertyId: 1,
      taskId: undefined,
      jobId: undefined,
      contractorId: 1,
      service: "",
      amount: "",
      status: "pending",
      notes: "",
      validUntil: undefined,
    },
  });

  const onSubmit = (data: any) => {
    // Ensure amount is not empty
    if (!data.amount || data.amount.trim() === '') {
      data.amount = '0';
    }
    
    if (editingQuote) {
      updateQuoteMutation.mutate({ id: editingQuote.id, data });
    } else {
      createQuoteMutation.mutate(data);
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    form.reset({
      propertyId: quote.propertyId,
      taskId: quote.taskId || undefined,
      jobId: quote.jobId || undefined,
      contractorId: quote.contractorId || undefined,
      service: quote.service,
      amount: quote.amount,
      dateReceived: new Date(quote.dateReceived),
      validUntil: quote.validUntil ? new Date(quote.validUntil) : undefined,
      status: quote.status,
      notes: quote.notes || "",
    });
    setNewQuoteOpen(true);
  };

  const toggleTaskCollapse = (taskKey: string) => {
    const newCollapsed = new Set(collapsedTasks);
    if (newCollapsed.has(taskKey)) {
      newCollapsed.delete(taskKey);
    } else {
      newCollapsed.add(taskKey);
    }
    setCollapsedTasks(newCollapsed);
  };

  const getQuoteStatusCounts = (quotes: Quote[]) => {
    const counts = { pending: 0, accepted: 0, rejected: 0 };
    quotes.forEach(quote => {
      if (quote.status === 'accepted') counts.accepted++;
      else if (quote.status === 'rejected') counts.rejected++;
      else counts.pending++;
    });
    return counts;
  };

  const getTaskHeaderColor = (quotes: Quote[]) => {
    const counts = getQuoteStatusCounts(quotes);
    const totalQuotes = quotes.length;
    
    // If no quotes, red
    if (totalQuotes === 0) {
      return 'bg-red-50 hover:bg-red-100 border-red-200';
    }
    
    // If at least 1 quote accepted, green
    if (counts.accepted >= 1) {
      return 'bg-green-50 hover:bg-green-100 border-green-200';
    }
    
    // If all quotes are rejected, red
    if (counts.rejected === totalQuotes) {
      return 'bg-red-50 hover:bg-red-100 border-red-200';
    }
    
    // Otherwise (pending quotes exist), yellow
    return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200';
  };

  const handleStatusChange = (quoteId: number, newStatus: string) => {
    updateQuoteStatusMutation.mutate({ id: quoteId, status: newStatus });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getTaskForQuote = (quote: Quote) => {
    return tasks.find(task => task.id === quote.taskId);
  };

  const getPropertyForQuote = (quote: Quote) => {
    return properties.find(property => property.id === quote.propertyId);
  };

  const getContractorForQuote = (quote: Quote) => {
    return contractors.find(contractor => contractor.id === quote.contractorId);
  };

  const getJobForQuote = (quote: Quote) => {
    return jobs.find(job => job.id === quote.jobId);
  };

  // Group all quotable tasks by property, including those without quotes
  const quotableTasksByProperty = quotableTasks.reduce((acc, task) => {
    if (!acc[task.propertyId]) {
      acc[task.propertyId] = [];
    }
    acc[task.propertyId].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  // Group all quotable jobs by property and task
  const quotableJobsByProperty = quotableJobs.reduce((acc, job) => {
    if (!acc[job.propertyId]) {
      acc[job.propertyId] = {};
    }
    if (!acc[job.propertyId][job.taskId]) {
      acc[job.propertyId][job.taskId] = [];
    }
    acc[job.propertyId][job.taskId].push(job);
    return acc;
  }, {} as Record<number, Record<number, Job[]>>);

  // Group quotes by property and task
  const quotesByPropertyAndTask = quotes.reduce((acc, quote) => {
    const propertyId = quote.propertyId;
    const taskId = quote.taskId || 0;
    
    if (!acc[propertyId]) {
      acc[propertyId] = {};
    }
    if (!acc[propertyId][taskId]) {
      acc[propertyId][taskId] = [];
    }
    acc[propertyId][taskId].push(quote);
    return acc;
  }, {} as Record<number, Record<number, Quote[]>>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotes & Estimates</h1>
          <p className="text-gray-600 mt-1">Manage contractor quotes for quotable tasks</p>
        </div>
        <Dialog open={newQuoteOpen} onOpenChange={(open) => {
          setNewQuoteOpen(open);
          if (!open) {
            setEditingQuote(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuote ? "Edit Quote" : "Create New Quote"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
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
                    name="taskId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotable Item</FormLabel>
                        <Select onValueChange={(value) => {
                          if (value.startsWith('task-')) {
                            const taskId = parseInt(value.replace('task-', ''));
                            field.onChange(taskId);
                            form.setValue("jobId", undefined);
                          } else if (value.startsWith('job-')) {
                            const jobId = parseInt(value.replace('job-', ''));
                            const job = quotableJobs.find(j => j.id === jobId);
                            if (job) {
                              field.onChange(job.taskId);
                              form.setValue("jobId", jobId);
                            }
                          }
                        }} value={
                          form.watch("jobId") ? `job-${form.watch("jobId")}` : 
                          field.value ? `task-${field.value}` : undefined
                        }>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quotable task or job" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Show quotable tasks */}
                            {quotableTasks
                              .filter(task => !form.watch("propertyId") || task.propertyId === form.watch("propertyId"))
                              .map((task) => (
                              <SelectItem key={`task-${task.id}`} value={`task-${task.id}`}>
                                📋 {task.title}
                              </SelectItem>
                            ))}
                            
                            {/* Show quotable jobs */}
                            {quotableJobs
                              .filter(job => !form.watch("propertyId") || job.propertyId === form.watch("propertyId"))
                              .map((job) => {
                                const task = tasks.find(t => t.id === job.taskId);
                                return (
                                  <SelectItem key={`job-${job.id}`} value={`job-${job.id}`}>
                                    🔧 {job.name} ({task?.title})
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contractorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contractor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contractor" />
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

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (£)</FormLabel>
                        <FormControl>
                          <Input placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Complete kitchen renovation, Roof repair" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid Until</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select expiry date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes about the quote..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setNewQuoteOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createQuoteMutation.isPending}>
                    Create Quote
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {quotableTasks.length === 0 && quotableJobs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <PoundSterling className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Quotable Items Found</h3>
              <p className="mb-4">You need to create tasks or jobs and mark them as "quotable" before you can add quotes.</p>
              <p className="text-sm">Go to the Project Timeline page and create tasks or jobs with the "Quotable" checkbox enabled.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(quotableTasksByProperty).map(([propertyId, propertyTasks]) => {
        const property = properties.find(p => p.id === parseInt(propertyId));
        if (!property) return null;

        return (
          <Card key={propertyId} className="border-2">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{property.address}</span>
                  <Badge variant="outline" className="border-2">{property.type}</Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {propertyTasks.length} quotable task{propertyTasks.length !== 1 ? 's' : ''}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-6 p-6">
                {propertyTasks.map((task) => {
                  const taskQuotes = quotesByPropertyAndTask[parseInt(propertyId)]?.[task.id] || [];
                  const taskKey = `${propertyId}-${task.id}`;
                  const isCollapsed = collapsedTasks.has(taskKey);
                  const statusCounts = getQuoteStatusCounts(taskQuotes);
                  
                  return (
                    <div key={task.id} className="space-y-3">
                      <div 
                        className={`flex items-center gap-3 border-b pb-2 cursor-pointer p-2 rounded border-2 ${getTaskHeaderColor(taskQuotes)}`}
                        onClick={() => toggleTaskCollapse(taskKey)}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                        <h3 className="font-semibold text-lg">
                          {task ? task.title : 'General Quotes'}
                        </h3>
                        {task && (
                          <Badge variant="outline" className="text-xs">
                            {task.category.replace('_', ' ')}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
                          <span>{taskQuotes.length} total</span>
                          {statusCounts.pending > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                              {statusCounts.pending} pending
                            </Badge>
                          )}
                          {statusCounts.accepted > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              {statusCounts.accepted} accepted
                            </Badge>
                          )}
                          {statusCounts.rejected > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              {statusCounts.rejected} rejected
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {!isCollapsed && (
                        <div className="space-y-3">
                        {taskQuotes.map((quote) => {
                          const contractor = getContractorForQuote(quote);
                          const job = getJobForQuote(quote);

                          return (
                            <div key={quote.id} className={cn(
                              "p-4 rounded-lg border-2",
                              getStatusColor(quote.status)
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    {getStatusIcon(quote.status)}
                                    <h3 className="font-semibold text-lg">{contractor?.name || 'Unknown Contractor'}</h3>
                                    <Badge className={getStatusColor(quote.status)}>
                                      {quote.status}
                                    </Badge>
                                    {job && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                        Job: {job.name}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="mb-3">
                                    <span className="text-sm font-medium text-gray-600">Service: </span>
                                    <span className="text-sm">{quote.service}</span>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Received:</span>
                                      <span>{format(new Date(quote.dateReceived), "PPP")}</span>
                                    </div>
                            
                                    {quote.validUntil && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Valid until:</span>
                                        <span>{format(new Date(quote.validUntil), "PPP")}</span>
                                      </div>
                                    )}
                            
                                    {quote.notes && (
                                      <div className="flex items-start gap-2">
                                        <span className="font-medium">Notes:</span>
                                        <span className="text-gray-600">{quote.notes}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                        
                                <div className="flex flex-col items-end gap-3">
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">
                                      {formatCurrency(quote.amount)}
                                    </div>
                                  </div>
                          
                                  <div className="flex gap-2">
                                    {quote.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-green-500 text-green-600 hover:bg-green-50"
                                          onClick={() => handleStatusChange(quote.id, 'accepted')}
                                        >
                                          Accept
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-red-500 text-red-600 hover:bg-red-50"
                                          onClick={() => handleStatusChange(quote.id, 'rejected')}
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    )}
                            
                                    {quote.status !== 'pending' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStatusChange(quote.id, 'pending')}
                                      >
                                        Reset to Pending
                                      </Button>
                                    )}
                            
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                      onClick={() => handleEdit(quote)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500 text-red-600 hover:bg-red-50"
                                      onClick={() => deleteQuoteMutation.mutate(quote.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Show quotable jobs for this task that don't have quotes yet */}
                        {quotableJobsByProperty[parseInt(propertyId)]?.[task.id]?.map((job) => {
                          const hasQuotes = quotes.some(quote => quote.jobId === job.id);
                          if (hasQuotes) return null; // Don't show jobs that already have quotes
                          
                          return (
                            <div key={`job-${job.id}`} className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                    Job: {job.name}
                                  </Badge>
                                  <span className="text-sm text-gray-600">Quotable job - no quotes yet</span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    form.setValue("propertyId", job.propertyId);
                                    form.setValue("taskId", job.taskId);
                                    form.setValue("jobId", job.id);
                                    setNewQuoteOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Quote
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {quotes.length === 0 && quotableTasks.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <PoundSterling className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Quotes Yet</h3>
              <p className="mb-4">Get started by adding quotes for your quotable tasks.</p>
              <Button onClick={() => setNewQuoteOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}