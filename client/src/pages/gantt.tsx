import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ChevronRight, ChevronDown, Calendar, User, Phone, Mail, Briefcase, Edit2, PoundSterling, Trash2, GripVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTaskSchema, insertJobSchema, insertContactSchema, insertEventSchema, type Task, type Job, type Property, type Contact, type Contractor, type Quote, type Event } from "@shared/schema";
import { cn, formatCurrency } from "@/lib/utils";

export default function Gantt() {
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [editJobOpen, setEditJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [contactType, setContactType] = useState<'solicitor' | 'estate_agent'>('solicitor');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dueDateType, setDueDateType] = useState<'absolute' | 'relative'>('absolute');

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

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
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

  const createJobMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setNewJobOpen(false);
      jobForm.reset();
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      console.log('Making PATCH request to:', `/api/contacts/${id}`, 'with data:', data);
      return apiRequest("PATCH", `/api/contacts/${id}`, data);
    },
    onSuccess: (result) => {
      console.log('Update successful:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setEditContactOpen(false);
      contactForm.reset();
      setEditingContact(null);
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  const createContactMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setEditContactOpen(false);
      contactForm.reset();
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setNewEventOpen(false);
      setEditingEvent(null);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PATCH", `/api/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setNewEventOpen(false);
      setEditingEvent(null);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setEditTaskOpen(false);
      setEditingTask(null);
      editTaskForm.reset();
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) =>
      apiRequest("PATCH", `/api/jobs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
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
      dependsOnTaskId: undefined,
      relativeDueDays: undefined,
      relativeDirection: "after",
    },
  });

  const jobForm = useForm({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      taskId: 1,
      propertyId: 1,
      name: "",
      description: "",
      status: "pending",
      dueDate: undefined,
      contractorId: undefined,
      contactId: undefined,
    },
  });

  const contactForm = useForm({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      propertyId: null,
      name: "",
      company: "",
      role: "solicitor",
      specialization: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  const editTaskForm = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      propertyId: 1,
      title: "",
      description: "",
      category: "general",
      status: "not_started",
      quotable: false,
      dueDate: undefined,
      dependsOnTaskId: undefined,
      relativeDueDays: undefined,
      relativeDirection: "after",
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
    return quotes.filter(quote => quote.taskId === taskId);
  };

  const calculateTaskProgress = (task: Task) => {
    const taskJobs = getTaskJobs(task.id);
    if (taskJobs.length === 0) return 0;
    const completedJobs = taskJobs.filter(job => job.status === 'completed');
    return Math.round((completedJobs.length / taskJobs.length) * 100);
  };

  const isTaskFullyCompleted = (task: Task) => {
    const taskJobs = getTaskJobs(task.id);
    if (taskJobs.length === 0) return false;
    return taskJobs.every(job => job.status === 'completed');
  };

  const getDaysUntilDue = (dueDate: Date | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRelativeDateDescription = (task: Task) => {
    if (!task.dependsOnTaskId) return null;
    
    const dependencyTask = tasks.find(t => t.id === task.dependsOnTaskId);
    if (!dependencyTask) return null;

    const direction = task.relativeDirection || 'after';
    const days = task.relativeDueDays;
    
    if (days && days > 0) {
      const timing = direction === 'before' ? 'starts' : 'completes';
      return `${days} day${days !== 1 ? 's' : ''} ${direction} "${dependencyTask.title}" ${timing}`;
    } else {
      // Immediate dependency (no days specified)
      return `${direction} "${dependencyTask.title}"`;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'legal': return 'bg-blue-100 text-blue-800';
      case 'surveying': return 'bg-purple-100 text-purple-800';
      case 'renovation': return 'bg-orange-100 text-orange-800';
      case 'estate_agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const onSubmitTask = (data: any) => {
    console.log('Task form data:', data);
    console.log('Due date type:', dueDateType);
    
    const processedData = { ...data };
    if (dueDateType === 'relative') {
      processedData.dueDate = null; // Clear absolute date when using relative
      // Ensure relativeDirection is set
      if (!processedData.relativeDirection) {
        processedData.relativeDirection = 'after';
      }
    } else {
      processedData.dependsOnTaskId = null;
      processedData.relativeDueDays = null;
      processedData.relativeDirection = null;
    }
    
    console.log('Processed task data:', processedData);
    createTaskMutation.mutate(processedData);
  };

  const onSubmitJob = (data: any) => {
    console.log('Job form data:', data);
    console.log('Selected task ID:', selectedTaskId);
    console.log('Selected property ID:', selectedPropertyId);
    
    const jobData = {
      ...data,
      taskId: selectedTaskId || 1,
      propertyId: selectedPropertyId || 1,
      type: "general", // Set default type since it's required by schema
      dueDate: data.dueDate ? data.dueDate : undefined, // Keep as string for server conversion
      contractorId: data.contractorId || undefined,
      contactId: data.contactId || undefined,
    };
    
    console.log('Final job data:', jobData);
    createJobMutation.mutate(jobData);
  };

  const onSubmitContact = (data: any) => {
    console.log('Submitting contact data:', data);
    console.log('Editing contact:', editingContact);
    
    if (editingContact) {
      const updateData = {
        ...data,
        propertyId: selectedPropertyId,
        role: contactType
      };
      console.log('Update data:', updateData);
      updateContactMutation.mutate({
        id: editingContact.id,
        data: updateData
      });
    } else {
      createContactMutation.mutate({
        ...data,
        propertyId: selectedPropertyId,
        role: contactType
      });
    }
  };

  const editContact = (contact: Contact, type: 'solicitor' | 'estate_agent') => {
    setEditingContact(contact);
    setContactType(type);
    setSelectedPropertyId(contact.propertyId);
    contactForm.reset({
      name: contact.name,
      company: contact.company || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      notes: contact.notes || "",
      specialization: contact.specialization || "",
      role: type,
    });
    setEditContactOpen(true);
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setDueDateType(task.dependsOnTaskId ? 'relative' : 'absolute');
    editTaskForm.reset({
      propertyId: task.propertyId,
      title: task.title,
      description: task.description || "",
      category: task.category,
      status: task.status,
      quotable: task.quotable,
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : undefined,
      dependsOnTaskId: task.dependsOnTaskId || undefined,
      relativeDueDays: task.relativeDueDays || undefined,
      relativeDirection: task.relativeDirection || "after",
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
      status: job.status,
      dueDate: job.dueDate ? format(new Date(job.dueDate), "yyyy-MM-dd") : undefined,
      contractorId: job.contractorId || undefined,
      contactId: job.contactId || undefined,
    });
    setEditJobOpen(true);
  };

  const onSubmitEditTask = (data: any) => {
    if (!editingTask) return;
    
    const processedData = { ...data };
    
    // Handle date logic based on type
    if (dueDateType === 'relative') {
      processedData.dueDate = null; // Clear absolute date when using relative
    } else {
      processedData.dependsOnTaskId = null;
      processedData.relativeDueDays = null;
      processedData.relativeDirection = null;
    }
    
    updateTaskMutation.mutate({
      id: editingTask.id,
      data: processedData
    });
  };

  const addContactForProperty = (propertyId: number, type: 'solicitor' | 'estate_agent') => {
    setEditingContact(null);
    setContactType(type);
    setSelectedPropertyId(propertyId);
    contactForm.reset({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      specialization: "",
      role: type,
    });
    setEditContactOpen(true);
  };

  const addJobToTask = (taskId: number, propertyId: number) => {
    setSelectedTaskId(taskId);
    jobForm.setValue('taskId', taskId);
    jobForm.setValue('propertyId', propertyId);
    setNewJobOpen(true);
  };

  // Drag and drop handlers
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent, taskId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTaskId(taskId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the container, not a child
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverTaskId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: number) => {
    e.preventDefault();
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    
    setDragOverTaskId(null);
    setDraggedTaskId(null);
    
    if (draggedId && draggedId !== targetTaskId) {
      console.log(`Reorder task ${draggedId} to position of task ${targetTaskId}`);
      
      // For now, let's reorder locally to show it works
      // In a real app, you'd call an API endpoint to save the order
      const propertyId = tasks.find(t => t.id === draggedId)?.propertyId;
      if (!propertyId) return;
      
      const propertyTasks = tasksByProperty[propertyId] || [];
      const draggedTask = propertyTasks.find(t => t.id === draggedId);
      const targetIndex = propertyTasks.findIndex(t => t.id === targetTaskId);
      
      if (draggedTask && targetIndex !== -1) {
        // Update the tasks array locally (this would normally be done via API)
        const newTasks = [...tasks];
        const draggedIndex = newTasks.findIndex(t => t.id === draggedId);
        const newTargetIndex = newTasks.findIndex(t => t.id === targetTaskId);
        
        if (draggedIndex !== -1 && newTargetIndex !== -1) {
          // Remove dragged task and insert at new position
          const [removed] = newTasks.splice(draggedIndex, 1);
          newTasks.splice(newTargetIndex, 0, removed);
          
          // Update the query cache to reflect the change
          queryClient.setQueryData(["/api/tasks"], newTasks);
        }
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  // Function to sort tasks based on dependencies
  const sortTasksByDependencies = (propertyTasks: Task[]): Task[] => {
    const sorted: Task[] = [];
    const visited = new Set<number>();
    const processing = new Set<number>();

    const visit = (task: Task) => {
      if (processing.has(task.id)) {
        // Circular dependency detected, skip
        return;
      }
      if (visited.has(task.id)) {
        return;
      }

      processing.add(task.id);

      // If task has a dependency, handle it based on direction
      if (task.dependsOnTaskId && task.relativeDirection) {
        const dependencyTask = propertyTasks.find(t => t.id === task.dependsOnTaskId);
        if (dependencyTask) {
          visit(dependencyTask);
          
          if (task.relativeDirection === 'before') {
            // Insert before the dependency task
            const dependencyIndex = sorted.findIndex(t => t.id === task.dependsOnTaskId);
            if (dependencyIndex !== -1) {
              sorted.splice(dependencyIndex, 0, task);
            } else {
              sorted.push(task);
            }
          } else {
            // Insert after the dependency task
            const dependencyIndex = sorted.findIndex(t => t.id === task.dependsOnTaskId);
            if (dependencyIndex !== -1) {
              sorted.splice(dependencyIndex + 1, 0, task);
            } else {
              sorted.push(task);
            }
          }
        } else {
          sorted.push(task);
        }
      } else {
        // No dependency, add to end
        sorted.push(task);
      }

      processing.delete(task.id);
      visited.add(task.id);
    };

    // Process all tasks
    propertyTasks.forEach(visit);

    return sorted;
  };

  // Group and sort tasks by property
  const tasksByProperty = tasks.reduce((acc, task) => {
    if (!acc[task.propertyId]) {
      acc[task.propertyId] = [];
    }
    acc[task.propertyId].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  // Sort tasks within each property based on dependencies
  Object.keys(tasksByProperty).forEach(propertyId => {
    tasksByProperty[parseInt(propertyId)] = sortTasksByDependencies(tasksByProperty[parseInt(propertyId)]);
  });

  // Get available dependency tasks for the current property
  const getAvailableDependencyTasks = (propertyId: number, excludeTaskId?: number) => {
    return tasks.filter(task => 
      task.propertyId === propertyId && 
      task.id !== excludeTaskId
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Project Timeline</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage tasks and track progress across all properties</p>
        </div>
      </div>

      {/* Properties with Professional Contacts and Tasks */}
      {(properties as Property[]).map((property) => {
        const propertyTasks = tasksByProperty[property.id] || [];
        const propertySolicitor = contacts.find(contact => 
          contact.role === 'solicitor' && contact.propertyId === property.id
        );
        const propertyEstateAgent = contacts.find(contact => 
          contact.role === 'estate_agent' && contact.propertyId === property.id
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
            <div className="grid md:grid-cols-2 gap-4 p-6 bg-gray-50 border-b">
              {/* Solicitor for this Property */}
              <Card className="border border-blue-200">
                <CardHeader className="bg-blue-50 py-3">
                  <CardTitle className="flex items-center justify-between text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Solicitor
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6"
                      onClick={() => {
                        if (propertySolicitor) {
                          editContact(propertySolicitor, 'solicitor');
                        } else {
                          addContactForProperty(property.id, 'solicitor');
                        }
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {propertySolicitor ? 'Edit' : 'Add'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {propertySolicitor ? (
                      <div className="p-2 bg-white rounded border text-sm">
                        <div className="font-medium">{propertySolicitor.name}</div>
                        {propertySolicitor.company && (
                          <div className="text-xs text-gray-600">{propertySolicitor.company}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {propertySolicitor.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Phone className="h-3 w-3" />
                              {propertySolicitor.phone}
                            </div>
                          )}
                          {propertySolicitor.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="h-3 w-3" />
                              {propertySolicitor.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">No solicitor assigned</p>
                    )}
                    
                    {/* Legal Tasks under Solicitor */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-medium text-gray-700">Legal Tasks:</h5>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 text-xs p-1"
                          onClick={() => {
                            taskForm.setValue('propertyId', property.id);
                            taskForm.setValue('category', 'legal');
                            setNewTaskOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {propertyTasks.filter(task => task.category === 'legal').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs border-l-2 border-blue-300">
                          <span>{task.title}</span>
                          <div className="flex items-center gap-1">
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
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

              {/* Estate Agent for this Property */}
              <Card className="border border-green-200">
                <CardHeader className="bg-green-50 py-3">
                  <CardTitle className="flex items-center justify-between text-sm text-green-800">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Estate Agent
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-6"
                      onClick={() => {
                        if (propertyEstateAgent) {
                          editContact(propertyEstateAgent, 'estate_agent');
                        } else {
                          addContactForProperty(property.id, 'estate_agent');
                        }
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {propertyEstateAgent ? 'Edit' : 'Add'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {propertyEstateAgent ? (
                      <div className="p-2 bg-white rounded border text-sm">
                        <div className="font-medium">{propertyEstateAgent.name}</div>
                        {propertyEstateAgent.company && (
                          <div className="text-xs text-gray-600">{propertyEstateAgent.company}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {propertyEstateAgent.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Phone className="h-3 w-3" />
                              {propertyEstateAgent.phone}
                            </div>
                          )}
                          {propertyEstateAgent.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="h-3 w-3" />
                              {propertyEstateAgent.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">No estate agent assigned</p>
                    )}
                    
                    {/* Estate Agent Tasks */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-medium text-gray-700">Estate Agent Tasks:</h5>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 text-xs p-1"
                          onClick={() => {
                            taskForm.setValue('propertyId', property.id);
                            taskForm.setValue('category', 'estate_agent');
                            setNewTaskOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {propertyTasks.filter(task => task.category === 'estate_agent').map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-green-50 rounded text-xs border-l-2 border-green-300">
                          <span>{task.title}</span>
                          <div className="flex items-center gap-1">
                            <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
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
                    <div 
                      key={task.id} 
                      className={cn(
                        "relative transition-all duration-200",
                        draggedTaskId === task.id ? "opacity-50 scale-95" : "",
                        dragOverTaskId === task.id ? "border-l-4 border-blue-500 bg-blue-50" : ""
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverTaskId(task.id);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, task.id)}
                      onDragEnd={handleDragEnd}
                    >
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
                        <div className={cn(
                          "ml-8 sm:ml-16 p-4 sm:p-6 border-b border-gray-100",
                          isTaskFullyCompleted(task) ? "bg-green-50 border-green-200" : ""
                        )}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                            <CollapsibleTrigger className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 text-left">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-500" />
                                )}
                                <h3 className="text-base sm:text-lg font-semibold">{task.title}</h3>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={getCategoryColor(task.category)}>
                                  {task.category.replace('_', ' ')}
                                </Badge>
                                <Badge className={getStatusColor(task.status)}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                {getRelativeDateDescription(task) && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {getRelativeDateDescription(task)}
                                  </Badge>
                                )}
                                {task.dueDate && (
                                  <div className={cn(
                                    "flex items-center gap-1 text-xs sm:text-sm px-2 py-1 rounded",
                                    daysUntilDue && daysUntilDue < 0 ? 'bg-red-100 text-red-800' :
                                    daysUntilDue && daysUntilDue <= 7 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-600'
                                  )}>
                                    <Calendar className="h-3 w-3" />
                                    <span className="hidden sm:inline">
                                      {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                                       daysUntilDue === 0 ? 'Due today' :
                                       daysUntilDue === 1 ? 'Due tomorrow' :
                                       `${daysUntilDue} days left`}
                                    </span>
                                    <span className="sm:hidden">
                                      {daysUntilDue && daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` :
                                       daysUntilDue === 0 ? 'Today' :
                                       daysUntilDue === 1 ? 'Tomorrow' :
                                       `${daysUntilDue}d left`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CollapsibleTrigger>
                            
                            <div className="flex items-center gap-4 self-start sm:self-center">
                              <div className="text-left sm:text-right">
                                <div className="text-sm font-medium">{progress}% Complete</div>
                                <div className="text-xs text-gray-500">
                                  {taskJobs.filter(j => j.status === 'completed').length}/{taskJobs.length} jobs
                                </div>
                                {taskQuotes.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {taskQuotes.filter(q => q.status === 'accepted').length > 0 ? (
                                      <span className="text-green-600">
                                        {taskQuotes.filter(q => q.status === 'accepted').length} accepted
                                      </span>
                                    ) : taskQuotes.filter(q => q.status === 'pending').length > 0 ? (
                                      <span className="text-yellow-600">
                                        {taskQuotes.filter(q => q.status === 'pending').length} pending
                                      </span>
                                    ) : (
                                      <span className="text-red-600">
                                        {taskQuotes.filter(q => q.status === 'rejected').length} rejected
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="w-20 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="cursor-grab active:cursor-grabbing hover:bg-gray-100 p-1 sm:p-2"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 sm:p-2"
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
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
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

                          <CollapsibleContent>
                            <div className="mt-6 space-y-4">
                              {task.description && (
                                <p className="text-gray-600">{task.description}</p>
                              )}
                              
                              <div className="flex gap-4 mb-4">
                                {taskQuotes.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <PoundSterling className="h-4 w-4" />
                                    {taskQuotes.length} quote{taskQuotes.length !== 1 ? 's' : ''} available
                                  </div>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addJobToTask(task.id, property.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Job
                                </Button>
                              </div>

                              {/* Quote List */}
                              {taskQuotes.length > 0 && (
                                <div className="space-y-2 mb-4">
                                  <h5 className="text-sm font-medium text-gray-700">Quotes Received</h5>
                                  {taskQuotes.map((quote) => {
                                    const contractor = contractors.find(c => c.id === quote.contractorId);
                                    return (
                                      <div key={quote.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border-l-4 border-blue-300">
                                        <div className="flex items-center gap-3">
                                          <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            quote.status === 'accepted' ? 'bg-green-500' :
                                            quote.status === 'rejected' ? 'bg-red-500' :
                                            'bg-yellow-500'
                                          )}></div>
                                          <div>
                                            <span className="text-sm font-medium">{contractor?.name || 'Unknown Contractor'}</span>
                                            <span className="text-xs text-gray-500 ml-2">{formatCurrency(quote.amount)}</span>
                                          </div>
                                        </div>
                                        <Badge className={cn(
                                          "text-xs",
                                          quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                          quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        )}>
                                          {quote.status}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Job List */}
                              <div className="space-y-2">
                                {taskJobs.map((job) => (
                                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        job.status === 'completed' ? 'bg-green-500' :
                                        job.status === 'in_progress' ? 'bg-blue-500' :
                                        'bg-gray-300'
                                      )}></div>
                                      <div>
                                        <h4 className="font-medium">{job.name}</h4>
                                        {job.description && <p className="text-sm text-gray-600">{job.description}</p>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={getStatusColor(job.status)}>
                                        {job.status.replace('_', ' ')}
                                      </Badge>
                                      {job.dueDate && (
                                        <span className="text-xs text-gray-500">
                                          Due {format(new Date(job.dueDate), 'MMM d')}
                                        </span>
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
                                ))}
                                
                                {taskJobs.length === 0 && (
                                  <p className="text-gray-500 text-center py-4">No jobs added yet</p>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    </div>
                  );
                })}
                
                {propertyTasks.filter(task => !['legal', 'estate_agent'].includes(task.category)).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No tasks in this category yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Task Creation Dialog */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="surveying">Surveying</SelectItem>
                          <SelectItem value="estate_agent">Estate Agent</SelectItem>
                          <SelectItem value="renovation">Renovation</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={taskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-sm font-medium">Due Date Type:</Label>
                  <RadioGroup 
                    value={dueDateType} 
                    onValueChange={(value: 'absolute' | 'relative') => setDueDateType(value)}
                    className="flex flex-row space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="absolute" id="absolute" />
                      <Label htmlFor="absolute" className="text-sm">Specific Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="relative" id="relative" />
                      <Label htmlFor="relative" className="text-sm">Relative to Another Task</Label>
                    </div>
                  </RadioGroup>
                </div>

                {dueDateType === 'absolute' ? (
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
                                variant="outline"
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
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={taskForm.control}
                      name="dependsOnTaskId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Depends on Task</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select dependency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAvailableDependencyTasks(taskForm.watch('propertyId')).map((task) => (
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

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={taskForm.control}
                        name="relativeDueDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days (Optional)</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="Leave empty for immediate" 
                                  {...field} 
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                                <Clock className="h-4 w-4 text-gray-400" />
                              </div>
                            </FormControl>
                            <p className="text-sm text-gray-600">
                              Leave empty for immediate dependency
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={taskForm.control}
                        name="relativeDirection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timing</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "after"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timing" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="before">Before</SelectItem>
                                <SelectItem value="after">After</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end">
                        <p className="text-sm text-gray-600 pb-2">
                          {taskForm.watch('relativeDirection') === 'before' ? 'task starts' : 'task completes'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

      {/* Edit Task Dialog */}
      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <Form {...editTaskForm}>
            <form onSubmit={editTaskForm.handleSubmit(onSubmitEditTask)} className="space-y-4">
              <FormField
                control={editTaskForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editTaskForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="surveying">Surveying</SelectItem>
                          <SelectItem value="estate_agent">Estate Agent</SelectItem>
                          <SelectItem value="renovation">Renovation</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editTaskForm.control}
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
                          <SelectItem value="not_started">Not Started</SelectItem>
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
                control={editTaskForm.control}
                name="quotable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
                control={editTaskForm.control}
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

              {/* Due Date Type Selection */}
              <div className="space-y-3">
                <Label>Due Date Type</Label>
                <RadioGroup
                  value={dueDateType}
                  onValueChange={(value) => setDueDateType(value as 'absolute' | 'relative')}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="absolute" id="absolute-edit" />
                    <Label htmlFor="absolute-edit">Specific Date</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relative" id="relative-edit" />
                    <Label htmlFor="relative-edit">Relative to Another Task</Label>
                  </div>
                </RadioGroup>
              </div>

              {dueDateType === 'absolute' ? (
                <FormField
                  control={editTaskForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  <FormField
                    control={editTaskForm.control}
                    name="dependsOnTaskId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Depends on Task</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dependency task" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {editingTask && getAvailableDependencyTasks(editingTask.propertyId, editingTask.id).map((task) => (
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editTaskForm.control}
                      name="relativeDueDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Leave empty for immediate"
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-sm text-gray-600">
                            Leave empty for immediate dependency
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editTaskForm.control}
                      name="relativeDirection"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Direction</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "after"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="before">Before</SelectItem>
                              <SelectItem value="after">After</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={updateTaskMutation.isPending}>
                  Update Task
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditTaskOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Job Creation Dialog */}
      <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Job to Task</DialogTitle>
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
                      <Input placeholder="Enter job name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={jobForm.control}
                name="contractorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Contractor (optional)</FormLabel>
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
                control={jobForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Job description..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            variant="outline"
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
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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

      {/* Contact Edit/Create Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Edit' : 'Add'} {contactType === 'solicitor' ? 'Solicitor' : 'Estate Agent'}
            </DialogTitle>
          </DialogHeader>
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onSubmitContact, (errors) => {
              console.log('Form validation errors:', errors);
            })} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter address..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hidden role field */}
              <input type="hidden" {...contactForm.register("role")} value={contactType} />

              <Button 
                type="submit" 
                disabled={updateContactMutation.isPending || createContactMutation.isPending}
                onClick={() => console.log('Submit button clicked!')}
              >
                {editingContact ? 'Update' : 'Add'} {contactType === 'solicitor' ? 'Solicitor' : 'Estate Agent'}
              </Button>
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
                const jobData = {
                  ...data,
                  type: "general", // Set default type since it's required by schema
                };
                updateJobMutation.mutate({ id: editingJob.id, ...jobData });
                setEditJobOpen(false);
                setEditingJob(null);
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
                
              </div>

              <FormField
                control={jobForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Job description..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={jobForm.control}
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
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={jobForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>



              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditJobOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateJobMutation.isPending}>
                  Update Job
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}