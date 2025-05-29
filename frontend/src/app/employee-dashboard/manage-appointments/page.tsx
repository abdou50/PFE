"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { format, parseISO, addMinutes, isBefore, isAfter, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, UserIcon, Check, X, Clock, ChevronLeft, ChevronRight, Video } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";

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

export default function EmployeeMeetingDashboard() {
  const { theme } = useTheme();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const calendarRef = useRef<any>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isLoading, setIsLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    setEmployeeId(storedUserId);
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      const dept = localStorage.getItem("department");
      setDepartment(dept);
      
      if (!dept || !employeeId) {
        toast.error("Informations de l'employé non trouvées");
        setIsLoading(false);
        return;
      }
  
      setIsLoading(true);
      try {
        const meetingsRes = await axios.get(`http://localhost:5000/api/meetings/employee/${employeeId}`);

        if (Array.isArray(meetingsRes.data)) {
          setMeetings(meetingsRes.data);
          toast.success(`${meetingsRes.data.length} rendez-vous chargés`);
        } else {
          toast.error("Format de données incorrect");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Erreur de chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [employeeId]);

  const canJoinMeeting = (meetingDate: string) => {
    const now = new Date();
    const meetingTime = new Date(meetingDate);
    const fifteenMinutesBefore = addMinutes(meetingTime, -15);
    const fifteenMinutesAfter = addMinutes(meetingTime, 15);
    
    // Can join 15 minutes before and 15 minutes after scheduled time
    return isAfter(now, fifteenMinutesBefore) && isBefore(now, fifteenMinutesAfter);
  };

  const generateMeetingLink = async (meetingId: string) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/meetings/${meetingId}/generate-link`);
      
      if (response.data.meeting?.meetingLink) {
        setMeetings(meetings.map(m => 
          m._id === meetingId ? { ...m, meetingLink: response.data.meeting.meetingLink } : m
        ));
        
        if (selectedMeeting?._id === meetingId) {
          setSelectedMeeting({ ...selectedMeeting, meetingLink: response.data.meeting.meetingLink });
        }
        
        toast.success("Lien de réunion généré avec succès");
      }
    } catch (error) {
      toast.error("Erreur lors de la génération du lien");
    }
  };

  const joinMeeting = (meeting: Meeting) => {
    if (!meeting.meetingLink) {
      toast.error("Aucun lien de réunion disponible");
      return;
    }
    
    const now = new Date();
    const meetingTime = new Date(meeting.date);
    const fifteenMinutesBefore = addMinutes(meetingTime, -15);
    const fifteenMinutesAfter = addMinutes(meetingTime, 15);
    
    if (!canJoinMeeting(meeting.date)) {
      const formattedDate = format(parseISO(meeting.date), "PPPp", { locale: fr });
      
      if (isBefore(now, fifteenMinutesBefore)) {
        // Too early to join
        const minutesUntilJoinable = Math.ceil(differenceInMinutes(fifteenMinutesBefore, now));
        toast.error(
          `Vous pourrez rejoindre cette réunion dans ${minutesUntilJoinable} minutes (à partir de ${format(fifteenMinutesBefore, "HH:mm", { locale: fr })})`,
          { duration: 5000 }
        );
      } else if (isAfter(now, fifteenMinutesAfter)) {
        // Too late to join
        toast.error(
          `Le délai pour rejoindre cette réunion est dépassé (disponible jusqu'à ${format(fifteenMinutesAfter, "HH:mm", { locale: fr })})`,
          { duration: 5000 }
        );
      }
      return;
    }
    
    window.open(meeting.meetingLink, '_blank');
    toast.success("Redirection vers la réunion en cours...");
  };

  const updateMeetingStatus = async (status: "Terminé" | "Annulé") => {
    if (!selectedMeeting) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/meetings/${selectedMeeting._id}/status`,
        { status }
      );
      
      setMeetings(meetings.map(m => 
        m._id === selectedMeeting._id ? { ...m, status } : m
      ));
      
      toast.success(`Rendez-vous marqué comme ${status.toLowerCase()}`);
      setIsDetailsOpen(false);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const calendarEvents = meetings.map(meeting => ({
    id: meeting._id,
    title: `${meeting.userId.firstName} ${meeting.userId.lastName}`,
    start: meeting.date,
    end: new Date(new Date(meeting.date).getTime() + 30 * 60 * 1000),
    extendedProps: {
      status: meeting.status,
      meetingLink: meeting.meetingLink || ""
    },
    backgroundColor: meeting.status === "Demandé" ? 
      (theme === "dark" ? "#92400e" : "#f59e0b") : 
      meeting.status === "Planifié" ? 
      (theme === "dark" ? "#065f46" : "#10b981") : 
      meeting.status === "Terminé" ? 
      (theme === "dark" ? "#374151" : "#64748b") : 
      (theme === "dark" ? "#991b1b" : "#ef4444"),
    borderColor: meeting.status === "Demandé" ? 
      (theme === "dark" ? "#92400e" : "#f59e0b") : 
      meeting.status === "Planifié" ? 
      (theme === "dark" ? "#065f46" : "#10b981") : 
      meeting.status === "Terminé" ? 
      (theme === "dark" ? "#374151" : "#64748b") : 
      (theme === "dark" ? "#991b1b" : "#ef4444"),
    textColor: "#ffffff"
  }));

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
                      <span>Mon Calendrier de Rendez-vous</span>
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
                      events={calendarEvents}
                      eventClick={(clickInfo) => {
                        const meeting = meetings.find(m => m._id === clickInfo.event.id);
                        if (meeting) {
                          setSelectedMeeting(meeting);
                          setMeetingLink(meeting.meetingLink || "");
                          setIsDetailsOpen(true);
                        }
                      }}
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
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Mes Rendez-vous</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map(meeting => (
                      <TableRow key={meeting._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="font-medium">{meeting.userId.firstName} {meeting.userId.lastName}</div>
                          {meeting.userId.email && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{meeting.userId.email}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(meeting.date), "PPPp", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(meeting.status)}
                        </TableCell>
                        <TableCell className="flex justify-end space-x-2">
                          {meeting.status === "Planifié" && (
                            <>
                              {meeting.meetingLink ? (
                                <Button
                                  size="sm"
                                  onClick={() => joinMeeting(meeting)}
                                  disabled={!canJoinMeeting(meeting.date)}
                                  className={!canJoinMeeting(meeting.date) ? "opacity-50" : ""}
                                >
                                  <Video className="h-4 w-4 mr-1" /> Rejoindre
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => generateMeetingLink(meeting._id)}
                                >
                                  <Video className="h-4 w-4 mr-1" /> Créer lien
                                </Button>
                              )}
                            </>
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
                    ))}
                  </TableBody>
                </Table>
                
                {meetings.length > itemsPerPage && (
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
                      {Array.from({ length: Math.min(5, Math.ceil(meetings.length / itemsPerPage)) }).map((_, i) => {
                        let pageNum: number;
                        if (Math.ceil(meetings.length / itemsPerPage) <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= Math.ceil(meetings.length / itemsPerPage) - 2) {
                          pageNum = Math.ceil(meetings.length / itemsPerPage) - 4 + i;
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
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(meetings.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(meetings.length / itemsPerPage)}
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
          <p>Département non trouvé</p>
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
                  <div className="font-medium">{selectedMeeting.userId.firstName} {selectedMeeting.userId.lastName}</div>
                  {selectedMeeting.userId.email && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">{selectedMeeting.userId.email}</div>
                  )}
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

              <div className="space-y-2">
                <Label>Lien de réunion</Label>
                {selectedMeeting.status === "Planifié" ? (
                  <div className="flex flex-col gap-2">
                    {selectedMeeting.meetingLink ? (
                      <>
                        <div className="flex gap-2">
                          <Input
                            value={meetingLink}
                            readOnly
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(meetingLink);
                              toast.success("Lien copié !");
                            }}
                          >
                            Copier
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => joinMeeting(selectedMeeting)}
                          disabled={!canJoinMeeting(selectedMeeting.date)}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Rejoindre la réunion
                        </Button>
                        {!canJoinMeeting(selectedMeeting.date) && (
                          <div className="text-sm text-muted-foreground mt-2">
                            {(() => {
                              const now = new Date();
                              const meetingTime = new Date(selectedMeeting.date);
                              const fifteenMinutesBefore = addMinutes(meetingTime, -15);
                              const fifteenMinutesAfter = addMinutes(meetingTime, 15);
                              
                              if (isBefore(now, fifteenMinutesBefore)) {
                                const minutesUntilJoinable = Math.ceil(differenceInMinutes(fifteenMinutesBefore, now));
                                return `Vous pourrez rejoindre cette réunion dans ${minutesUntilJoinable} minutes (à partir de ${format(fifteenMinutesBefore, "HH:mm", { locale: fr })})`;
                              } else if (isAfter(now, fifteenMinutesAfter)) {
                                return `Le délai pour rejoindre cette réunion est dépassé (disponible jusqu'à ${format(fifteenMinutesAfter, "HH:mm", { locale: fr })})`;
                              }
                              return "";
                            })()}
                          </div>
                        )}
                      </>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => generateMeetingLink(selectedMeeting._id)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Générer un lien de réunion
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">
                    Le lien de réunion sera disponible une fois le rendez-vous planifié
                  </div>
                )}
              </div>

              {selectedMeeting.status === "Planifié" && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => updateMeetingStatus("Terminé")}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Marquer comme Terminé
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => updateMeetingStatus("Annulé")}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler le Rendez-vous
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}