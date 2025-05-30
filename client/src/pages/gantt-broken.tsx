import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ChevronRight, ChevronDown, Calendar, User, Phone, Mail, Briefcase, CheckCircle, Clock, AlertCircle, Edit2, PoundSterling, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTaskSchema, insertJobSchema, insertQuoteSchema, type Task, type Job, type Property, type Contact, type Contractor, type Quote } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Gantt() {
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editJobOpen, setEditJobOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

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

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTaskOpen(false);
      taskForm.reset();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) =>
      apiRequest("PATCH", `/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditTaskOpen(false);
      setEditingTask(null);
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setNewJobOpen(false);
      jobForm.reset();
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) =>
      apiRequest("PATCH", `/api/jobs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setEditJobOpen(false);
      setEditingJob(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
      quotable: false,
      dueDate: undefined,
    },
  });

  const jobForm = useForm({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      taskId: 1,
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

  const getTaskQuotes = (taskId: number) => {
    const taskJobs = getTaskJobs(taskId);
    return quotes.filter(quote => taskJobs.some(job => job.id === quote.jobId));
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'renovation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'legal':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'surveying':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'estate_agent':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const onSubmitTask = (data: any) => {
    createTaskMutation.mutate(data);
  };

  const onSubmitJob = (data: any) => {
    createJobMutation.mutate({
      ...data,
      taskId: selectedTaskId || 1,
    });
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    taskForm.reset({
      propertyId: task.propertyId,
      title: task.title,
      description: task.description || "",
      category: task.category,
      status: task.status,
      quotable: task.quotable || false,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    });
    setEditTaskOpen(true);
  };

  const startEditJob = (job: Job) => {
    setEditingJob(job);
    jobForm.reset({
      taskId: job.taskId,
      propertyId: job.propertyId,
      name: job.name,
      description: job.description || "",
      type: job.type,
      status: job.status,
      dueDate: job.dueDate ? new Date(job.dueDate) : undefined,
      contractorId: job.contractorId || undefined,
      contactId: job.contactId || undefined,
      notes: job.notes || "",
    });
    setEditJobOpen(true);
  };

  const calculateTaskProgress = (task: Task) => {
    const taskJobs = getTaskJobs(task.id);
    if (taskJobs.length === 0) return 0;
    const completed = taskJobs.filter(job => job.status === 'completed').length;
    return Math.round((completed / taskJobs.length) * 100);
  };

  const getDaysUntilDue = (dueDate: Date | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <div>
          <h1 className="text-3xl font-bold">Project Timeline</h1>
          <p className="text-gray-600 mt-1">Manage tasks and track progress across all properties</p>
        </div>
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
                          {(properties as Property[]).map((property) => (
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
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
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={taskForm.control}
                  name="quotable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Quotable Task
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          Enable quotes for this task (e.g., renovation work, contractor services)
                        </p>
                      </div>
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



      {/* Properties with Professional Contacts and Tasks */}
      {(properties as Property[]).map((property) => {
        const propertyTasks = tasksByProperty[property.id] || [];
        const propertySolicitors = contacts.filter(contact => 
          contact.role === 'solicitor' && 
          (contact.propertyId === property.id || contact.propertyId === null)
        );
        const propertyEstateAgents = contacts.filter(contact => 
          contact.role === 'estate_agent' && 
          (contact.propertyId === property.id || contact.propertyId === null)
        );

        return (
          <Card key={property.id} className="border-2 mb-8">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{property.address}</span>
                  <Badge variant="outline" className="border-2">{property.type}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    size="sm"
                    onClick={() => {
                      taskForm.setValue('propertyId', property.id);
                      setNewTaskOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            {/* Professional Contacts for this Property */}
            <div className="grid md:grid-cols-2 gap-4 p-6 bg-gray-25 border-b">
              {/* Solicitors for this Property */}
              <Card className="border border-blue-200">
                <CardHeader className="bg-blue-50 py-3">
                  <CardTitle className="flex items-center justify-between text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Solicitors
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-6">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {propertySolicitors.map((solicitor) => (
                      <div key={solicitor.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                        <div>
                          <div className="font-medium">{solicitor.name}</div>
                          {solicitor.company && <div className="text-xs text-gray-600">{solicitor.company}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          {solicitor.phone && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          {solicitor.email && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {propertySolicitors.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-2">No solicitors assigned</p>
                    )}
                    
                    {/* Legal Tasks under Solicitors */}
                    <div className="mt-3 space-y-1">
                      <h5 className="text-xs font-medium text-gray-700">Legal Tasks:</h5>
                      {propertyTasks.filter(task => task.category === 'legal').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-blue-25 rounded text-xs border-l-2 border-blue-300">
                          <span>{task.title}</span>
                          <div className="flex items-center gap-1">
                            <Badge className={getStatusColor(task.status)} size="sm">{task.status}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Delete "${task.title}"?`)) {
                                  deleteTaskMutation.mutate(task.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estate Agents for this Property */}
              <Card className="border border-green-200">
                <CardHeader className="bg-green-50 py-3">
                  <CardTitle className="flex items-center justify-between text-sm text-green-800">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Estate Agents
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-6">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {propertyEstateAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          {agent.company && <div className="text-xs text-gray-600">{agent.company}</div>}
                        </div>
                        <div className="flex items-center gap-1">
                          {agent.phone && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          {agent.email && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {propertyEstateAgents.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-2">No estate agents assigned</p>
                    )}
                    
                    {/* Estate Agent Tasks */}
                    <div className="mt-3 space-y-1">
                      <h5 className="text-xs font-medium text-gray-700">Estate Agent Tasks:</h5>
                      {propertyTasks.filter(task => task.category === 'estate_agent').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-green-25 rounded text-xs border-l-2 border-green-300">
                          <span>{task.title}</span>
                          <div className="flex items-center gap-1">
                            <Badge className={getStatusColor(task.status)} size="sm">{task.status}</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Delete "${task.title}"?`)) {
                                  deleteTaskMutation.mutate(task.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Task Timeline for Other Categories */}
            <CardContent className="p-0">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {propertyTasks.filter(task => !['legal', 'estate_agent'].includes(task.category)).map((task, index) => {
                  const taskJobs = getTaskJobs(task.id);
                  const taskQuotes = getTaskQuotes(task.id);
                  const isExpanded = expandedTasks[task.id];
                  const progress = calculateTaskProgress(task);
                  const daysUntilDue = getDaysUntilDue(task.dueDate);

                  return (
                    <div key={task.id} className="relative">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-6 w-4 h-4 rounded-full border-2 bg-white z-10",
                        task.status === 'completed' ? 'border-green-500' :
                        task.status === 'in_progress' ? 'border-blue-500' :
                        'border-gray-300'
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full m-0.5",
                          task.status === 'completed' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-gray-300'
                        )}></div>
                      </div>

                      <Collapsible open={isExpanded} onOpenChange={() => toggleTask(task.id)}>
                        <div className="ml-16 p-6 border-b border-gray-100">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5 text-gray-500" />
                                  )}
                                  <h3 className="text-lg font-semibold">{task.title}</h3>
                                </div>
                                <Badge className={getCategoryColor(task.category)}>
                                  {task.category.replace('_', ' ')}
                                </Badge>
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                {task.dueDate && (
                                  <div className={cn(
                                    "flex items-center gap-1 text-sm px-2 py-1 rounded",
                                    daysUntilDue && daysUntilDue < 0 ? 'bg-red-100 text-red-800' :
                                    daysUntilDue && daysUntilDue <= 7 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-600'
                                  )}>
                                    <Calendar className="h-3 w-3" />
                                    {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                                     daysUntilDue === 0 ? 'Due today' :
                                     daysUntilDue === 1 ? 'Due tomorrow' :
                                     `${daysUntilDue} days left`}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium">{progress}% Complete</div>
                                  <div className="text-xs text-gray-500">
                                    {taskJobs.filter(j => j.status === 'completed').length}/{taskJobs.length} jobs
                                  </div>
                                </div>
                                <div className="w-20 h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="cursor-grab active:cursor-grabbing hover:bg-gray-100"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditTask(task);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Are you sure you want to delete the task "${task.title}"? This will also delete all associated jobs and cannot be undone.`)) {
                                        deleteTaskMutation.mutate(task.id);
                                      }
                                    }}
                                    disabled={deleteTaskMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="mt-6 space-y-4">
                              {task.description && (
                                <p className="text-gray-600">{task.description}</p>
                              )}
                              
                              <div className="flex gap-4 mb-4">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTaskId(task.id);
                                    setNewJobOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add Job
                                </Button>
                                {taskQuotes.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <PoundSterling className="h-4 w-4" />
                                    {taskQuotes.length} quote{taskQuotes.length !== 1 ? 's' : ''} available
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                {taskJobs.map((job) => {
                                  const contractor = job.contractorId ? contractors.find(c => c.id === job.contractorId) : null;
                                  const contact = job.contactId ? contacts.find(c => c.id === job.contactId) : null;
                                  const jobQuotes = quotes.filter(q => q.jobId === job.id);
                                  const jobDaysUntilDue = getDaysUntilDue(job.dueDate);

                                  return (
                                    <div key={job.id} className={cn(
                                      "flex items-center justify-between p-4 rounded-lg border-2",
                                      getStatusColor(job.status)
                                    )}>
                                      <div className="flex items-center gap-3">
                                        {getJobTypeIcon(job.type)}
                                        <div>
                                          <div className="font-medium">{job.name}</div>
                                          <div className="text-sm opacity-75">
                                            {contractor && `Contractor: ${contractor.name}`}
                                            {contact && `Contact: ${contact.name} (${contact.role})`}
                                            {jobQuotes.length > 0 && (
                                              <span className="ml-2">• {jobQuotes.length} quote{jobQuotes.length !== 1 ? 's' : ''}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {job.dueDate && (
                                          <div className={cn(
                                            "text-xs px-2 py-1 rounded",
                                            jobDaysUntilDue && jobDaysUntilDue < 0 ? 'bg-red-200 text-red-800' :
                                            jobDaysUntilDue && jobDaysUntilDue <= 3 ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-white/50'
                                          )}>
                                            Due: {format(new Date(job.dueDate), "MMM d")}
                                          </div>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => startEditJob(job)}
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
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
                                  <div className="text-center py-8 text-gray-500">
                                    <p>No jobs added yet</p>
                                    <p className="text-sm">Click "Add Job" to get started</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* New Job Dialog */}
      <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
          </DialogHeader>
          <Form {...jobForm}>
            <form onSubmit={jobForm.handleSubmit(onSubmitJob)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <FormField
                control={jobForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewJobOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createJobMutation.isPending}>
                  Add Job
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit((data) => {
              if (editingTask) {
                updateTaskMutation.mutate({ id: editingTask.id, ...data });
              }
            })} className="space-y-4">
              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={taskForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={taskForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditTaskOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTaskMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={editJobOpen} onOpenChange={setEditJobOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <Form {...jobForm}>
            <form onSubmit={jobForm.handleSubmit((data) => {
              if (editingJob) {
                updateJobMutation.mutate({ id: editingJob.id, ...data });
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={jobForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={jobForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
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
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={jobForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditJobOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateJobMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}