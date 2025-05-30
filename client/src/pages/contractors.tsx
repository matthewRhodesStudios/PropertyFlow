import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContractorSchema, type Contractor, type InsertContractor, type Quote, type Document, type Task, type Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, Building, Star, FileText, Receipt, Hammer } from "lucide-react";

export default function Contractors() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: contractors = [], isLoading } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const form = useForm<InsertContractor>({
    resolver: zodResolver(insertContractorSchema),
    defaultValues: {
      name: "",
      company: "",
      specialty: "",
      email: "",
      phone: "",
      rating: "",
      notes: "",
    },
  });

  const createContractorMutation = useMutation({
    mutationFn: (data: InsertContractor) => apiRequest("POST", "/api/contractors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Contractor added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add contractor", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertContractor) => {
    createContractorMutation.mutate(data);
  };

  // Helper functions for filtering data by contractor
  const getContractorQuotes = (contractorId: number) => {
    return quotes.filter(quote => quote.contractorId === contractorId);
  };

  const getContractorDocuments = (contractorId: number) => {
    return documents.filter(doc => doc.contractorId === contractorId);
  };

  const getContractorTasks = (contractorId: number) => {
    return tasks.filter(task => task.contractorId === contractorId);
  };

  const getPropertyName = (propertyId: number | null) => {
    if (!propertyId) return "No property";
    const property = properties.find(p => p.id === propertyId);
    return property?.address || "Unknown Property";
  };

  const getTotalQuoteValue = (contractorQuotes: Quote[]) => {
    return contractorQuotes.reduce((total, quote) => {
      return total + (quote.amount ? parseFloat(quote.amount.toString()) : 0);
    }, 0);
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors: Record<string, string> = {
      plumbing: "bg-blue-100 text-blue-800",
      electrical: "bg-yellow-100 text-yellow-800",
      flooring: "bg-amber-100 text-amber-800",
      painting: "bg-green-100 text-green-800",
      roofing: "bg-gray-100 text-gray-800",
      hvac: "bg-purple-100 text-purple-800",
      general: "bg-indigo-100 text-indigo-800",
    };
    return colors[specialty.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const renderStars = (rating: string | null) => {
    if (!rating) return null;
    const numRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= numRating) {
        stars.push(<span key={i} className="material-icons text-yellow-400 text-sm">star</span>);
      } else if (i - 0.5 <= numRating) {
        stars.push(<span key={i} className="material-icons text-yellow-400 text-sm">star_half</span>);
      } else {
        stars.push(<span key={i} className="material-icons text-gray-300 text-sm">star_border</span>);
      }
    }
    return <div className="flex items-center">{stars}</div>;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Contractors</h1>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show detailed contractor view if one is selected
  if (selectedContractor) {
    const contractorQuotes = getContractorQuotes(selectedContractor.id);
    const contractorDocuments = getContractorDocuments(selectedContractor.id);
    const contractorTasks = getContractorTasks(selectedContractor.id);
    const totalQuoteValue = getTotalQuoteValue(contractorQuotes);

    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedContractor(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contractors
          </Button>
          <h1 className="text-2xl font-semibold">{selectedContractor.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Contractor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedContractor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{selectedContractor.company || "No company"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{selectedContractor.email || "No email"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{selectedContractor.phone || "No phone"}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Specialty</p>
                  <Badge className={getSpecialtyColor(selectedContractor.specialty || "")}>
                    {selectedContractor.specialty || "No specialty"}
                  </Badge>
                </div>
                {selectedContractor.rating && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedContractor.rating}/5</span>
                    </div>
                  </div>
                )}
              </div>
              {selectedContractor.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedContractor.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalQuoteValue)}</p>
                <p className="text-sm text-muted-foreground">Total Quote Value</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{contractorQuotes.length}</p>
                  <p className="text-xs text-muted-foreground">Quotes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{contractorTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{contractorDocuments.length}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="quotes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Quotes ({contractorQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Hammer className="h-4 w-4" />
              Tasks ({contractorTasks.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({contractorDocuments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="space-y-4">
            {contractorQuotes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No quotes</h3>
                  <p className="text-muted-foreground">This contractor hasn't provided any quotes yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {contractorQuotes.map((quote) => (
                  <Card key={quote.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{quote.service || "Quote"}</h4>
                          <p className="text-sm text-muted-foreground">
                            Property: {getPropertyName(quote.propertyId)}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={quote.status === "accepted" ? "default" : "secondary"}>
                              {quote.status}
                            </Badge>
                            {quote.validUntil && (
                              <span className="text-sm text-muted-foreground">
                                Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(parseFloat(quote.amount?.toString() || "0"))}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {contractorTasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Hammer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tasks</h3>
                  <p className="text-muted-foreground">This contractor isn't assigned to any tasks yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {contractorTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Property: {getPropertyName(task.propertyId)}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                              {task.status}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-sm text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {contractorDocuments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No documents</h3>
                  <p className="text-muted-foreground">No documents are associated with this contractor.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractorDocuments.map((document) => (
                  <Card key={document.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{document.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{document.type}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Property: {getPropertyName(document.propertyId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(document.filePath, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Contractors</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark">
              <span className="material-icons mr-2">person_add</span>
              Add Contractor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Contractor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Construction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Plumbing, Electrical" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating (1-5)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="5" 
                            step="0.1"
                            placeholder="4.5" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 8900" {...field} />
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
                          <Textarea placeholder="Additional notes about the contractor..." {...field} />
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
                  <Button type="submit" disabled={createContractorMutation.isPending}>
                    {createContractorMutation.isPending ? "Adding..." : "Add Contractor"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {contractors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <span className="material-icons text-gray-400 text-6xl mb-4">build</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contractors yet</h3>
              <p className="text-gray-500 mb-6">Build your network of trusted contractors and trades for your renovation projects.</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
                <span className="material-icons mr-2">person_add</span>
                Add Your First Contractor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractors.map((contractor) => (
            <Card 
              key={contractor.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedContractor(contractor)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="material-icons text-primary">person</span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contractor.name}</CardTitle>
                    {contractor.company && (
                      <p className="text-sm text-gray-500">{contractor.company}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getSpecialtyColor(contractor.specialty)}>
                      {contractor.specialty}
                    </Badge>
                    {contractor.rating && renderStars(contractor.rating)}
                  </div>
                  
                  {contractor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="material-icons text-sm mr-2">email</span>
                      {contractor.email}
                    </div>
                  )}
                  
                  {contractor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="material-icons text-sm mr-2">phone</span>
                      {contractor.phone}
                    </div>
                  )}
                  
                  {contractor.notes && (
                    <p className="text-sm text-gray-500 border-t pt-2">
                      {contractor.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setLocation("/quotes")}
                  >
                    <span className="material-icons text-sm mr-1">request_quote</span>
                    Quote
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      if (contractor.email) {
                        window.open(`mailto:${contractor.email}`, '_blank');
                      } else if (contractor.phone) {
                        window.open(`tel:${contractor.phone}`, '_blank');
                      }
                    }}
                  >
                    <span className="material-icons text-sm mr-1">contact_phone</span>
                    Contact
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
