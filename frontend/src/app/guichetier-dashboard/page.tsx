"use client";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  Table, TableHeader, TableBody, TableRow, TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  FileText, User, Briefcase, Landmark, MessageCircle, File, 
  Check, X, ChevronRight, ChevronLeft, Circle, Search, Filter 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "next-themes";

type Reclamation = {
  _id: string;
  title: string;
  firstName: string;
  department: string;
  type: string;
  ministre: string;
  description: string;
  files: string[];
  userId: string;
  guichetierId?: string;
  employeeId?: string;
  status: "envoyer" | "en attente" | "rejetée" | "traitée";
  feedback?: string;
  createdAt: string;
  service?: string;
};

type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "envoyer", label: "Nouvelle Requête" },
  { value: "rejetée", label: "Rejetée" },
  { value: "traitée", label: "Traitée" }
];

const TYPE_OPTIONS = [
  { value: "all", label: "Tous les types" },
  { value: "Data Request", label: "Demande de Données" },
  { value: "Reclamation", label: "Réclamation" }
];

const STATUS_TRANSLATIONS = {
  envoyer: { 
    label: "Nouvelle Requête", 
    color: "bg-blue-500",
    rowClass: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50",
    flash: true
  },
  "en attente": { 
    label: "En cours de traitement", 
    color: "bg-yellow-500",
    rowClass: "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50",
    flash: false
  },
  rejetée: { 
    label: "Rejetée", 
    color: "bg-red-500",
    rowClass: "bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50",
    flash: false
  },
  traitée: { 
    label: "Traitée", 
    color: "bg-green-500",
    rowClass: "bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50",
    flash: false
  },
};

const REJECTION_REASONS = [
  { id: 1, reason: "Manque de détails", description: "La demande ne contient pas suffisamment d'informations pour être traitée." },
  { id: 2, reason: "Documents incomplets", description: "Les documents joints sont incomplets ou illisibles." },
  { id: 3, reason: "Hors compétence", description: "Cette demande ne relève pas de notre domaine de compétence." },
  { id: 4, reason: "Délai dépassé", description: "Le délai de traitement de cette demande a expiré." },
  { id: 5, reason: "Demande non conforme", description: "La demande ne respecte pas les règles établies." },
  { id: 6, reason: "Double demande", description: "Cette demande a déjà été soumise et traitée." },
  { id: 7, reason: "Informations erronées", description: "Les informations fournies sont incorrectes." },
];

export default function GuichetierDashboard() {
  const { theme } = useTheme();
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Table controls
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Reclamation details
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [guichetierId, setGuichetierId] = useState("");
  
  // Image viewer
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // Status update
  const [isPriseEnChargeOpen, setIsPriseEnChargeOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<"rejetée" | "résolue" | null>(null);
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<number[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedDepartment = localStorage.getItem("department") ?? "";
        const storedGuichetierId = localStorage.getItem("userId") ?? "";
        
        setDepartment(storedDepartment);
        setGuichetierId(storedGuichetierId);

        if (storedDepartment) {
          const response = await axios.get(
            `http://localhost:5000/api/reclamations/department/${storedDepartment}`
          );
          setReclamations(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch reclamations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedReclamation) {
      axios
        .get(`http://localhost:5000/api/users/employees/by-department?department=${selectedReclamation.department}`)
        .then((response) => {
          setEmployees(response.data.data);
        })
        .catch((error) => {
          console.error("Error fetching employees:", error);
          toast.error("Erreur lors de la récupération des employés");
        });
    }
  }, [selectedReclamation]);

  const filteredData = useMemo(() => {
    return reclamations.filter((reclamation) => {
      const matchesSearch =
        reclamation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.ministre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reclamation.service && reclamation.service.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || reclamation.status === statusFilter;
      const matchesType = typeFilter === "all" || reclamation.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [reclamations, searchTerm, statusFilter, typeFilter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Default to newest first
    });
  }, [filteredData]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleRowClick = async (reclamationId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reclamations/${reclamationId}`);
      const reclamation = response.data.data;

      if (reclamation.status === "envoyer") {
        await axios.put(`http://localhost:5000/api/reclamations/${reclamationId}`, {
          status: "en attente",
          guichetierId: localStorage.getItem("userId") ?? "",
        });
        
        setReclamations(prev => prev.map(item => 
          item._id === reclamationId ? { ...item, status: "en attente" } : item
        ));
        
        toast.success("Statut mis à jour à 'en cours de traitement'");
      }
      
      setSelectedReclamation(reclamation);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching reclamation details:", error);
      toast.error("Échec de la récupération des détails de la réclamation");
    }
  };

  const handleAssignEmployee = async () => {
    if (!selectedEmployee || !selectedReclamation) return;

    try {
      const response = await axios.put(`http://localhost:5000/api/reclamations/${selectedReclamation._id}`, {
        employeeId: selectedEmployee,
        status: "en attente",
      });

      if (response.status === 200) {
        const assignedEmployee = employees.find((emp) => emp._id === selectedEmployee);
        toast.success(`Réclamation affectée à ${assignedEmployee?.firstName} ${assignedEmployee?.lastName}`);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error assigning employee:", error);
      toast.error("Échec de l'affectation à un technicien");
    }
  };

  const handleStatusUpdate = async (newStatus: "rejetée" | "traitée") => {
    if (!selectedReclamation) return;

    try {
      let feedback = feedbackText;
      
      if (newStatus === "rejetée" && selectedRejectionReasons.length > 0) {
        const reasonsText = selectedRejectionReasons
          .map(id => {
            const reason = REJECTION_REASONS.find(r => r.id === id);
            return reason ? `- ${reason.reason}: ${reason.description}` : "";
          })
          .join("\n");
        
        feedback = `Rejetée pour les raisons suivantes:\n${reasonsText}\n\n${additionalDetails}`;
      }

      const response = await axios.put(`http://localhost:5000/api/reclamations/${selectedReclamation._id}`, {
        status: newStatus,
        feedback: feedback,
      });

      if (response.status === 200) {
        toast.success(`Réclamation marquée comme ${newStatus}`);
        setReclamations(prev => prev.map(item => 
          item._id === selectedReclamation._id ? { ...item, status: newStatus } : item
        ));
        setIsDialogOpen(false);
        setIsPriseEnChargeOpen(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Échec de la mise à jour du statut");
    }
  };

  const getFileUrl = (filePath: string) => {
    return `http://localhost:5000${filePath}`;
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handleNextImage = () => {
    if (!selectedReclamation) return;
    setCurrentImageIndex((prev) => (prev + 1) % selectedReclamation.files.length);
  };

  const handlePrevImage = () => {
    if (!selectedReclamation) return;
    setCurrentImageIndex((prev) => (prev - 1 + selectedReclamation.files.length) % selectedReclamation.files.length);
  };

  const handleSuggestionClick = (suggestion: "rejetée" | "résolue") => {
    setSelectedSuggestion(suggestion);
    setSelectedRejectionReasons([]);
    if (suggestion === "résolue") {
      setFeedbackText("La réclamation a été résolue avec succès.");
      setAdditionalDetails("Résolue");
    } else {
      setFeedbackText("");
      setAdditionalDetails("");
    }
  };

  const toggleRejectionReason = (id: number) => {
    setSelectedRejectionReasons(prev =>
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#1e1e2d" : "#fff",
            color: theme === "dark" ? "#fff" : "#1e1e2d",
            border: theme === "dark" ? "1px solid #2d3748" : "1px solid #e2e8f0"
          }
        }}
      />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">
          Requêtes pour {department}
        </h1>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background text-foreground"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background text-foreground">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground">
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] bg-background text-foreground">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground">
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border shadow-sm bg-background overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableCell className="font-semibold">Utilisateur</TableCell>
                  <TableCell className="font-semibold">Service</TableCell>
                  <TableCell className="font-semibold">Type</TableCell>
                  <TableCell className="font-semibold">Ministre</TableCell>
                  <TableCell className="font-semibold">Statut</TableCell>
                  <TableCell className="font-semibold">Date</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((reclamation) => (
                    <TableRow
                      key={reclamation._id}
                      className={`${STATUS_TRANSLATIONS[reclamation.status]?.rowClass || 'hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => handleRowClick(reclamation._id)}
                    >
                      <TableCell>{reclamation.firstName}</TableCell>
                      <TableCell>{reclamation.service || "Non spécifié"}</TableCell>
                      <TableCell>
                        {reclamation.type === "Data Request" ? "Demande de Données" : "Réclamation"}
                      </TableCell>
                      <TableCell>{reclamation.ministre}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={`${STATUS_TRANSLATIONS[reclamation.status]?.color || 'bg-gray-500'} text-white px-3 py-1 rounded-full`}>
                            {STATUS_TRANSLATIONS[reclamation.status]?.label || reclamation.status}
                          </Badge>
                          {STATUS_TRANSLATIONS[reclamation.status]?.flash && (
                            <Circle className="w-2 h-2 text-blue-500 animate-pulse" fill="currentColor" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(reclamation.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune réclamation trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Affichage de</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 bg-background text-foreground">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground">
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>éléments sur {filteredData.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Première
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Dernière
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Reclamation Details Dialog */}
      {selectedReclamation && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Détails de la Requête</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de base</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" /> Utilisateur
                      </p>
                      <p>{selectedReclamation.firstName}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Type
                      </p>
                      <p>{selectedReclamation.type === "Data Request" ? "Demande de Données" : "Réclamation"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Ministère
                      </p>
                      <p>{selectedReclamation.ministre}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Service
                      </p>
                      <p>{selectedReclamation.service || "Non spécifié"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Détails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Objet
                      </p>
                      <p>{selectedReclamation.title}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" /> Description
                      </p>
                      <pre className="whitespace-pre-wrap p-3 rounded bg-muted">
                        {selectedReclamation.description}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <File className="w-4 h-4" /> Fichiers joints
                      </p>
                      {selectedReclamation.files.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {selectedReclamation.files.map((file, index) => (
                            <div 
                              key={index} 
                              className="relative border rounded-md overflow-hidden cursor-pointer hover:border-primary"
                              onClick={() => handleImageClick(index)}
                            >
                              <img
                                src={getFileUrl(file)}
                                alt={`Fichier joint ${index + 1}`}
                                className="w-full h-24 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Aucun fichier joint</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
            
            <div className="flex gap-4 justify-end">
              {selectedReclamation.status !== "rejetée" && selectedReclamation.status !== "traitée" && (
                <>
                  <Button
                    onClick={() => setIsPriseEnChargeOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Check className="mr-2 h-4 w-4" /> Prise en charge
                  </Button>
                  
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Affecter à un technicien" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee._id} value={employee._id}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleAssignEmployee}
                    disabled={!selectedEmployee}
                    variant="outline"
                  >
                    Affecter
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Prise en Charge Dialog */}
      {isPriseEnChargeOpen && (
        <Dialog open={isPriseEnChargeOpen} onOpenChange={setIsPriseEnChargeOpen}>
          <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Résolution de la Requête</DialogTitle>
              <DialogDescription>
                Sélectionnez le statut final et fournissez des détails
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleSuggestionClick("résolue")}
                  variant={selectedSuggestion === "résolue" ? "default" : "outline"}
                  className="h-24 flex flex-col gap-2"
                >
                  <Check className="h-6 w-6" />
                  <span>Résolue</span>
                </Button>
                
                <Button
                  onClick={() => handleSuggestionClick("rejetée")}
                  variant={selectedSuggestion === "rejetée" ? "destructive" : "outline"}
                  className="h-24 flex flex-col gap-2"
                >
                  <X className="h-6 w-6" />
                  <span>Rejetée</span>
                </Button>
              </div>
              
              {selectedSuggestion === "rejetée" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-medium">Raisons de rejet :</p>
                    <div className="grid grid-cols-1 gap-2">
                      {REJECTION_REASONS.map((reason) => (
                        <div 
                          key={reason.id}
                          className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer ${
                            selectedRejectionReasons.includes(reason.id)
                              ? "border-primary bg-primary/10"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleRejectionReason(reason.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRejectionReasons.includes(reason.id)}
                            onChange={() => toggleRejectionReason(reason.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium">{reason.reason}</p>
                            <p className="text-sm text-muted-foreground">{reason.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium">Détails supplémentaires :</p>
                    <Textarea
                      placeholder="Ajoutez des détails supplémentaires..."
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {selectedSuggestion === "résolue" && (
                <div className="space-y-2">
                  <p className="font-medium">Détails de la résolution :</p>
                  <Textarea
                    placeholder="Décrivez comment la réclamation a été résolue..."
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <p className="font-medium">Feedback pour l'utilisateur :</p>
                <Textarea
                  placeholder="Entrez votre feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsPriseEnChargeOpen(false)}
              >
                Annuler
              </Button>
              
              {selectedSuggestion === "résolue" && (
                <Button
                  onClick={() => handleStatusUpdate("traitée")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirmer Résolue
                </Button>
              )}
              
              {selectedSuggestion === "rejetée" && (
                <Button
                  onClick={() => handleStatusUpdate("rejetée")}
                  variant="destructive"
                  disabled={selectedRejectionReasons.length === 0}
                >
                  Confirmer Rejetée
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Viewer */}
      {selectedReclamation?.files.length && (
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <div className="relative aspect-video">
              <img
                src={getFileUrl(selectedReclamation.files[currentImageIndex])}
                alt={`Fichier joint ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-4 -translate-y-1/2 bg-background/50 hover:bg-background/80"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-4 -translate-y-1/2 bg-background/50 hover:bg-background/80"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {selectedReclamation.files.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      currentImageIndex === index ? 'bg-primary' : 'bg-muted-foreground'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}