import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContractorSchema, type InsertContractor, type Contractor, type Quote, type Task, type Document } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Plus, Building, Receipt, Hammer, FileText, ChevronDown, ChevronUp, Star, Phone, Mail, Globe, MessageSquare, Edit, Trash2, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contractors() {
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  const { data: contractors = [], isLoading } = useQuery({
    queryKey: ["/api/contractors"],
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["/api/quotes"],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertContractor) => {
      console.log("Creating contractor with data:", data);
      return apiRequest("POST", "/api/contractors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      handleCloseForm();
      toast({
        title: "Success",
        description: "Contractor added successfully",
      });
    },
    onError: (error: any) => {
      console.error("Create contractor error:", error);
      toast({
        title: "Error", 
        description: error.message || "Failed to add contractor",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertContractor> }) => 
      apiRequest("PATCH", `/api/contractors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      setEditingContractor(null);
      toast({
        title: "Success",
        description: "Contractor updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update contractor",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/contractors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contractors"] });
      setEditingContractor(null);
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Contractor deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete contractor",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertContractor>({
    resolver: zodResolver(insertContractorSchema),
    defaultValues: {
      name: "",
      company: "",
      contactPerson: "",
      specialty: "",
      email: "",
      phone: "",
      website: "",
      preferredContact: "phone",
      rating: undefined,
      notes: "",
    },
  });

  const onSubmit = (data: InsertContractor) => {
    console.log("Form submitted with data:", data);
    
    // Clean up the data - convert empty strings to null
    const processedData = {
      name: data.name,
      company: data.company || null,
      contactPerson: data.contactPerson || null,
      specialty: data.specialty,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      preferredContact: data.preferredContact || "phone",
      rating: data.rating ? data.rating.toString() : null,
      notes: data.notes || null,
    };

    console.log("Processed data:", processedData);

    if (editingContractor) {
      updateMutation.mutate({ id: editingContractor.id, data: processedData });
    } else {
      createMutation.mutate(processedData);
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    form.reset({
      name: contractor.name,
      company: contractor.company || "",
      contactPerson: contractor.contactPerson || "",
      specialty: contractor.specialty,
      email: contractor.email || "",
      phone: contractor.phone || "",
      website: contractor.website || "",
      preferredContact: contractor.preferredContact || "phone",
      rating: contractor.rating ? parseFloat(contractor.rating.toString()) : undefined,
      notes: contractor.notes || "",
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContractor(null);
    setShowCustomSpecialty(false);
    setCustomSpecialty("");
    setShowDeleteConfirm(false);
    form.reset({
      name: "",
      company: "",
      contactPerson: "",
      specialty: "",
      email: "",
      phone: "",
      website: "",
      preferredContact: "phone",
      rating: undefined,
      notes: "",
    });
  };

  const handleDelete = () => {
    if (editingContractor) {
      deleteMutation.mutate(editingContractor.id);
    }
  };

  const getExistingSpecialties = () => {
    const defaultSpecialties = ["Plumbing", "Electrical", "Flooring", "Painting", "Roofing", "HVAC", "Landscaping", "General"];
    const existingSpecialties = new Set(contractors.map((c: any) => c.specialty).filter(Boolean));
    const allSpecialties = [...defaultSpecialties];
    
    existingSpecialties.forEach(specialty => {
      if (!defaultSpecialties.includes(specialty)) {
        allSpecialties.push(specialty);
      }
    });
    
    return allSpecialties.sort();
  };

  const getSpecialtyUsageCount = (specialty: string) => {
    return contractors.filter((c: any) => c.specialty === specialty).length;
  };

  const isCustomSpecialty = (specialty: string) => {
    const defaultSpecialties = ["Plumbing", "Electrical", "Flooring", "Painting", "Roofing", "HVAC", "Landscaping", "General"];
    return !defaultSpecialties.includes(specialty);
  };

  const handleSpecialtyChange = (value: string) => {
    if (value === "custom") {
      setShowCustomSpecialty(true);
      form.setValue("specialty", "");
    } else {
      setShowCustomSpecialty(false);
      setCustomSpecialty("");
      form.setValue("specialty", value);
    }
  };

  const handleCustomSpecialtySubmit = () => {
    if (customSpecialty.trim()) {
      const trimmedSpecialty = customSpecialty.trim();
      console.log("Setting custom specialty:", trimmedSpecialty);
      form.setValue("specialty", trimmedSpecialty);
      setShowCustomSpecialty(false);
      setCustomSpecialty("");
      toast({
        title: "Custom Specialty Added",
        description: `"${trimmedSpecialty}" has been set as the specialty`,
      });
    }
  };

  const handleRemoveSpecialty = (specialtyToRemove: string) => {
    // Only allow removal of custom specialties that aren't in use
    if (isCustomSpecialty(specialtyToRemove) && getSpecialtyUsageCount(specialtyToRemove) === 0) {
      toast({
        title: "Specialty Removed",
        description: `"${specialtyToRemove}" has been removed from the options`,
      });
      // The specialty will automatically be removed from the dropdown on next render
      // since getExistingSpecialties() only includes specialties that are in use by contractors
    }
  };

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;

  const getPropertyName = (propertyId: number) => {
    const property = properties.find((p: any) => p.id === propertyId);
    return property?.address || "Unknown Property";
  };

  const getContractorQuotes = (contractorId: number): Quote[] => {
    return quotes.filter((quote: any) => quote.contractorId === contractorId);
  };

  const getContractorTasks = (contractorId: number): Task[] => {
    return tasks.filter((task: any) => task.contractorId === contractorId);
  };

  const getContractorDocuments = (contractorId: number): Document[] => {
    return documents.filter((doc: any) => doc.contractorId === contractorId);
  };

  const getTotalQuoteValue = (quotes: Quote[]) => {
    return quotes.reduce((total, quote) => total + parseFloat(quote.amount?.toString() || "0"), 0);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors: Record<string, string> = {
      "Plumbing": "bg-blue-100 text-blue-800",
      "Electrical": "bg-yellow-100 text-yellow-800",
      "Flooring": "bg-brown-100 text-brown-800",
      "Painting": "bg-purple-100 text-purple-800",
      "Roofing": "bg-gray-100 text-gray-800",
      "HVAC": "bg-green-100 text-green-800",
      "Landscaping": "bg-green-200 text-green-800",
      "General": "bg-slate-100 text-slate-800"
    };
    return colors[specialty] || "bg-gray-100 text-gray-800";
  };

  const getContactMethodIcon = (method: string) => {
    switch (method) {
      case "phone": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "text": return <MessageSquare className="h-4 w-4" />;
      case "whatsapp": return <MessageSquare className="h-4 w-4 text-green-600" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const groupContractorsBySpecialty = () => {
    const specialtyGroups: Record<string, Contractor[]> = {};
    
    contractors.forEach((contractor: Contractor) => {
      if (!specialtyGroups[contractor.specialty]) {
        specialtyGroups[contractor.specialty] = [];
      }
      specialtyGroups[contractor.specialty].push(contractor);
    });

    return Object.entries(specialtyGroups).map(([specialty, contractors]) => ({
      specialty,
      contractors
    }));
  };

  const getFileIcon = (filePath: string, fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
    
    if (isImage) {
      return (
        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100">
          <img 
            src={filePath} 
            alt={fileName}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg></div>';
              }
            }}
          />
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
        <FileText className="h-6 w-6 text-primary" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pl-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contractors</h1>
          <p className="text-muted-foreground">Manage your network of professional contractors</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (open) {
            setIsFormOpen(true);
            setEditingContractor(null);
            form.reset({
              name: "",
              company: "",
              contactPerson: "",
              specialty: "",
              email: "",
              phone: "",
              website: "",
              preferredContact: "phone",
              rating: undefined,
              notes: "",
            });
          } else {
            handleCloseForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contractor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContractor ? "Edit Contractor" : "Add New Contractor"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contractor Name</FormLabel>
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
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith Construction Ltd" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="Site Manager, Office Manager, etc." {...field} value={field.value || ""} />
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
                        {!showCustomSpecialty ? (
                          <div>
                            <Select onValueChange={handleSpecialtyChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select specialty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getExistingSpecialties().map((specialty) => (
                                  <SelectItem key={specialty} value={specialty} className="group">
                                    <div className="flex items-center justify-between w-full">
                                      <span>{specialty}</span>
                                      {isCustomSpecialty(specialty) && getSpecialtyUsageCount(specialty) === 0 && (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveSpecialty(specialty);
                                          }}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                                <SelectItem value="custom">+ Add Custom Specialty</SelectItem>
                              </SelectContent>
                            </Select>
                            {field.value && !getExistingSpecialties().includes(field.value) && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                Custom specialty set: "{field.value}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter custom specialty"
                              value={customSpecialty}
                              onChange={(e) => setCustomSpecialty(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCustomSpecialtySubmit();
                                }
                              }}
                            />
                            <Button 
                              type="button" 
                              onClick={handleCustomSpecialtySubmit}
                              disabled={!customSpecialty.trim()}
                            >
                              Add
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => {
                                setShowCustomSpecialty(false);
                                setCustomSpecialty("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="07123 456789" {...field} value={field.value || ""} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@smithconstruction.co.uk" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="www.smithconstruction.co.uk" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferredContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Contact Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="text">Text Message</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
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
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about the contractor..." 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between">
                  {editingContractor && (
                    <div>
                      {!showDeleteConfirm ? (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowDeleteConfirm(false)}
                          >
                            Cancel Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={handleCloseForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}>
                      {editingContractor ? (
                        updateMutation.isPending ? "Updating..." : "Update Contractor"
                      ) : (
                        createMutation.isPending ? "Adding..." : "Add Contractor"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {contractors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No contractors yet</h3>
            <p className="text-muted-foreground mb-4">Start building your network of professional contractors</p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contractor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupContractorsBySpecialty().map(({ specialty, contractors: specialtyContractors }) => (
            <div key={specialty} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800">{specialty}</h2>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {specialtyContractors.length} contractor{specialtyContractors.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specialtyContractors.map((contractor) => (
                  <Card 
                    key={contractor.id} 
                    className="ml-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="material-icons text-primary">person</span>
                        </div>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedContractor(selectedContractor?.id === contractor.id ? null : contractor)}
                        >
                          <CardTitle className="text-lg">{contractor.name}</CardTitle>
                          {contractor.company && (
                            <p className="text-sm text-gray-500">{contractor.company}</p>
                          )}
                          {contractor.contactPerson && (
                            <p className="text-xs text-gray-400">Contact: {contractor.contactPerson}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(contractor);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <div 
                            className="cursor-pointer"
                            onClick={() => setSelectedContractor(selectedContractor?.id === contractor.id ? null : contractor)}
                          >
                            {selectedContractor?.id === contractor.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
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
                        
                        <div className="space-y-2">
                          {contractor.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              {contractor.phone}
                            </div>
                          )}
                          
                          {contractor.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2" />
                              {contractor.email}
                            </div>
                          )}
                          
                          {contractor.website && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="h-4 w-4 mr-2" />
                              {contractor.website}
                            </div>
                          )}

                          {contractor.preferredContact && (
                            <div className="flex items-center text-sm text-gray-600">
                              {getContactMethodIcon(contractor.preferredContact)}
                              <span className="ml-2 capitalize">Prefers {contractor.preferredContact}</span>
                            </div>
                          )}
                        </div>
                        
                        {contractor.notes && (
                          <p className="text-sm text-gray-600 truncate">{contractor.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Show expanded details right after this specialty section if a contractor from this section is selected */}
              {selectedContractor && specialtyContractors.some(c => c.id === selectedContractor.id) && (
                <Card className="mt-4 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {selectedContractor.name} - Detailed View
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const contractorQuotes = getContractorQuotes(selectedContractor.id);
                      const contractorDocuments = getContractorDocuments(selectedContractor.id);
                      const contractorTasks = getContractorTasks(selectedContractor.id);
                      const totalQuoteValue = getTotalQuoteValue(contractorQuotes);

                      return (
                        <div className="space-y-6">
                          {/* Summary Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-primary/5 rounded-lg">
                              <p className="text-2xl font-bold text-primary">{formatCurrency(totalQuoteValue)}</p>
                              <p className="text-sm text-muted-foreground">Total Quote Value</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">{contractorQuotes.length}</p>
                              <p className="text-sm text-muted-foreground">Quotes</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <p className="text-2xl font-bold text-green-600">{contractorTasks.length}</p>
                              <p className="text-sm text-muted-foreground">Tasks</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                              <p className="text-2xl font-bold text-orange-600">{contractorDocuments.length}</p>
                              <p className="text-sm text-muted-foreground">Documents</p>
                            </div>
                          </div>

                          {/* Detailed Information Tabs */}
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
                                <div className="text-center p-12">
                                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-medium mb-2">No quotes</h3>
                                  <p className="text-muted-foreground">This contractor hasn't provided any quotes yet.</p>
                                </div>
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
                                <div className="text-center p-12">
                                  <Hammer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-medium mb-2">No tasks</h3>
                                  <p className="text-muted-foreground">This contractor isn't assigned to any tasks yet.</p>
                                </div>
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
                                <div className="text-center p-12">
                                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                  <h3 className="text-lg font-medium mb-2">No documents</h3>
                                  <p className="text-muted-foreground">No documents are associated with this contractor.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {contractorDocuments.map((document) => (
                                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex items-start space-x-3">
                                          <div className="flex-shrink-0">
                                            {getFileIcon(document.filePath, document.name)}
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
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}