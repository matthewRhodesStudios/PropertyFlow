import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ChevronRight, ChevronDown, User, Phone, Mail, Briefcase, MapPin, Edit2, PoundSterling, Trash2, GripVertical, Clock } from "lucide-react";
import { insertTaskSchema, insertJobSchema, insertContactSchema, insertEventSchema, insertNoteSchema, type Task, type Job, type Property, type Contact, type Contractor, type Quote, type Event, type Note } from "@shared/schema";
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



export default function Calendar() {




   const { data: events = [] } = useQuery<Event[]>({
     queryKey: ["/api/events"],
      
   });

     const { data: contractors = [] } = useQuery<Contractor[]>({
       queryKey: ["/api/contractors"],
     });

    const { data: contacts = [] } = useQuery<Contact[]>({
        queryKey: ["/api/contacts"],
    });

// To log the contact of each event, uncomment the following line:
useEffect(() => {
  if (events.length > 0) {
    events.forEach((event) => {
      console.log(event); // full event object
    });
  }
}, [events]);


return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4 p-4">
        {events.map((event) => (
            <Card key={event.id} className="shadow-md border border-gray-200 hover:shadow-lg transition">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                        <div className="flex flex-col items-center mr-2">
                            <div className="bg-blue-600 text-white rounded-t-md px-2 py-1 text-xs font-bold w-10 text-center">
                                {dayjs(event.scheduledAt).format("MMM")}
                            </div>
                            <div className="bg-white border border-blue-600 rounded-b-md px-2 py-1 text-lg font-bold w-10 text-center">
                                {dayjs(event.scheduledAt).format("D")}
                            </div>
                        </div>
                        <span>{event.title}</span>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2">
                    <div className="text-sm text-gray-700">
                        {event.description}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                        {(() => {
                            // Try to find contractor by event.contractorId
                            const contractor = contractors.find(c => c.id === event.contractorId);
                            if (contractor) {
                                return (
                                    <>
                                        <Briefcase className="w-4 h-4 mr-1" />
                                        with {contractor.name}
                                    </>
                                );
                            }

                            // If no contractor found, check if event has a contact
                            const contact = contacts.find(c => c.id === event.contactId);
                            if (contact) {
                                return (
                                    <>
                                        <User className="w-4 h-4 mr-1" />
                                        with {contact.name}
                                    </>
                                );
                            }

                            // Optionally, show nothing or fallback text if no contractor
                            return null;
                       })()}
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500 text-sm truncate max-w-xs">
                    <MapPin className="w-4 h-4 text-gray-400" />
                     {event.location}
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
);
    






}