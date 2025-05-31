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
import { insertTaskSchema, insertJobSchema, insertContactSchema, insertEventSchema, insertNoteSchema, type Task, type Job, type Property, type Contact, type Contractor, type Quote, type Event, type Note } from "@shared/schema";
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
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [contactType, setContactType] = useState<'solicitor' | 'estate_agent'>('solicitor');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dueDateType, setDueDateType] = useState<'absolute' | 'relative'>('absolute');
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTaskId, setNoteTaskId] = useState<number | null>(null);

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

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
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
      setEditEventOpen(false);
      setEditingEvent(null);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
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

  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/jobs/${id}`),
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

  const createNoteMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/notes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setNewNoteOpen(false);
      noteForm.reset();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/notes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setEditNoteOpen(false);
      setEditingNote(null);
      noteForm.reset();
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
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

  const noteForm = useForm({
    resolver: zodResolver(insertNoteSchema),
    defaultValues: {
      propertyId: 1,
      taskId: undefined,
      content: "",
      contractorId: undefined,
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

  const getTaskNotes = (taskId: number) => {
    return notes.filter(note => note.taskId === taskId);
  };

  // Create a unified timeline for a task combining jobs, events, and notes
  const getTaskTimeline = (taskId: number) => {
    const taskJobs = getTaskJobs(taskId);
    const taskEvents = events.filter(event => event.taskId === taskId);
    const taskNotes = getTaskNotes(taskId);

    const timelineItems = [
      ...taskJobs.map(job => {
        const dateToUse = job.dueDate || job.createdAt;
        return {
          type: 'job' as const,
          data: job,
          date: dateToUse ? new Date(dateToUse) : new Date(),
          sortKey: dateToUse ? new Date(dateToUse).getTime() : new Date().getTime()
        };
      }),
      ...taskEvents.map(event => ({
        type: 'event' as const,
        data: event,
        date: new Date(event.scheduledAt),
        sortKey: new Date(event.scheduledAt).getTime()
      })),
      ...taskNotes.map(note => {
        const createdAt = note.createdAt || new Date();
        return {
          type: 'note' as const,
          data: note,
          date: new Date(createdAt),
          sortKey: new Date(createdAt).getTime()
        };
      })
    ];

    // Sort by date (earliest first)
    return timelineItems.sort((a, b) => a.sortKey - b.sortKey);
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

  const startEditJob = (job: Job) => {
    setEditingJob(job);
    jobForm.reset({
      taskId: job.taskId,
      propertyId: job.propertyId,
      name: job.name,
      description: job.description || "",
      status: job.status,
      dueDate: job.dueDate ? format(new Date(job.dueDate), "yyyy-MM-dd") : "",
      contractorId: job.contractorId || undefined,
      contactId: job.contactId || undefined,
    });
    setEditJobOpen(true);
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
                              
                              {taskQuotes.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                  <PoundSterling className="h-4 w-4" />
                                  {taskQuotes.length} quote{taskQuotes.length !== 1 ? 's' : ''} available
                                </div>
                              )}

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

                              {/* Unified Timeline */}
                              {(() => {
                                const timeline = getTaskTimeline(task.id);
                                
                                return (
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-sm font-medium text-gray-700">Timeline</h5>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => addJobToTask(task.id, property.id)}
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Job
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedTaskId(task.id);
                                            setSelectedPropertyId(property.id);
                                            setNewEventOpen(true);
                                          }}
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Calendar className="h-3 w-3 mr-1" />
                                          Schedule Event
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setNoteTaskId(task.id);
                                            noteForm.setValue('taskId', task.id);
                                            noteForm.setValue('propertyId', property.id);
                                            setNewNoteOpen(true);
                                          }}
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Note
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {timeline.length > 0 ? (
                                      timeline.map((item, index) => {
                                        if (item.type === 'job') {
                                          const job = item.data;
                                          const assignedContractor = job.contractorId ? contractors.find(c => c.id === job.contractorId) : null;
                                          
                                          return (
                                            <div key={`job-${job.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-l-4 border-l-gray-400">
                                              <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center">
                                                  <div className={cn(
                                                    "w-3 h-3 rounded-full",
                                                    job.status === 'completed' ? 'bg-green-500' :
                                                    job.status === 'in_progress' ? 'bg-blue-500' :
                                                    'bg-gray-300'
                                                  )}></div>
                                                  <div className="text-xs text-gray-400 mt-1">JOB</div>
                                                </div>
                                                <div>
                                                  <h4 className="font-medium">{job.name}</h4>
                                                  {job.description && <p className="text-sm text-gray-600">{job.description}</p>}
                                                  <div className="text-xs text-gray-500 mt-1">
                                                    {job.dueDate ? 
                                                      `Due: ${format(new Date(job.dueDate), "MMM d, yyyy")}` :
                                                      `Created: ${format(new Date(job.createdAt), "MMM d, yyyy")}`
                                                    }
                                                  </div>
                                                  {assignedContractor && (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                      Assigned to: {assignedContractor.name} - {assignedContractor.specialty}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge className={getStatusColor(job.status)}>
                                                  {job.status.replace('_', ' ')}
                                                </Badge>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => startEditJob(job)}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    if (confirm(`Are you sure you want to delete the job "${job.name}"?`)) {
                                                      deleteJobMutation.mutate(job.id);
                                                    }
                                                  }}
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    const newStatus = job.status === 'completed' ? 'pending' : 
                                                                   job.status === 'pending' ? 'in_progress' : 'completed';
                                                    updateJobMutation.mutate({ id: job.id, status: newStatus });
                                                  }}
                                                  className={cn(
                                                    "h-6 px-2 text-xs",
                                                    job.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                  )}
                                                >
                                                  {job.status === 'completed' ? 'Reopen' : 
                                                   job.status === 'pending' ? 'Start' : 'Complete'}
                                                </Button>
                                              </div>
                                            </div>
                                          );
                                        } else if (item.type === 'event') {
                                          const event = item.data;
                                          const contact = contacts.find(c => c.id === event.contactId);
                                          const contractor = contractors.find(c => c.id === event.contractorId);
                                          const assignedTo = contact || contractor;
                                          const assigneeType = contact ? 'Contact' : contractor ? 'Contractor' : null;
                                          
                                          return (
                                            <div key={`event-${event.id}`} className="flex items-center justify-between p-3 bg-purple-50 rounded border-l-4 border-purple-300">
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className="flex flex-col items-center">
                                                  <div className={cn(
                                                    "w-3 h-3 rounded-full",
                                                    event.status === 'completed' ? 'bg-green-500' :
                                                    event.status === 'cancelled' ? 'bg-red-500' :
                                                    'bg-blue-500'
                                                  )}></div>
                                                  <div className="text-xs text-gray-400 mt-1">EVENT</div>
                                                </div>
                                                <div className="flex-1">
                                                  <span className="text-sm font-medium">{event.title}</span>
                                                  <div className="text-xs text-gray-500">
                                                    {format(new Date(event.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                                                    {assignedTo && (
                                                      <span className="ml-2">
                                                        with {assignedTo.name} ({assigneeType})
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge className={cn(
                                                  "text-xs",
                                                  event.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                  event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                  'bg-blue-100 text-blue-800'
                                                )}>
                                                  {event.type}
                                                </Badge>
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      setEditingEvent(event);
                                                      setSelectedTaskId(task.id);
                                                      setSelectedPropertyId(property.id);
                                                      setEditEventOpen(true);
                                                    }}
                                                    className="h-6 w-6 p-0"
                                                  >
                                                    <Edit2 className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      if (confirm(`Are you sure you want to delete the event "${event.title}"?`)) {
                                                        deleteEventMutation.mutate(event.id);
                                                      }
                                                    }}
                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        } else if (item.type === 'note') {
                                          const note = item.data;
                                          const assignedContractor = note.contractorId ? contractors.find(c => c.id === note.contractorId) : null;
                                          
                                          return (
                                            <div key={`note-${note.id}`} className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-300">
                                              <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                  <div className="flex flex-col items-center">
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                    <div className="text-xs text-gray-400 mt-1">NOTE</div>
                                                  </div>
                                                  <div className="flex-1">
                                                    <p className="text-sm text-gray-800">{note.content}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                      <span>
                                                        {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                                      </span>
                                                      {assignedContractor && (
                                                        <span className="text-blue-600">
                                                          • {assignedContractor.name}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      setEditingNote(note);
                                                      noteForm.setValue('content', note.content);
                                                      noteForm.setValue('contractorId', note.contractorId || undefined);
                                                      setEditNoteOpen(true);
                                                    }}
                                                    className="h-6 w-6 p-0"
                                                  >
                                                    <Edit2 className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      if (confirm('Are you sure you want to delete this note?')) {
                                                        deleteNoteMutation.mutate(note.id);
                                                      }
                                                    }}
                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })
                                    ) : (
                                      <p className="text-xs text-gray-400 italic">No timeline items yet</p>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Notes List */}
                              {(() => {
                                const taskNotes = getTaskNotes(task.id);
                                return (
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-sm font-medium text-gray-700">Notes</h5>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setNoteTaskId(task.id);
                                          noteForm.setValue('taskId', task.id);
                                          noteForm.setValue('propertyId', property.id);
                                          setNewNoteOpen(true);
                                        }}
                                        className="h-6 px-2 text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Note
                                      </Button>
                                    </div>
                                    {taskNotes.length > 0 ? (
                                      taskNotes.map((note) => {
                                        const assignedContractor = note.contractorId ? contractors.find(c => c.id === note.contractorId) : null;
                                        return (
                                          <div key={note.id} className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-300">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm text-gray-800">{note.content}</p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                  <span>
                                                    {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                                  </span>
                                                  {assignedContractor && (
                                                    <span className="text-blue-600">
                                                      • {assignedContractor.name}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1 ml-2">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setEditingNote(note);
                                                    noteForm.setValue('content', note.content);
                                                    noteForm.setValue('contractorId', note.contractorId || undefined);
                                                    setEditNoteOpen(true);
                                                  }}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    if (confirm('Are you sure you want to delete this note?')) {
                                                      deleteNoteMutation.mutate(note.id);
                                                    }
                                                  }}
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-xs text-gray-400 italic">No timeline items yet</p>
                                    )}
                                  </div>
                                );
                              })()}
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
                  type: "general",
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
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={jobForm.control}
                  name="contractorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Contractor</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contractor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No assignment</SelectItem>
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

      {/* Event Scheduling Dialog */}
      <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Event Title</label>
              <Input
                name="title"
                placeholder="e.g., Property Survey"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Event Type</label>
              <select name="type" defaultValue="survey" className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="survey">Survey</option>
                <option value="viewing">Viewing</option>
                <option value="meeting">Meeting</option>
                <option value="appointment">Appointment</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date & Time</label>
                <Input
                  type="datetime-local"
                  name="scheduledAt"
                  defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  name="duration"
                  placeholder="60"
                  defaultValue="60"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                placeholder="Property address or meeting location"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Assign to (optional)</label>
              <select name="assigneeId" defaultValue="none" className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="none">No assignment</option>
                <optgroup label="Contacts">
                  {contacts.map((contact) => (
                    <option key={`contact-${contact.id}`} value={`contact-${contact.id}`}>
                      {contact.name} ({contact.role})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Contractors">
                  {contractors.map((contractor) => (
                    <option key={`contractor-${contractor.id}`} value={`contractor-${contractor.id}`}>
                      {contractor.name} - {contractor.specialty}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                name="notes"
                placeholder="Additional notes..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNewEventOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={(e) => {
                  const container = e.currentTarget.closest('.space-y-4') as HTMLElement;
                  if (container) {
                    const titleInput = container.querySelector('[name="title"]') as HTMLInputElement;
                    const typeSelect = container.querySelector('[name="type"]') as HTMLSelectElement;
                    const scheduledAtInput = container.querySelector('[name="scheduledAt"]') as HTMLInputElement;
                    const durationInput = container.querySelector('[name="duration"]') as HTMLInputElement;
                    const locationInput = container.querySelector('[name="location"]') as HTMLInputElement;
                    const assigneeSelect = container.querySelector('[name="assigneeId"]') as HTMLSelectElement;
                    const notesTextarea = container.querySelector('[name="notes"]') as HTMLTextAreaElement;
                    
                    if (titleInput && typeSelect && scheduledAtInput) {
                      const scheduledAt = new Date(scheduledAtInput.value);
                      const duration = parseInt(durationInput?.value || '60') || 60;
                      const assigneeValue = assigneeSelect?.value;
                      
                      // Parse assignee value to determine if it's a contact or contractor
                      let contactId = undefined;
                      let contractorId = undefined;
                      
                      if (assigneeValue && assigneeValue !== 'none') {
                        if (assigneeValue.startsWith('contact-')) {
                          contactId = parseInt(assigneeValue.replace('contact-', ''));
                        } else if (assigneeValue.startsWith('contractor-')) {
                          contractorId = parseInt(assigneeValue.replace('contractor-', ''));
                        }
                      }
                      
                      createEventMutation.mutate({
                        title: titleInput.value,
                        description: '',
                        type: typeSelect.value,
                        scheduledAt: scheduledAt,
                        duration: duration,
                        location: locationInput?.value || '',
                        status: 'scheduled',
                        notes: notesTextarea?.value || '',
                        propertyId: selectedPropertyId!,
                        taskId: selectedTaskId!,
                        contactId: contactId,
                        contractorId: contractorId,
                      });
                    }
                  }
                }}
                disabled={createEventMutation.isPending}
              >
                Schedule Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Event Title</label>
              <Input
                name="editTitle"
                defaultValue={editingEvent?.title || ''}
                placeholder="e.g., Property Survey"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Event Type</label>
              <select name="editType" defaultValue={editingEvent?.type || 'survey'} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="survey">Survey</option>
                <option value="viewing">Viewing</option>
                <option value="meeting">Meeting</option>
                <option value="appointment">Appointment</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date & Time</label>
                <Input
                  type="datetime-local"
                  name="editScheduledAt"
                  defaultValue={editingEvent ? format(new Date(editingEvent.scheduledAt), "yyyy-MM-dd'T'HH:mm") : ''}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  name="editDuration"
                  defaultValue={editingEvent?.duration || 60}
                  placeholder="60"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                name="editLocation"
                defaultValue={editingEvent?.location || ''}
                placeholder="Property address or meeting location"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <select name="editStatus" defaultValue={editingEvent?.status || 'scheduled'} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Assign to (optional)</label>
              <select name="editAssigneeId" defaultValue={
                editingEvent?.contactId ? `contact-${editingEvent.contactId}` :
                editingEvent?.contractorId ? `contractor-${editingEvent.contractorId}` :
                'none'
              } className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="none">No assignment</option>
                <optgroup label="Contacts">
                  {contacts.map((contact) => (
                    <option key={`contact-${contact.id}`} value={`contact-${contact.id}`}>
                      {contact.name} ({contact.role})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Contractors">
                  {contractors.map((contractor) => (
                    <option key={`contractor-${contractor.id}`} value={`contractor-${contractor.id}`}>
                      {contractor.name} - {contractor.specialty}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                name="editNotes"
                defaultValue={editingEvent?.notes || ''}
                placeholder="Additional notes..."
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditEventOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={(e) => {
                  const container = e.currentTarget.closest('.space-y-4') as HTMLElement;
                  if (container && editingEvent) {
                    const titleInput = container.querySelector('[name="editTitle"]') as HTMLInputElement;
                    const typeSelect = container.querySelector('[name="editType"]') as HTMLSelectElement;
                    const scheduledAtInput = container.querySelector('[name="editScheduledAt"]') as HTMLInputElement;
                    const durationInput = container.querySelector('[name="editDuration"]') as HTMLInputElement;
                    const locationInput = container.querySelector('[name="editLocation"]') as HTMLInputElement;
                    const statusSelect = container.querySelector('[name="editStatus"]') as HTMLSelectElement;
                    const assigneeSelect = container.querySelector('[name="editAssigneeId"]') as HTMLSelectElement;
                    const notesTextarea = container.querySelector('[name="editNotes"]') as HTMLTextAreaElement;
                    
                    if (titleInput && typeSelect && scheduledAtInput) {
                      const scheduledAt = new Date(scheduledAtInput.value);
                      const duration = parseInt(durationInput?.value || '60') || 60;
                      const assigneeValue = assigneeSelect?.value;
                      
                      // Parse assignee value to determine if it's a contact or contractor
                      let contactId = undefined;
                      let contractorId = undefined;
                      
                      if (assigneeValue && assigneeValue !== 'none') {
                        if (assigneeValue.startsWith('contact-')) {
                          contactId = parseInt(assigneeValue.replace('contact-', ''));
                        } else if (assigneeValue.startsWith('contractor-')) {
                          contractorId = parseInt(assigneeValue.replace('contractor-', ''));
                        }
                      }
                      
                      updateEventMutation.mutate({
                        id: editingEvent.id,
                        title: titleInput.value,
                        description: editingEvent.description,
                        type: typeSelect.value,
                        scheduledAt: scheduledAt,
                        duration: duration,
                        location: locationInput?.value || '',
                        status: statusSelect.value,
                        notes: notesTextarea?.value || '',
                        propertyId: editingEvent.propertyId,
                        taskId: editingEvent.taskId,
                        contactId: contactId,
                        contractorId: contractorId,
                      });
                    }
                  }
                }}
                disabled={updateEventMutation.isPending}
              >
                Update Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Creation Dialog */}
      <Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          <Form {...noteForm}>
            <form onSubmit={noteForm.handleSubmit((data) => createNoteMutation.mutate(data))} className="space-y-4">
              <FormField
                control={noteForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your note..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={noteForm.control}
                name="contractorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Contractor (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contractor (optional)" />
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewNoteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createNoteMutation.isPending}>
                  Add Note
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Note Editing Dialog */}
      <Dialog open={editNoteOpen} onOpenChange={setEditNoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <Form {...noteForm}>
            <form onSubmit={noteForm.handleSubmit((data) => {
              if (editingNote) {
                updateNoteMutation.mutate({ id: editingNote.id, data });
              }
            })} className="space-y-4">
              <FormField
                control={noteForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your note..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={noteForm.control}
                name="contractorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Contractor (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contractor (optional)" />
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditNoteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateNoteMutation.isPending}>
                  Update Note
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}