import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, PoundSterling, Edit2, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
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
import { insertQuoteSchema, type Quote, type Property, type Contractor, type Task } from "@shared/schema";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Quotes() {
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);
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

  // Filter to only show quotable tasks
  const quotableTasks = tasks.filter(task => task.quotable);

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
    createQuoteMutation.mutate(data);
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

  // Group quotes by property
  const quotesByProperty = quotes.reduce((acc, quote) => {
    if (!acc[quote.propertyId]) {
      acc[quote.propertyId] = [];
    }
    acc[quote.propertyId].push(quote);
    return acc;
  }, {} as Record<number, Quote[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotes & Estimates</h1>
          <p className="text-gray-600 mt-1">Manage contractor quotes for quotable tasks</p>
        </div>
        <Dialog open={newQuoteOpen} onOpenChange={setNewQuoteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Quote</DialogTitle>
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
                        <FormLabel>Task Category</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select quotable task" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {quotableTasks
                              .filter(task => !form.watch("propertyId") || task.propertyId === form.watch("propertyId"))
                              .map((task) => (
                              <SelectItem key={task.id} value={task.id.toString()}>
                                {task.title}
                              </SelectItem>
                            ))}
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

      {quotableTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <PoundSterling className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Quotable Tasks Found</h3>
              <p className="mb-4">You need to create tasks and mark them as "quotable" before you can add quotes.</p>
              <p className="text-sm">Go to the Project Timeline page and create tasks with the "Quotable Task" checkbox enabled.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(quotesByProperty).map(([propertyId, propertyQuotes]) => {
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
                  {propertyQuotes.length} quote{propertyQuotes.length !== 1 ? 's' : ''}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                {propertyQuotes.map((quote) => {
                  const task = getTaskForQuote(quote);
                  const contractor = getContractorForQuote(quote);

                  return (
                    <div key={quote.id} className={cn(
                      "p-4 rounded-lg border-2",
                      getStatusColor(quote.status)
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(quote.status)}
                            <h3 className="font-semibold text-lg">{quote.service}</h3>
                            <Badge className={getStatusColor(quote.status)}>
                              {quote.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Task:</span>
                              <span>{task?.title || 'Unknown Task'}</span>
                              {task && (
                                <Badge variant="outline" className="text-xs">
                                  {task.category.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Contractor:</span>
                              <span>{contractor?.name} - {contractor?.company}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Received:</span>
                              <span>{format(new Date(quote.dateReceived), "PPP")}</span>
                            </div>
                            
                            {quote.validUntil && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Valid Until:</span>
                                <span className={cn(
                                  new Date(quote.validUntil) < new Date() ? 'text-red-600 font-medium' : ''
                                )}>
                                  {format(new Date(quote.validUntil), "PPP")}
                                  {new Date(quote.validUntil) < new Date() && ' (Expired)'}
                                </span>
                              </div>
                            )}
                            
                            {quote.notes && (
                              <div className="mt-2">
                                <span className="font-medium">Notes:</span>
                                <p className="text-gray-600 mt-1">{quote.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              £{formatCurrency(quote.amount)}
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
                
                {propertyQuotes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No quotes for this property yet</p>
                    <p className="text-sm">Add quotes for quotable tasks to get started</p>
                  </div>
                )}
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