import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContractorSchema, type Contractor, type InsertContractor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Contractors() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: contractors = [], isLoading } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
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
            <Card key={contractor.id} className="hover:shadow-md transition-shadow">
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
