"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { format, parseISO, isBefore, isAfter, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, UserIcon, Check, X, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import { EventClickArg } from "@fullcalendar/core";

interface Meeting {
  _id: string;
  userId: { firstName: string; lastName: string; email?: string; phone?: string };
  employeeId?: {
    _id: string; firstName: string; lastName: string; email?: string 
  } | null;
  date: string;
  department: string;
  status: "Demandé" | "Planifié" | "Terminé" | "Annulé" | "Rejeté";
  description?: string;
  meetingLink?: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TimeSlot {
  time: string; // ISO string
  formattedTime: string;
  isAvailable: boolean;
}

export default function ProfessionalMeetingScheduler() {
  const { theme } = useTheme();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [assignedEmployee, setAssignedEmployee] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newMeetingDate, setNewMeetingDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const calendarRef = useRef<any>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const dept = localStorage.getItem("department");
    setDepartment(dept);
    if (dept) {
      fetchData(dept);
    }
  }, []);

  useEffect(() => {
    // Apply filters whenever meetings or filter values change
    const filtered = meetings.filter(meeting => {
      const statusMatch = filterStatus === "all" || meeting.status === filterStatus;
      const employeeMatch = filterEmployee === "all" || meeting.employeeId?._id === filterEmployee;
      return statusMatch && employeeMatch;
    });
    setFilteredMeetings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [meetings, filterStatus, filterEmployee]);

  const fetchData = async (dept: string) => {
    setIsLoading(true);
    try {
      const [meetingsRes, employeesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/meetings/department`, {
          params: { department: dept }
        }),
        axios.get(`http://localhost:5000/api/meetings/employees`, {
          params: { department: dept }
        })
      ]);
      
      setMeetings(meetingsRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      toast.error("Erreur de chargement des données");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeAvailability = async (employeeId: string, date: Date) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/meetings/availability`, {
        params: { 
          employeeId,
          date: date.toISOString()
        }
      });
      setTimeSlots(res.data.timeSlots);
      setSelectedSlot(null);
    } catch (err) {
      toast.error("Erreur de chargement des disponibilités");
      console.error(err);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setAssignedEmployee(employeeId);
    const dateToUse = selectedDate || (selectedMeeting ? parseISO(selectedMeeting.date) : new Date());
    fetchEmployeeAvailability(employeeId, dateToUse);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    if (assignedEmployee) {
      fetchEmployeeAvailability(assignedEmployee, date);
    }
  };

  const handleStatusChange = async (status: "Planifié" | "Rejeté") => {
    if (!selectedMeeting) return;

    try {
      let meetingDate = selectedSlot ? new Date(selectedSlot) : 
                       selectedDate ? selectedDate : 
                       parseISO(selectedMeeting.date);

      // Validate the selected time slot
      if (status === "Planifié") {
        if (!assignedEmployee) {
          toast.error("Veuillez sélectionner un employé");
          return;
        }

        // Check if the selected slot is still available
        const slotStillAvailable = timeSlots.some(
          slot => slot.time === meetingDate.toISOString() && slot.isAvailable
        );

        if (!slotStillAvailable) {
          toast.error("Ce créneau n'est plus disponible. Veuillez en choisir un autre.");
          return;
        }

        await axios.put(`http://localhost:5000/api/meetings/${selectedMeeting._id}/status`, {
          status,
          employeeId: assignedEmployee,
          date: meetingDate.toISOString(),
          notes
        });
      } else {
        await axios.put(`http://localhost:5000/api/meetings/${selectedMeeting._id}/status`, {
          status,
          notes
        });
      }
      
      toast.success(`Rendez-vous ${status === "Planifié" ? "planifié" : "rejeté"}`);
      setIsAcceptDialogOpen(false);
      resetDialogState();
      fetchData(department!);
    } catch (err) {
      console.error("Error updating meeting status:", err);
      toast.error("Erreur lors de la mise à jour du rendez-vous");
    }
  };

  const handleReschedule = async () => {
    if (!selectedMeeting || !newMeetingDate) return;
  
    try {
      // Check if the new date is in the past
      if (newMeetingDate < new Date()) {
        toast.error("Vous ne pouvez pas planifier un rendez-vous dans le passé");
        return;
      }
  
      // Check if outside business hours
      const hours = newMeetingDate.getHours();
      if (hours < 8 || hours >= 17) {
        toast.error("Les rendez-vous doivent être entre 8h et 17h");
        return;
      }
  
      // Check for conflicts - Updated URL
      const conflictResponse = await axios.get(`http://localhost:5000/api/meetings/check-conflict`, {
        params: {
          employeeId: selectedMeeting.employeeId?._id,
          date: newMeetingDate.toISOString(),
          meetingId: selectedMeeting._id
        }
      });
  
      if (conflictResponse.data.hasConflict) {
        toast.error(`Conflit avec un autre rendez-vous à cette heure`);
        return;
      }
  
      // Reschedule meeting - Updated URL
      await axios.put(`http://localhost:5000/api/meetings/${selectedMeeting._id}/reschedule`, {
        date: newMeetingDate.toISOString()
      });
      
      toast.success("Rendez-vous replanifié avec succès");
      setIsRescheduleDialogOpen(false);
      fetchData(department!);
    } catch (err) {
      console.error("Error rescheduling meeting:", err);
      toast.error("Erreur lors du replanification du rendez-vous");
    }
  };

  const resetDialogState = () => {
    setAssignedEmployee("");
    setSelectedSlot(null);
    setSelectedDate(null);
    setNewMeetingDate(null);
    setNotes("");
    setTimeSlots([]);
  };

  // Add this function to handle calendar event clicks
  const handleEventClick = (clickInfo: EventClickArg) => {
    const meeting = meetings.find(m => m._id === clickInfo.event.id);
    if (meeting) {
      setSelectedMeeting(meeting);
      setIsDetailsOpen(true);
    }
  };

  // Add this helper function to get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case "Demandé":
        return theme === "dark" ? "#92400e" : "#f59e0b"; // Amber
      case "Planifié":
        return theme === "dark" ? "#065f46" : "#10b981"; // Green
      case "Terminé":
        return theme === "dark" ? "#374151" : "#64748b"; // Gray
      case "Annulé":
      case "Rejeté":
        return theme === "dark" ? "#991b1b" : "#ef4444"; // Red
      default:
        return theme === "dark" ? "#1e40af" : "#3b82f6"; // Blue
    }
  };

  // Add this helper function to safely format calendar events
  // Update the formatCalendarEvents function to display names in a simpler format
  const formatCalendarEvents = () => {
    return meetings.map(meeting => {
      // Make sure we have valid user and employee objects
      const userFirstName = meeting.userId?.firstName || "Unknown";
      const userLastName = meeting.userId?.lastName || "User";
      const employeeFirstName = meeting.employeeId?.firstName || "";
      const employeeLastName = meeting.employeeId?.lastName || "";
      
      // Create a simpler title format
      let title = `${userFirstName} ${userLastName}`;
      if (employeeFirstName && employeeLastName) {
        title += ` → ${employeeFirstName} ${employeeLastName}`;
      }
      
      return {
        id: meeting._id,
        title: title,
        start: meeting.date,
        end: addMinutes(new Date(meeting.date), 30).toISOString(),
        extendedProps: {
          status: meeting.status,
          employeeId: meeting.employeeId?._id || null,
          meetingLink: meeting.meetingLink || ""
        },
        backgroundColor: getStatusColor(meeting.status),
        borderColor: getStatusColor(meeting.status),
        textColor: "#ffffff"
      };
    });
  };

  // Use this function to get calendar events
  const calendarEvents = formatCalendarEvents();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Demandé":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" /> {status}
          </Badge>
        );
      case "Planifié":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Check className="h-3 w-3 mr-1" /> {status}
          </Badge>
        );
      case "Terminé":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </Badge>
        );
      case "Rejeté":
      case "Annulé":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <X className="h-3 w-3 mr-1" /> {status}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Chargement en cours...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Toaster position="top-right" />
      {department ? (
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="mr-2 h-4 w-4" /> Calendrier
            </TabsTrigger>
            <TabsTrigger value="list">
              <UserIcon className="mr-2 h-4 w-4" /> Liste des Rendez-vous
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span>Calendrier des Rendez-vous</span>
                      <Select 
                        value={selectedEmployee} 
                        onValueChange={setSelectedEmployee}
                      >
                        <SelectTrigger className="w-[250px]">
                          <SelectValue placeholder="Tous les employés" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les employés</SelectItem>
                          {employees.map(employee => (
                            <SelectItem key={employee._id} value={employee._id}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={viewMode === "day" ? "default" : "outline"}
                        onClick={() => setViewMode("day")}
                      >
                        Jour
                      </Button>
                      <Button 
                        variant={viewMode === "week" ? "default" : "outline"}
                        onClick={() => setViewMode("week")}
                      >
                        Semaine
                      </Button>
                      <Button 
                        variant={viewMode === "month" ? "default" : "outline"}
                        onClick={() => setViewMode("month")}
                      >
                        Mois
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[700px]">
                                    <FullCalendar
                                      ref={calendarRef}
                                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                      initialView={viewMode === "day" ? "timeGridDay" : viewMode === "week" ? "timeGridWeek" : "dayGridMonth"}
                                      headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: ""
                                      }}
                                      events={selectedEmployee === "all" ? 
                                        calendarEvents : 
                                        calendarEvents.filter(event => 
                                          event.extendedProps.employeeId === selectedEmployee
                                        )
                                      }
                                      eventClick={handleEventClick}
                                      selectable={false}
                                      slotDuration="00:30:00"
                                      slotMinTime="08:00:00"
                                      slotMaxTime="19:00:00"
                                      allDaySlot={false}
                                      nowIndicator={true}
                                      locale={fr}
                                      height="100%"
                                      eventTimeFormat={{
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      }}
                                      dayHeaderFormat={{ weekday: 'long' }}
                                      titleFormat={{ year: 'numeric', month: 'long', day: 'numeric' }}
                                      eventClassNames="rounded-lg border-none shadow-sm cursor-pointer"
                                      dayHeaderClassNames="font-medium text-gray-700 dark:text-gray-300"
                                      dayCellClassNames="hover:bg-gray-50 dark:hover:bg-gray-800"
                                      slotLabelClassNames="text-sm font-medium text-gray-500 dark:text-gray-400"
                                      eventContent={(arg) => (
                                        <div className="p-1">
                                          <div className="font-medium truncate">{arg.event.title}</div>
                                          {viewMode !== "month" && (
                                            <div className="text-xs">
                                              {arg.timeText}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="list">
                            <Card>
                              <CardHeader>
                                <CardTitle>Liste des Rendez-vous</CardTitle>
                                <div className="flex flex-col md:flex-row gap-4 mt-4">
                                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                      <SelectValue placeholder="Filtrer par statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Tous les statuts</SelectItem>
                                      <SelectItem value="Demandé">Demandé</SelectItem>
                                      <SelectItem value="Planifié">Planifié</SelectItem>
                                      <SelectItem value="Terminé">Terminé</SelectItem>
                                      <SelectItem value="Annulé">Annulé</SelectItem>
                                      <SelectItem value="Rejeté">Rejeté</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                      <SelectValue placeholder="Filtrer par employé" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Tous les employés</SelectItem>
                                      {employees.map(employee => (
                                        <SelectItem key={employee._id} value={employee._id}>
                                          {employee.firstName} {employee.lastName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Client</TableHead>
                                      <TableHead>Employé</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Statut</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredMeetings.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                          Aucun rendez-vous trouvé
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      filteredMeetings
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map(meeting => (
                                          <TableRow key={meeting._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <TableCell>
                                              {meeting.userId ? (
                                                <>
                                                  <div className="font-medium">{meeting.userId.firstName} {meeting.userId.lastName}</div>
                                                  {meeting.userId.email && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{meeting.userId.email}</div>
                                                  )}
                                                </>
                                              ) : (
                                                <div className="font-medium">Client inconnu</div>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              {meeting.employeeId ? (
                                                <>
                                                  <div className="font-medium">{meeting.employeeId.firstName} {meeting.employeeId.lastName}</div>
                                                  <div className="text-sm text-gray-500 dark:text-gray-400">{meeting.employeeId.email}</div>
                                                </>
                                              ) : "Non attribué"}
                                            </TableCell>
                                            <TableCell>
                                              {format(parseISO(meeting.date), "PPPp", { locale: fr })}
                                            </TableCell>
                                            <TableCell>
                                              {getStatusBadge(meeting.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {meeting.status === "Demandé" && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    setSelectedMeeting(meeting);
                                                    setIsAcceptDialogOpen(true);
                                                    resetDialogState();
                                                  }}
                                                >
                                                  <Check className="h-4 w-4 mr-1" /> Traiter
                                                </Button>
                                              )}
                                              {meeting.status === "Planifié" && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    setSelectedMeeting(meeting);
                                                    setNewMeetingDate(parseISO(meeting.date));
                                                    setIsRescheduleDialogOpen(true);
                                                  }}
                                                >
                                                  Replanifier
                                                </Button>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setSelectedMeeting(meeting);
                                                  setIsDetailsOpen(true);
                                                }}
                                              >
                                                Détails
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                    )}
                                  </TableBody>
                                </Table>
                                
                                {filteredMeetings.length > itemsPerPage && (
                                  <Pagination className="mt-4">
                                    <PaginationContent>
                                      <PaginationItem>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                          disabled={currentPage === 1}
                                        >
                                          <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                      </PaginationItem>
                                      {Array.from({ length: Math.min(5, Math.ceil(filteredMeetings.length / itemsPerPage)) }).map((_, i) => {
                                        let pageNum: number;
                                        if (Math.ceil(filteredMeetings.length / itemsPerPage) <= 5) {
                                          pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                          pageNum = i + 1;
                                        } else if (currentPage >= Math.ceil(filteredMeetings.length / itemsPerPage) - 2) {
                                          pageNum = Math.ceil(filteredMeetings.length / itemsPerPage) - 4 + i;
                                        } else {
                                          pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                          <PaginationItem key={pageNum}>
                                            <Button
                                              variant={currentPage === pageNum ? "outline" : "ghost"}
                                              size="sm"
                                              onClick={() => setCurrentPage(pageNum)}
                                            >
                                              {pageNum}
                                            </Button>
                                          </PaginationItem>
                                        );
                                      })}
                                      <PaginationItem>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredMeetings.length / itemsPerPage), p + 1))}
                                          disabled={currentPage === Math.ceil(filteredMeetings.length / itemsPerPage)}
                                        >
                                          <ChevronRight className="h-4 w-4" />
                                        </Button>
                                      </PaginationItem>
                                    </PaginationContent>
                                  </Pagination>
                                )}
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <div className="flex justify-center items-center h-48">
                          <p>Department non trouvé</p>
                        </div>
                      )}

                      {/* Meeting Details Dialog */}
                      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Détails du Rendez-vous</DialogTitle>
                            <DialogDescription>
                              {selectedMeeting?.userId.firstName} {selectedMeeting?.userId.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedMeeting && (
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label>Client</Label>
                                <div className="p-3 border rounded-lg">
                                  {selectedMeeting.userId ? (
                                    <>
                                      <div className="font-medium">
                                        {selectedMeeting.userId.firstName} {selectedMeeting.userId.lastName}
                                      </div>
                                      {selectedMeeting.userId.email && (
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {selectedMeeting.userId.email}
                                        </div>
                                      )}
                                      {selectedMeeting.userId.phone && (
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {selectedMeeting.userId.phone}
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="font-medium">Client inconnu</div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Employé</Label>
                                <div className="p-3 border rounded-lg">
                                  {selectedMeeting.employeeId ? (
                                    <>
                                      <div className="font-medium">{selectedMeeting.employeeId.firstName} {selectedMeeting.employeeId.lastName}</div>
                                      <div className="text-sm text-gray-600 dark:text-gray-300">{selectedMeeting.employeeId.email}</div>
                                    </>
                                  ) : "Non attribué"}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Date et Heure</Label>
                                <div className="p-3 border rounded-lg">
                                  {format(parseISO(selectedMeeting.date), "PPPp", { locale: fr })}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Statut</Label>
                                <div className="p-3 border rounded-lg">
                                  {getStatusBadge(selectedMeeting.status)}
                                </div>
                              </div>

                              {selectedMeeting.description && (
                                <div className="space-y-2">
                                  <Label>Description</Label>
                                  <div className="p-3 border rounded-lg whitespace-pre-wrap">
                                    {selectedMeeting.description}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                if (selectedMeeting?.status === "Planifié") {
                                  setNewMeetingDate(parseISO(selectedMeeting.date));
                                  setIsDetailsOpen(false);
                                  setIsRescheduleDialogOpen(true);
                                }
                              }}
                              disabled={selectedMeeting?.status !== "Planifié"}
                            >
                              Replanifier
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Accept/Reject Meeting Dialog */}
                      <Dialog open={isAcceptDialogOpen} onOpenChange={(open) => {
                        setIsAcceptDialogOpen(open);
                        if (!open) resetDialogState();
                      }}>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Traiter la demande de rendez-vous</DialogTitle>
                            <DialogDescription>
                              {selectedMeeting?.userId.firstName} {selectedMeeting?.userId.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedMeeting && (
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="employee">Assigner à un employé *</Label>
                                <Select 
                                  onValueChange={handleEmployeeSelect}
                                  value={assignedEmployee}
                                >
                                  <SelectTrigger id="employee" className="w-full">
                                    <SelectValue placeholder="Sélectionnez un employé" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {employees.map(employee => (
                                      <SelectItem key={employee._id} value={employee._id}>
                                        {employee.firstName} {employee.lastName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Date du rendez-vous *</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant={"outline"}
                                      className="w-full justify-start text-left font-normal"
                                    >
                                      {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : format(parseISO(selectedMeeting.date), "PPP", { locale: fr })}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={selectedDate || parseISO(selectedMeeting.date)}
                                      onSelect={handleDateSelect}
                                      initialFocus
                                      locale={fr}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              {assignedEmployee && (
                                <div className="space-y-2">
                                  <Label>Horaire disponible *</Label>
                                  {timeSlots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                      {timeSlots.map(slot => (
                                        <Button
                                          key={slot.time}
                                          variant={selectedSlot === slot.time ? "default" : "outline"}
                                          onClick={() => setSelectedSlot(slot.time)}
                                          className={`h-10 ${!slot.isAvailable ? 'opacity-50' : ''}`}
                                          disabled={!slot.isAvailable}
                                        >
                                          {slot.formattedTime}
                                          {!slot.isAvailable && (
                                            <span className="ml-1 text-xs text-red-500">✗</span>
                                          )}
                                        </Button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Aucun créneau disponible pour cette date
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optionnel)</Label>
                                <Textarea
                                  id="notes"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Ajouter des notes ou des instructions..."
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter className="gap-2">
                            <Button 
                              variant="destructive"
                              onClick={() => handleStatusChange("Rejeté")}
                            >
                              <X className="h-4 w-4 mr-2" /> Rejeter
                            </Button>
                            <Button 
                              onClick={() => handleStatusChange("Planifié")}
                              disabled={!assignedEmployee || !selectedSlot}
                            >
                              <Check className="h-4 w-4 mr-2" /> Accepter
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Reschedule Dialog */}
                      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Replanifier le rendez-vous</DialogTitle>
                            <DialogDescription>
                              {selectedMeeting?.userId.firstName} {selectedMeeting?.userId.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedMeeting && (
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label>Nouvelle date et heure *</Label>
                                <div className="flex flex-col md:flex-row gap-2">
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="border rounded-md p-2 flex-1 text-center">
                                      {newMeetingDate ? format(newMeetingDate, "yyyy-MM-dd", { locale: fr }) : format(parseISO(selectedMeeting.date), "yyyy-MM-dd", { locale: fr })}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        const currentDate = newMeetingDate || parseISO(selectedMeeting.date);
                                        const nextDay = new Date(currentDate);
                                        nextDay.setDate(nextDay.getDate() + 1);
                                        setNewMeetingDate(nextDay);
                                      }}
                                    >
                                      +
                                    </Button>
                                  </div>
                                  
                                  <Select 
                                    value={newMeetingDate ? format(newMeetingDate, "HH:mm") : format(parseISO(selectedMeeting.date), "HH:mm")}
                                    onValueChange={(time) => {
                                      const baseDate = newMeetingDate || parseISO(selectedMeeting.date);
                                      const [hours, minutes] = time.split(':');
                                      const newDate = new Date(baseDate);
                                      newDate.setHours(parseInt(hours), parseInt(minutes));
                                      setNewMeetingDate(newDate);
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Choisir une heure" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 9 }, (_, i) => {
                                        const hour = i + 8; // From 8h to 16h
                                        return [`${hour}:00`, `${hour}:30`];
                                      }).flat().map(time => (
                                        <SelectItem key={time} value={time}>{time}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsRescheduleDialogOpen(false)}
                            >
                              Annuler
                            </Button>
                            <Button 
                              onClick={handleReschedule}
                              disabled={!newMeetingDate}
                            >
                              Confirmer
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  );
                }