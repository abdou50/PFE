"use client";

import { useState, useEffect, SetStateAction } from "react";
import axios from "axios";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";
import { CustomCalendar } from "../../components/CustomCalendar";

// Components
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Meeting {
  _id: string;
  date: string;
  department: string;
  status: string;
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
  const [calendarOpen, setCalendarOpen] = useState(false);

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

      const response = await api.post("/meetings", {
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
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la création");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="toast-container">
        <Toaster position="top-center" />
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Mes Rendez-vous CNI - {userName}</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900">
              + Créer un meet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Nouveau Rendez-vous</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Produit CNI</label>
                <Input 
                  value={userDepartment || ""} 
                  disabled 
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 border-0 shadow-xl"
                      align="start"
                    >
                      <CustomCalendar
                        selectedDate={date}
                        onDateSelect={(selectedDate: SetStateAction<Date | undefined>) => {
                          setDate(selectedDate);
                          setCalendarOpen(false);
                        }}
                        className={theme === "dark" ? "dark:bg-gray-900 dark:text-white" : ""}
                      />
                    </PopoverContent>
                  </Popover>
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
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900"
                onClick={handleCreateMeeting}
              >
                Confirmer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg shadow-sm dark:border-gray-700">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="font-medium">Nom</TableHead>
              <TableHead className="font-medium">Produit CNI</TableHead>
              <TableHead className="font-medium">Date et Heure</TableHead>
              <TableHead className="font-medium">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Aucun rendez-vous trouvé
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((meeting) => (
                <TableRow key={meeting._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>{userName}</TableCell>
                  <TableCell>{meeting.department}</TableCell>
                  <TableCell>
                    {format(new Date(meeting.date), "PPPp", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      meeting.status === "Demandé" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" :
                      meeting.status === "Planifié" 
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300" :
                      meeting.status === "Terminé" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                    }`}>
                      {meeting.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}