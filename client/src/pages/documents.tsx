import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDocumentSchema, type Document, type InsertDocument, type Property, type Contractor, type Task, type Job, type Contact } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, FileText, Edit2, Trash2 } from "lucide-react";

export default function Documents() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const form = useForm<InsertDocument>({
    resolver: zodResolver(insertDocumentSchema),
    defaultValues: {
      name: "",
      type: "",
      filePath: "",
      propertyId: undefined,
      contractorId: undefined,
      tags: [],
    },
  });

  const editForm = useForm<InsertDocument>({
    resolver: zodResolver(insertDocumentSchema),
    defaultValues: {
      name: "",
      type: "",
      filePath: "",
      propertyId: undefined,
      contractorId: undefined,
      tags: [],
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data: InsertDocument) => apiRequest("POST", "/api/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "Document added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add document", variant: "destructive" });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertDocument> }) => 
      apiRequest("PATCH", `/api/documents/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsEditDialogOpen(false);
      setEditingDocument(null);
      editForm.reset();
      toast({ title: "Document updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update document", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "Document deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertDocument) => {
    createDocumentMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertDocument) => {
    if (editingDocument) {
      updateDocumentMutation.mutate({ id: editingDocument.id, data });
    }
  };

  const startEditDocument = (document: Document) => {
    setEditingDocument(document);
    editForm.reset({
      name: document.name,
      type: document.type,
      filePath: document.filePath,
      propertyId: document.propertyId || undefined,
      contractorId: document.contractorId || undefined,
      tags: document.tags || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteDocument = (document: Document) => {
    if (confirm(`Are you sure you want to delete "${document.name}"? This action cannot be undone.`)) {
      deleteDocumentMutation.mutate(document.id);
    }
  };

  const getPropertyAddress = (propertyId: number | null) => {
    if (!propertyId) return null;
    const property = properties.find(p => p.id === propertyId);
    return property?.address || "Unknown Property";
  };

  const getContractorName = (contractorId: number | null) => {
    if (!contractorId) return null;
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.name || "Unknown Contractor";
  };

  const getDocumentIcon = (type: string) => {
    const icons: Record<string, string> = {
      contract: "description",
      invoice: "receipt",
      permit: "verified",
      photo: "photo",
      blueprint: "architecture",
      inspection: "fact_check",
      quote: "request_quote",
      other: "insert_drive_file",
    };
    return icons[type.toLowerCase()] || "insert_drive_file";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      contract: "bg-blue-100 text-blue-800",
      invoice: "bg-green-100 text-green-800",
      permit: "bg-purple-100 text-purple-800",
      photo: "bg-pink-100 text-pink-800",
      blueprint: "bg-indigo-100 text-indigo-800",
      inspection: "bg-yellow-100 text-yellow-800",
      quote: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const filteredDocuments = selectedType === "all" 
    ? documents 
    : documents.filter(doc => doc.type.toLowerCase() === selectedType);

  const documentTypes = ["all", "contract", "invoice", "permit", "photo", "blueprint", "inspection", "quote", "other"];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Documents</h1>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark">
              <span className="material-icons mr-2">upload_file</span>
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Document Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Kitchen renovation contract" {...field} />
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
                        <FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="permit">Permit</SelectItem>
                            <SelectItem value="photo">Photo</SelectItem>
                            <SelectItem value="blueprint">Blueprint</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="quote">Quote</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="filePath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload File</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input 
                              type="file" 
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // For now, just set the filename as the path
                                  // In a real implementation, you'd upload to a server
                                  field.onChange(`/uploads/${file.name}`);
                                  // Auto-populate document name if empty
                                  if (!form.getValues("name")) {
                                    form.setValue("name", file.name.replace(/\.[^/.]+$/, ""));
                                  }
                                }
                              }}
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                            />
                            <p className="text-xs text-muted-foreground">
                              Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT, Excel
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property (optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No property</SelectItem>
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
                        <FormLabel>Contractor (optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contractor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No contractor</SelectItem>
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
                    name="contactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact (optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No contact</SelectItem>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                {contact.name} - {contact.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Task Assignments (optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task</label>
                        <Select defaultValue="none">
                          <SelectTrigger>
                            <SelectValue placeholder="Select task" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No task</SelectItem>
                            {tasks.map((task) => (
                              <SelectItem key={task.id} value={task.id.toString()}>
                                {task.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtask</label>
                        <Select defaultValue="none">
                          <SelectTrigger>
                            <SelectValue placeholder="Select subtask" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No subtask</SelectItem>
                            {jobs.map((job) => (
                              <SelectItem key={job.id} value={job.id.toString()}>
                                {job.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDocumentMutation.isPending}>
                    {createDocumentMutation.isPending ? "Adding..." : "Add Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Document Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center">
                <Edit2 className="h-5 w-5 mr-2 text-blue-600" />
                Edit Document
              </DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-8 pt-4">
                
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Document Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Document Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter document name..." 
                              {...field} 
                              className="focus:ring-2 focus:ring-blue-500"
                            />
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
                          <FormLabel className="text-sm font-semibold">Document Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="contract">📋 Contract</SelectItem>
                              <SelectItem value="certificate">🏆 Certificate</SelectItem>
                              <SelectItem value="report">📊 Report</SelectItem>
                              <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                              <SelectItem value="legal">⚖️ Legal</SelectItem>
                              <SelectItem value="financial">💰 Financial</SelectItem>
                              <SelectItem value="inspection">🔍 Inspection</SelectItem>
                              <SelectItem value="quote">💵 Quote</SelectItem>
                              <SelectItem value="other">📄 Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Assignment Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Document Assignments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={editForm.control}
                      name="propertyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Property</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                            <FormControl>
                              <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Select property" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">🚫 No property</SelectItem>
                              {properties.map((property) => (
                                <SelectItem key={property.id} value={property.id.toString()}>
                                  🏠 {property.address}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="contractorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Contractor</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                            <FormControl>
                              <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Select contractor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">🚫 No contractor</SelectItem>
                              {contractors.map((contractor) => (
                                <SelectItem key={contractor.id} value={contractor.id.toString()}>
                                  👷 {contractor.name} - {contractor.company}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="contactId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Contact</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                            <FormControl>
                              <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Select contact" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">🚫 No contact</SelectItem>
                              {contacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id.toString()}>
                                  👤 {contact.name} - {contact.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Task Assignment Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Task Assignments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Task</label>
                      <Select defaultValue="none">
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">🚫 No task</SelectItem>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id.toString()}>
                              📋 {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subtask</label>
                      <Select defaultValue="none">
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select subtask" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">🚫 No subtask</SelectItem>
                          {jobs.map((job) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              ⚡ {job.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateDocumentMutation.isPending}>
                    {updateDocumentMutation.isPending ? "Updating..." : "Update Document"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {documentTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedType === type
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <span className="material-icons text-gray-400 text-6xl mb-4">folder_open</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedType === "all" ? "No documents yet" : `No ${selectedType} documents`}
              </h3>
              <p className="text-gray-500 mb-6">
                Upload and organize your property documents in one place.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary-dark">
                <span className="material-icons mr-2">upload_file</span>
                Add Your First Document
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="material-icons text-primary text-lg">
                        {getDocumentIcon(document.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {document.name}
                    </CardTitle>
                    <Badge className={`text-xs ${getTypeColor(document.type)} mt-1`}>
                      {document.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-gray-500">
                  {document.propertyId && (
                    <div className="flex items-center">
                      <span className="material-icons text-xs mr-1">business</span>
                      <span className="truncate">{getPropertyAddress(document.propertyId)}</span>
                    </div>
                  )}
                  
                  {document.contractorId && (
                    <div className="flex items-center">
                      <span className="material-icons text-xs mr-1">person</span>
                      <span className="truncate">{getContractorName(document.contractorId)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <span className="material-icons text-xs mr-1">schedule</span>
                    <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/documents/${document.id}/view`);
                        if (response.ok) {
                          const docData = await response.json();
                          setViewingDocument(docData);
                        } else {
                          toast({
                            title: "Error",
                            description: "Failed to load document",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to load document",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      const downloadUrl = `/api/documents/${document.id}/download`;
                      const link = window.document.createElement('a');
                      link.href = downloadUrl;
                      link.download = document.name;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => startEditDocument(document)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteDocument(document)}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Document Viewing Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {viewingDocument?.name}
            </DialogTitle>
          </DialogHeader>
          
          {viewingDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">Document Type</label>
                  <p className="text-sm">{viewingDocument.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Upload Date</label>
                  <p className="text-sm">{new Date(viewingDocument.uploadDate).toLocaleDateString()}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-500">File Path</label>
                  <p className="text-sm font-mono bg-white p-2 rounded border">{viewingDocument.filePath}</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-white">
                <h4 className="font-medium mb-2">Document Content</h4>
                <div className="bg-gray-50 p-4 rounded border min-h-[200px] whitespace-pre-wrap text-sm">
                  {viewingDocument.content}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    const downloadUrl = `/api/documents/${viewingDocument.id}/download`;
                    const link = window.document.createElement('a');
                    link.href = downloadUrl;
                    link.download = viewingDocument.name;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setViewingDocument(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
