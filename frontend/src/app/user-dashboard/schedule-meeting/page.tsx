"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, TableIcon, LayoutGridIcon, ChevronLeft, ChevronRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";

type MeetingStatus = "Demandé" | "Planifié" | "Terminé" | "Annulé";

interface StatusConfig {
  color: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
}

const statusConfig: Record<MeetingStatus, StatusConfig> = {
  "Demandé": { 
    color: "blue", 
    bgLight: "bg-blue-100", 
    bgDark: "bg-blue-900/30", 
    textLight: "text-blue-800", 
    textDark: "text-blue-300" 
  },
  "Planifié": { 
    color: "yellow", 
    bgLight: "bg-yellow-100", 
    bgDark: "bg-yellow-900/30", 
    textLight: "text-yellow-800", 
    textDark: "text-yellow-300" 
  },
  "Terminé": { 
    color: "green", 
    bgLight: "bg-green-100", 
    bgDark: "bg-green-900/30", 
    textLight: "text-green-800", 
    textDark: "text-green-300" 
  },
  "Annulé": { 
    color: "red", 
    bgLight: "bg-red-100", 
    bgDark: "bg-red-900/30", 
    textLight: "text-red-800", 
    textDark: "text-red-300" 
  }
};

const getStatusConfig = (status: string): StatusConfig => {
  return statusConfig[status as MeetingStatus] || {
    color: "gray",
    bgLight: "bg-gray-100",
    bgDark: "bg-gray-900/30",
    textLight: "text-gray-800",
    textDark: "text-gray-300"
  };
};

interface Meeting {
  _id: string;
  date: string;
  department: string;
  status: MeetingStatus;
  meetingLink?: string;
}

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export default function UserMeetingsPage() {
  const { theme } = useTheme();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("09:00");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const userName = typeof window !== "undefined" ? localStorage.getItem("firstName") : null;
  const userDepartment = typeof window !== "undefined" ? localStorage.getItem("department") : null;

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      if (!userId) return;
      
      const response = await api.get(`/meetings/user/${userId}`);
      setMeetings(response.data);
    } catch (err) {
      toast.error("Erreur de chargement des rendez-vous");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [userId]);

  const handleCreateMeeting = async () => {
    try {
      if (!userId || !date || !userDepartment || !time) {
        throw new Error("Tous les champs sont obligatoires");
      }

      const [hours, minutes] = time.split(':');
      const meetingDate = new Date(date);
      meetingDate.setHours(parseInt(hours), parseInt(minutes));

      await api.post("/meetings", {
        userId,
        department: userDepartment,
        date: meetingDate.toISOString()
      });

      await fetchMeetings();
      toast.success(
        `Rendez-vous créé pour le ${format(meetingDate, "PPP", { locale: fr })} à ${time}`,
        { duration: 4000 }
      );
      setIsDialogOpen(false);
      setTime("09:00");
      setDate(new Date());
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la création");
    }
  };

  // Filter meetings based on status
  const filteredMeetings = meetings.filter(meeting => 
    statusFilter === "all" || meeting.status === statusFilter
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMeetings = filteredMeetings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage);

  // Initialize status counts
  const statusCounts = (Object.keys(statusConfig) as MeetingStatus[]).reduce((acc, status) => {
    acc[status] = meetings.filter(m => m.status === status).length;
    return acc;
  }, {} as Record<MeetingStatus, number>);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Toaster position="top-center" />
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes Rendez-vous CNI - {userName}</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900">
              + Créer un rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Nouveau Rendez-vous</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Produit CNI</label>
                <Input 
                  value={userDepartment || ""} 
                  disabled 
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <div className="border rounded-md p-2">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Heure</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  min="09:00"
                  max="17:00"
                  step="3600"
                  required
                  className="dark:bg-gray-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900"
                  onClick={handleCreateMeeting}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(statusConfig) as MeetingStatus[]).map((status) => {
          const config = statusConfig[status];
          return (
            <Card 
              key={status} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                statusFilter === status ? `border-${config.color}-500 dark:border-${config.color}-400` : ""
              }`}
              onClick={() => {
                setStatusFilter(statusFilter === status ? "all" : status);
                setCurrentPage(1);
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{status}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{statusCounts[status] || 0}</p>
                  <div className={`h-3 w-3 rounded-full bg-${config.color}-500`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Controls */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            Tous ({meetings.length})
          </Button>
          {(Object.keys(statusConfig) as MeetingStatus[]).map((status) => {
            const config = statusConfig[status];
            return (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={cn(
                  statusFilter === status && 
                  `bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/50 dark:text-${config.color}-300`
                )}
              >
                {status} ({statusCounts[status] || 0})
              </Button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-4">
          <ToggleGroup 
            type="single" 
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "table" | "cards")}
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Card view">
              <LayoutGridIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center space-x-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-md p-1 text-sm dark:bg-gray-800"
            >
              <option value={5}>5 par page</option>
              <option value={10}>10 par page</option>
              <option value={20}>20 par page</option>
              <option value={50}>50 par page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings Display */}
      {viewMode === "table" ? (
        <div className="border rounded-lg shadow-sm dark:border-gray-700">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800">
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Produit CNI</TableHead>
                <TableHead>Date et Heure</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Lien</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Aucun rendez-vous trouvé
                  </TableCell>
                </TableRow>
              ) : (
                currentMeetings.map((meeting) => {
                  const config = getStatusConfig(meeting.status);
                  return (
                    <TableRow key={meeting._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>{userName}</TableCell>
                      <TableCell>{meeting.department}</TableCell>
                      <TableCell>
                        {format(new Date(meeting.date), "PPPp", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          theme === "dark" ? config.bgDark : config.bgLight
                        } ${theme === "dark" ? config.textDark : config.textLight}`}>
                          {meeting.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {meeting.status === "Planifié" && meeting.meetingLink && (
                          <a 
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Rejoindre
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentMeetings.length === 0 ? (
            <div className="col-span-full text-center py-8">
              Aucun rendez-vous trouvé
            </div>
          ) : (
            currentMeetings.map((meeting) => {
              const config = getStatusConfig(meeting.status);
              return (
                <Card key={meeting._id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{userName}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {meeting.department}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        theme === "dark" ? config.bgDark : config.bgLight
                      } ${theme === "dark" ? config.textDark : config.textLight}`}>
                        {meeting.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {format(new Date(meeting.date), "PPPp", { locale: fr })}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredMeetings.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredMeetings.length)} sur {filteredMeetings.length} rendez-vous
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}