import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ChevronRight, ChevronDown, Calendar, User, Phone, Mail, Briefcase, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTaskSchema, insertJobSchema, type Task, type Job, type Property, type Contact, type Contractor } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function Gantt() {
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Queries
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: typeof insertTaskSchema._type) => apiRequest("POST", "/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTaskOpen(false);
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: typeof insertJobSchema._type) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setNewJobOpen(false);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<typeof insertTaskSchema._type>) =>
      apiRequest("PATCH", `/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<typeof insertJobSchema._type>) =>
      apiRequest("PATCH", `/api/jobs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  // Forms
  const taskForm = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      propertyId: 1,
      title: "",
      description: "",
      category: "general",
      status: "not_started",
      dueDate: undefined,
    },
  });

  const jobForm = useForm({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      taskId: selectedTaskId || 1,
      propertyId: 1,
      name: "",
      description: "",
      type: "general",
      status: "pending",
      dueDate: undefined,
      contractorId: undefined,
      contactId: undefined,
      notes: "",
    },
  });

  // Helper functions
  const toggleTask = (taskId: number) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getTaskJobs = (taskId: number) => {
    return jobs.filter(job => job.taskId === taskId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'renovation':
        return 'bg-orange-100 text-orange-800';
      case 'legal':
        return 'bg-purple-100 text-purple-800';
      case 'surveying':
        return 'bg-blue-100 text-blue-800';
      case 'estate_agent':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'contractor_work':
        return <Briefcase className="h-4 w-4" />;
      case 'phone_call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const onSubmitTask = (data: typeof insertTaskSchema._type) => {
    createTaskMutation.mutate(data);
  };

  const onSubmitJob = (data: typeof insertJobSchema._type) => {
    createJobMutation.mutate({
      ...data,
      taskId: selectedTaskId || 1,
    });
  };

  // Group tasks by property
  const tasksByProperty = tasks.reduce((acc, task) => {
    if (!acc[task.propertyId]) {
      acc[task.propertyId] = [];
    }
    acc[task.propertyId].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Project Management</h1>
        <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task Category</DialogTitle>
            </DialogHeader>
            <Form {...taskForm}>
              <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-4">
                <FormField
                  control={taskForm.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties.map((property: Property) => (
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
                  control={taskForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Legal Process, Renovation Work" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="renovation">Renovation</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="surveying">Surveying</SelectItem>
                          <SelectItem value="estate_agent">Estate Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Task description..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createTaskMutation.isPending}>
                  Create Task
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {properties.map((property: Property) => {
        const propertyTasks = tasksByProperty[property.id] || [];
        if (propertyTasks.length === 0) return null;

        return (
          <Card key={property.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{property.address}</span>
                <Badge variant="outline">{property.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {propertyTasks.map((task) => {
                  const taskJobs = getTaskJobs(task.id);
                  const isExpanded = expandedTasks[task.id];
                  const completedJobs = taskJobs.filter(job => job.status === 'completed').length;
                  const totalJobs = taskJobs.length;

                  return (
                    <Collapsible key={task.id} open={isExpanded} onOpenChange={() => toggleTask(task.id)}>
                      <div className="border rounded-lg p-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {getStatusIcon(task.status)}
                              <span className="font-medium">{task.title}</span>
                              <Badge className={getCategoryColor(task.category)}>
                                {task.category.replace('_', ' ')}
                              </Badge>
                              <Badge className={getStatusColor(task.status)}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                {completedJobs}/{totalJobs} completed
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskId(task.id);
                                  setNewJobOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Job
                              </Button>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-4">
                          <div className="space-y-2 ml-6">
                            {taskJobs.map((job) => {
                              const contractor = job.contractorId ? contractors.find(c => c.id === job.contractorId) : null;
                              const contact = job.contactId ? contacts.find(c => c.id === job.contactId) : null;

                              return (
                                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                  <div className="flex items-center gap-3">
                                    {getJobTypeIcon(job.type)}
                                    <span className="font-medium">{job.name}</span>
                                    <Badge className={getStatusColor(job.status)} variant="outline">
                                      {job.status}
                                    </Badge>
                                    {contractor && (
                                      <span className="text-sm text-gray-600">
                                        Contractor: {contractor.name}
                                      </span>
                                    )}
                                    {contact && (
                                      <span className="text-sm text-gray-600">
                                        Contact: {contact.name} ({contact.role})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {job.dueDate && (
                                      <span className="text-sm text-gray-500">
                                        Due: {new Date(job.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newStatus = job.status === 'completed' ? 'pending' : 
                                                       job.status === 'pending' ? 'in_progress' : 'completed';
                                        updateJobMutation.mutate({ id: job.id, status: newStatus });
                                      }}
                                    >
                                      {job.status === 'completed' ? 'Reopen' : 
                                       job.status === 'pending' ? 'Start' : 'Complete'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                            {taskJobs.length === 0 && (
                              <p className="text-gray-500 text-sm">No jobs added yet</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* New Job Dialog */}
      <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
          </DialogHeader>
          <Form {...jobForm}>
            <form onSubmit={jobForm.handleSubmit(onSubmitJob)} className="space-y-4">
              <FormField
                control={jobForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Call solicitor, Install kitchen" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={jobForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="contractor_work">Contractor Work</SelectItem>
                        <SelectItem value="phone_call">Phone Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="document_review">Document Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {jobForm.watch("type") === "contractor_work" && (
                <FormField
                  control={jobForm.control}
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
              )}

              {(jobForm.watch("type") === "phone_call" || jobForm.watch("type") === "email" || jobForm.watch("type") === "meeting") && (
                <FormField
                  control={jobForm.control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
              )}

              <FormField
                control={jobForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Job details..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={createJobMutation.isPending}>
                Add Job
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}