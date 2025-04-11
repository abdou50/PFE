// app/guichetier/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
}

interface Meeting {
  _id: string;
  userId: string;
  userFirstName?: string;
  userLastName?: string;
  department: string;
  date: Date;
  status: string;
  assignedTo?: string;
}

export default function GuichetierDashboard() {
  const [department, setDepartment] = useState<string>('Madaniya');
  const [employees, setEmployees] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch employees by department
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('/api/users/employees', {
        params: { department }
      });
      setEmployees(data.data);
      if (data.data.length > 0) {
        setSelectedEmployee(data.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch meetings by department
  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get('/api/meetings', {
        params: { department }
      });
      setMeetings(data);
    } catch (error) {
      toast.error('Failed to fetch meetings');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch calendar events for selected employee
  const fetchCalendarEvents = async () => {
    if (!selectedEmployee) return;
    
    try {
      const { data } = await axios.get(`/api/meetings/${selectedEmployee}`);
      
      const events = data.map((meeting: Meeting) => ({
        id: meeting._id,
        title: `${meeting.userFirstName} ${meeting.userLastName}`,
        start: meeting.date,
        allDay: true,
        backgroundColor: 
          meeting.status === 'Demandé' ? '#3b82f6' :
          meeting.status === 'Planifié' ? '#10b981' :
          meeting.status === 'Terminé' ? '#6b7280' : '#ef4444'
      }));
      
      setCalendarEvents(events);
    } catch (error) {
      toast.error('Failed to fetch calendar events');
    }
  };

  // Handle department change
  useEffect(() => {
    fetchEmployees();
    fetchMeetings();
  }, [department]);

  // Handle employee selection change
  useEffect(() => {
    fetchCalendarEvents();
  }, [selectedEmployee]);

  // Handle drag and drop
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedEmployee) return;

    const meetingId = result.draggableId;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    try {
      const toastId = toast.loading('Assigning meeting...');
      
      await axios.patch(`/api/meetings/${meetingId}/assign`, {
        employeeId: selectedEmployee
      });

      // Optimistic UI update
      setMeetings(prev => {
        const updated = [...prev];
        const [movedMeeting] = updated.splice(sourceIndex, 1);
        movedMeeting.userId = selectedEmployee;
        movedMeeting.status = 'Planifié';
        updated.splice(destinationIndex, 0, movedMeeting);
        return updated;
      });

      await fetchCalendarEvents();
      toast.success('Meeting assigned successfully', { id: toastId });
    } catch (error) {
      toast.error('Failed to assign meeting');
    }
  };

  const statusBadge = (status: string) => {
    const variant = 
      status === 'Demandé' ? 'secondary' :
      status === 'Planifié' ? 'default' :
      status === 'Terminé' ? 'outline' : 'destructive';
    
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Guichetier Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Department Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={department} 
            onValueChange={setDepartment}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Madaniya">Madaniya</SelectItem>
              <SelectItem value="Insaf">Insaf</SelectItem>
              <SelectItem value="Rached">Rached</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meetings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Requested Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="meetings">
                    {(provided) => (
                      <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {meetings.map((meeting, index) => (
                          <Draggable key={meeting._id} draggableId={meeting._id} index={index}>
                            {(provided) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TableCell>
                                  {meeting.userFirstName} {meeting.userLastName}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(meeting.date), 'PPpp')}
                                </TableCell>
                                <TableCell>
                                  {statusBadge(meeting.status)}
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    )}
                  </Droppable>
                </Table>
              </DragDropContext>
            )}
          </CardContent>
        </Card>

        {/* Employee Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select 
                value={selectedEmployee || ''} 
                onValueChange={setSelectedEmployee}
                disabled={employees.length === 0 || isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee ? (
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek,dayGridDay'
                }}
                height={500}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Select an employee to view calendar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}