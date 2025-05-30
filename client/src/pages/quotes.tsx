import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuoteSchema, insertJobSchema, type Quote, type InsertQuote, type Job, type InsertJob, type Property, type Contractor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatCurrencyInput } from "@/lib/utils";

export default function Quotes() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [isCreatingNewJob, setIsCreatingNewJob] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const { toast } = useToast();

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const form = useForm<InsertQuote>({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      propertyId: 0,
      contractorId: 0,
      service: "",
      amount: "0",
      status: "pending",
      notes: "",
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: (data: InsertQuote) => apiRequest("POST", "/api/quotes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Quote added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add quote", variant: "destructive" });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertQuote> }) => 
      apiRequest("PATCH", `/api/quotes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update quote", variant: "destructive" });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.refetchQueries({ queryKey: ["/api/quotes"] });
      toast({ title: "Quote deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete quote", variant: "destructive" });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: InsertJob) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Job created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create job", variant: "destructive" });
    },
  });

  const onSubmit = async (data: InsertQuote) => {
    // Ensure amount is not empty
    if (!data.amount || data.amount.trim() === '') {
      data.amount = '0';
    }
    
    // If creating a new job, create it first
    if (isCreatingNewJob && newJobName.trim()) {
      try {
        const response = await createJobMutation.mutateAsync({
          name: newJobName.trim(),
          propertyId: data.propertyId,
          status: "planning",
          description: `Job created for quote: ${data.service}`
        });
        const newJob = response as unknown as Job;
        data.jobId = newJob.id;
        setIsCreatingNewJob(false);
        setNewJobName("");
      } catch (error) {
        toast({ title: "Failed to create job", variant: "destructive" });
        return;
      }
    }
    
    createQuoteMutation.mutate(data);
  };

  const handleStatusChange = (quoteId: number, newStatus: string) => {
    updateQuoteMutation.mutate({ id: quoteId, data: { status: newStatus } });
  };

  const getPropertyAddress = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.address || "Unknown Property";
  };

  const getContractorName = (contractorId: number) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.name || "Unknown Contractor";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get unique trades from contractors
  const uniqueTrades = Array.from(new Set(contractors.map(c => c.specialty)));
  
  const filteredQuotes = quotes.filter(quote => {
    const statusMatch = selectedStatus === "all" || quote.status === selectedStatus;
    const tradeMatch = selectedTrade === "all" || (() => {
      const contractor = contractors.find(c => c.id === quote.contractorId);
      return contractor?.specialty === selectedTrade;
    })();
    return statusMatch && tradeMatch;
  });

  const statusOptions = ["all", "pending", "accepted", "rejected"];

  // Group quotes by property for comparison
  const quotesByProperty = quotes.reduce((acc, quote) => {
    const propertyId = quote.propertyId;
    if (!acc[propertyId]) acc[propertyId] = [];
    acc[propertyId].push(quote);
    return acc;
  }, {} as Record<number, Quote[]>);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Quotes</h1>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Quotes</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark">
              <span className="material-icons mr-2">request_quote</span>
              Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Quote</DialogTitle>
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
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
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
                    name="contractorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contractor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contractor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contractors.map((contractor) => (
                              <SelectItem key={contractor.id} value={contractor.id.toString()}>
                                {contractor.name} - {contractor.specialty}
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
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <FormControl>
                          <Input placeholder="Kitchen renovation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project/Job</FormLabel>
                        <div className="space-y-2">
                          {!isCreatingNewJob ? (
                            <div className="flex space-x-2">
                              <Select onValueChange={(value) => {
                                if (value === "create-new") {
                                  setIsCreatingNewJob(true);
                                  field.onChange(null);
                                } else {
                                  field.onChange(value ? parseInt(value) : null);
                                }
                              }}>
                                <FormControl>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select existing or create new project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="create-new">
                                    <div className="flex items-center">
                                      <span className="material-icons text-sm mr-2">add</span>
                                      Create New Project
                                    </div>
                                  </SelectItem>
                                  {jobs.map((job) => (
                                    <SelectItem key={job.id} value={job.id.toString()}>
                                      {job.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <Input
                                placeholder="Enter new project name (e.g. Kitchen Renovation)"
                                value={newJobName}
                                onChange={(e) => setNewJobName(e.target.value)}
                                className="flex-1"
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setIsCreatingNewJob(false);
                                  setNewJobName("");
                                }}
                              >
                                <span className="material-icons text-sm">close</span>
                              </Button>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="£15,000"
                            value={field.value ? formatCurrencyInput(field.value) : ''}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/[^\d.]/g, '');
                              field.onChange(numericValue || '');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Additional notes about the quote..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createQuoteMutation.isPending}>
                    {createQuoteMutation.isPending ? "Adding..." : "Add Quote"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedStatus === status
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <span className="material-icons text-gray-400 text-6xl mb-4">request_quote</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedStatus === "all" ? "No quotes yet" : `No ${selectedStatus} quotes`}
              </h3>
              <p className="text-gray-500 mb-6">
                Start collecting and comparing quotes from contractors for your projects.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
                <span className="material-icons mr-2">request_quote</span>
                Add Your First Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-roboto-mono">
                      {formatCurrency(quote.amount)}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{quote.service}</p>
                  </div>
                  <Badge className={getStatusColor(quote.status)}>
                    {quote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="material-icons text-sm mr-2">business</span>
                    <span className="truncate">{getPropertyAddress(quote.propertyId)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="material-icons text-sm mr-2">person</span>
                    <span className="truncate">{getContractorName(quote.contractorId)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="material-icons text-sm mr-2">schedule</span>
                    <span>Received: {new Date(quote.dateReceived).toLocaleDateString()}</span>
                  </div>

                  {quote.validUntil && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="material-icons text-sm mr-2">event</span>
                      <span>Valid until: {new Date(quote.validUntil).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {quote.notes && (
                    <p className="text-sm text-gray-500 border-t pt-2">
                      {quote.notes}
                    </p>
                  )}
                </div>
                
                {quote.status === "pending" && (
                  <div className="flex space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-green-600 hover:text-green-700"
                      onClick={() => handleStatusChange(quote.id, "accepted")}
                      disabled={updateQuoteMutation.isPending}
                    >
                      <span className="material-icons text-sm mr-1">check</span>
                      Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleStatusChange(quote.id, "rejected")}
                      disabled={updateQuoteMutation.isPending}
                    >
                      <span className="material-icons text-sm mr-1">close</span>
                      Reject
                    </Button>
                  </div>
                )}
                
                {/* Delete button - always visible */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this quote?")) {
                        deleteQuoteMutation.mutate(quote.id);
                      }
                    }}
                    disabled={deleteQuoteMutation.isPending}
                  >
                    <span className="material-icons text-sm mr-1">delete</span>
                    Delete Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
