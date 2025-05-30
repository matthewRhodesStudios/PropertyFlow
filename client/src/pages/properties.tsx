import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type Property, type InsertProperty } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import PropertyCard from "@/components/property-card";
import { Plus, MapPin, Search, ExternalLink } from "lucide-react";

export default function Properties() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { toast } = useToast();

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      address: "",
      city: "",
      postcode: "",
      type: "",
      purchasePrice: "0",
      renovationBudget: "0",
      projectedSalePrice: "0",
      status: "planning",
      progress: 0,
      imageUrl: "",
      notes: "",
    },
  });

  const editForm = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      address: "",
      city: "",
      postcode: "",
      type: "",
      purchasePrice: "0",
      renovationBudget: "0",
      projectedSalePrice: "0",
      status: "planning",
      progress: 0,
      imageUrl: "",
      notes: "",
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: (data: InsertProperty) => apiRequest("POST", "/api/properties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Property added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add property", variant: "destructive" });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertProperty> }) => 
      apiRequest("PATCH", `/api/properties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsEditDialogOpen(false);
      setEditingProperty(null);
      editForm.reset();
      toast({ title: "Property updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update property", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertProperty) => {
    createPropertyMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertProperty) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data });
    }
  };

  const startEditProperty = (property: Property) => {
    setEditingProperty(property);
    editForm.reset({
      address: property.address,
      city: property.city || "",
      postcode: property.postcode || "",
      type: property.type,
      purchasePrice: property.purchasePrice,
      renovationBudget: property.renovationBudget,
      projectedSalePrice: property.projectedSalePrice || "",
      status: property.status,
      progress: property.progress,
      imageUrl: property.imageUrl || "",
      notes: property.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const showPropertyDetail = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailDialogOpen(true);
  };

  const filterByStatus = (status: string) => {
    return properties.filter(property => property.status === status);
  };

  const statusSections = [
    { status: "planning", title: "Planning", color: "border-blue-500" },
    { status: "renovation", title: "In Renovation", color: "border-accent" },
    { status: "ready_to_sell", title: "Ready to Sell", color: "border-green-500" },
    { status: "sold", title: "Sold", color: "border-gray-500" },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Properties</h1>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Properties</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark">
              <span className="material-icons mr-2">add</span>
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Norwich" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <div className="flex space-x-2">
                            <Input placeholder="NR1 1AA" {...field} />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.value && toast({
                                title: "Address Lookup",
                                description: "Address lookup requires API credentials. Please provide postcode lookup service details.",
                              })}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2-bed apartment" {...field} />
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
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="renovation">Renovation</SelectItem>
                            <SelectItem value="ready_to_sell">Ready to Sell</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="renovationBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renovation Budget</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectedSalePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projected Sale Price</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Image URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
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
                          <Textarea placeholder="Additional notes..." {...field} />
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
                  <Button type="submit" disabled={createPropertyMutation.isPending}>
                    {createPropertyMutation.isPending ? "Adding..." : "Add Property"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Property Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Property Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter property address..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="bungalow">Bungalow</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="renovation">Renovation</SelectItem>
                            <SelectItem value="ready_to_sell">Ready to Sell</SelectItem>
                            <SelectItem value="sold">Sold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price (£)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="renovationBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Renovation Budget (£)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="projectedSalePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projected Sale Price (£)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" placeholder="0" {...field} value={field.value?.toString() || ""} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Image URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any additional notes about this property..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePropertyMutation.isPending}>
                    {updatePropertyMutation.isPending ? "Updating..." : "Update Property"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <span className="material-icons text-gray-400 text-6xl mb-4">business</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first property to track and manage your real estate investments.</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
                <span className="material-icons mr-2">add</span>
                Add Your First Property
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {statusSections.map(section => {
            const sectionProperties = filterByStatus(section.status);
            if (sectionProperties.length === 0) return null;

            return (
              <div key={section.status}>
                <div className={`border-l-4 ${section.color} pl-4 mb-4`}>
                  <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-500">{sectionProperties.length} properties</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sectionProperties.map((property) => (
                    <div key={property.id} className="bg-white rounded-lg shadow-sm">
                      <PropertyCard 
                        property={property} 
                        onEdit={startEditProperty}
                        onClick={showPropertyDetail}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
