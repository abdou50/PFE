"use client";
import { useState, useMemo, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, User, Briefcase, Landmark, MessageCircle, File, Check, X, ChevronRight, ChevronLeft, Circle, Clipboard } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useTheme } from "next-themes";

type Reclamation = {
  _id: string;
  title: string;
  firstName: string;
  lastName: string;
  department: string;
  type: string;
  ministre: string;
  description: string;
  files: string[];
  userId: string;
  guichetierId?: string;
  guichetierName?: string;
  employeeId?: string;
  employeeName?: string;
  status: "envoyer" | "en attente" | "rejetée" | "traitée";
  feedback?: string;
  createdAt: string;
  service?: string;
  phone?: string;
  email?: string;
};

const STATUS_TRANSLATIONS = {
  envoyer: { 
    label: "Nouvelle Requête", 
    color: "bg-blue-500",
    rowClass: "bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50",
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
    rowClass: "bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/30 dark:hover:bg-gray-900/50",
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

const TYPE_TRANSLATIONS = {
  "Data Request": "Demande de Données",
  "Reclamation": "Réclamation",
};

export default function EmployeeReclamationTable() {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPriseEnChargeOpen, setIsPriseEnChargeOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<"rejetée" | "résolue" | null>(null);
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<number[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const storedEmployeeId = localStorage.getItem("userId") ?? "";
        setEmployeeId(storedEmployeeId);
        
        if (storedEmployeeId) {
          const response = await axios.get(`http://localhost:5000/api/reclamations/employee/${storedEmployeeId}`);
          setReclamations(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching reclamations:", error);
        toast.error("Échec du chargement des réclamations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  const employeeReclamations = useMemo(() => {
    return reclamations.filter(reclamation => reclamation.employeeId === employeeId);
  }, [reclamations, employeeId]);

  const filteredData = useMemo(() => {
    return employeeReclamations.filter((reclamation) => {
      const matchesSearch =
        reclamation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.ministre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reclamation.service && reclamation.service.toLowerCase().includes(searchTerm.toLowerCase()));

      let statusMatch = true;
      if (statusFilter !== "all") {
        if (statusFilter === "Nouvelle Requête") {
          statusMatch = reclamation.status === "envoyer";
        } else if (statusFilter === "En cours de traitement") {
          statusMatch = reclamation.status === "en attente";
        } else if (statusFilter === "Rejetée") {
          statusMatch = reclamation.status === "rejetée";
        } else if (statusFilter === "Traitée") {
          statusMatch = reclamation.status === "traitée";
        }
      }

      const matchesType = typeFilter === "all" || reclamation.type === typeFilter;

      return matchesSearch && statusMatch && matchesType;
    });
  }, [employeeReclamations, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleRowClick = async (reclamationId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reclamations/${reclamationId}`);
      const reclamation = response.data.data;
      setSelectedReclamation(reclamation);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching reclamation details:", error);
      toast.error("Échec de la récupération des détails de la réclamation");
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
        setIsDialogOpen(false);
        setIsPriseEnChargeOpen(false);
        const updatedResponse = await axios.get(`http://localhost:5000/api/reclamations/employee/${employeeId}`);
        setReclamations(updatedResponse.data.data);
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
    setCurrentImageIndex((prev) => (prev + 1) % selectedReclamation!.files.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedReclamation!.files.length) % selectedReclamation!.files.length);
  };

  const handleSuggestionClick = (suggestion: "rejetée" | "résolue") => {
    setSelectedSuggestion(suggestion);
    setSelectedRejectionReasons([]);
    if (suggestion === "résolue") {
      typeText("La réclamation a été résolue avec succès.", setFeedbackText);
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
    
    const reason = REJECTION_REASONS.find(r => r.id === id);
    if (reason) {
      const newText = `- ${reason.reason}: ${reason.description}\n`;
      typeText(newText, setFeedbackText);
    }
  };

  const typeText = (text: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      setter(prev => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
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
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Input
          placeholder="Rechercher par prénom, nom, ministre, service ou type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md bg-background text-foreground"
        />
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-background text-foreground">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Nouvelle Requête">Nouvelle Requête</SelectItem>
              <SelectItem value="En cours de traitement">En cours de traitement</SelectItem>
              <SelectItem value="Rejetée">Rejetée</SelectItem>
              <SelectItem value="Traitée">Traitée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-background text-foreground">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground">
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Data Request">Demande de Données</SelectItem>
              <SelectItem value="Reclamation">Réclamation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border shadow-sm bg-background">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableCell className="font-semibold">Prénom</TableCell>
              <TableCell className="font-semibold">Nom</TableCell>
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
                  className={`${STATUS_TRANSLATIONS[reclamation.status].rowClass} transition-colors cursor-pointer`}
                  onClick={() => handleRowClick(reclamation._id)}
                >
                  <TableCell>{reclamation.firstName}</TableCell>
                  <TableCell>{reclamation.lastName || "Non spécifié"}</TableCell>
                  <TableCell>{reclamation.service || "Non spécifié"}</TableCell>
                  <TableCell>{TYPE_TRANSLATIONS[reclamation.type as keyof typeof TYPE_TRANSLATIONS] || reclamation.type}</TableCell>
                  <TableCell>{reclamation.ministre}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={`${STATUS_TRANSLATIONS[reclamation.status].color} text-white px-3 py-1 rounded-full`}>
                        {STATUS_TRANSLATIONS[reclamation.status].label}
                      </Badge>
                      {STATUS_TRANSLATIONS[reclamation.status].flash && (
                        <Circle className="w-2 h-2 text-red-500 animate-pulse" fill="currentColor" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(reclamation.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune réclamation trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-4">
          <span className="text-foreground">Lignes par page:</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20 bg-background text-foreground">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outline"
            className="bg-background text-foreground hover:bg-muted"
          >
            Précédent
          </Button>
          <span className="flex items-center px-4 text-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            className="bg-background text-foreground hover:bg-muted"
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* Reclamation Details Dialog */}
      {selectedReclamation && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl max-h-[90vh] rounded-lg overflow-auto p-6 bg-background text-foreground shadow-lg border border-muted">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Détails de la Requête</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto pr-4">
              <div className="space-y-4">
                <Card className="bg-muted/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Informations de base</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" /> Utilisateur
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm">
                          {selectedReclamation.firstName} {selectedReclamation.lastName}
                        </p>
                        <button 
                          onClick={() => copyToClipboard(`${selectedReclamation.firstName} ${selectedReclamation.lastName}`)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Clipboard className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Type
                      </p>
                      <p className="text-sm">{TYPE_TRANSLATIONS[selectedReclamation.type as keyof typeof TYPE_TRANSLATIONS] || selectedReclamation.type}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Ministère
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{selectedReclamation.ministre}</p>
                        <button 
                          onClick={() => copyToClipboard(selectedReclamation.ministre)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Clipboard className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Service
                      </p>
                      <p className="text-sm">{selectedReclamation.service || "Non spécifié"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" /> Guichetier
                      </p>
                      <p className="text-sm">{selectedReclamation.guichetierName || "Non assigné"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" /> Employé assigné
                      </p>
                      <p className="text-sm">{selectedReclamation.employeeName || "Non assigné"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" /> Contact
                      </p>
                      <div className="flex flex-col gap-1">
                        {selectedReclamation.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{selectedReclamation.phone}</span>
                            <button 
                              onClick={() => copyToClipboard(selectedReclamation.phone!)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Clipboard className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {selectedReclamation.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{selectedReclamation.email}</span>
                            <button 
                              onClick={() => copyToClipboard(selectedReclamation.email!)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Clipboard className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {!selectedReclamation.phone && !selectedReclamation.email && (
                          <span className="text-sm text-muted-foreground">Non spécifié</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Détails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Objet
                      </p>
                      <p className="text-sm">{selectedReclamation.title}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" /> Description
                      </p>
                      <pre className="text-sm whitespace-pre-wrap p-3 rounded bg-muted/50">
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
                        <p className="text-sm text-muted-foreground">Aucun fichier joint</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {selectedReclamation.feedback && (
                  <Card className="bg-muted/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm whitespace-pre-wrap p-3 rounded bg-muted/50">
                        {selectedReclamation.feedback}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-4 mt-6 justify-end">
              {selectedReclamation.status === "envoyer" || selectedReclamation.status === "en attente" ? (
                <Button
                  onClick={() => setIsPriseEnChargeOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Check className="mr-2 h-4 w-4" /> Prise en charge
                </Button>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Prise en Charge Dialog with AI Feedback */}
      {isPriseEnChargeOpen && (
        <Dialog open={isPriseEnChargeOpen} onOpenChange={setIsPriseEnChargeOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[90vh] rounded-lg overflow-auto p-6 bg-background text-foreground shadow-lg border border-muted">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Prise en Charge</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Remplissez les détails de la résolution de cette réclamation
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                <Card className="bg-muted/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Feedback</CardTitle>
                    <CardDescription>
                      Rédigez une réponse pour le demandeur
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={isTyping ? "Génération en cours..." : "Entrez votre feedback..."}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="min-h-[120px] bg-background"
                      disabled={isTyping}
                    />
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Options de résolution</CardTitle>
                    <CardDescription>
                      Sélectionnez le statut final de cette réclamation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleSuggestionClick("résolue")}
                        variant={selectedSuggestion === "résolue" ? "default" : "outline"}
                        className="h-24 flex flex-col items-center justify-center gap-2"
                      >
                        <Check className="h-6 w-6" />
                        <span>Résolue</span>
                      </Button>
                      <Button
                        onClick={() => handleSuggestionClick("rejetée")}
                        variant={selectedSuggestion === "rejetée" ? "destructive" : "outline"}
                        className="h-24 flex flex-col items-center justify-center gap-2"
                      >
                        <X className="h-6 w-6" />
                        <span>Rejetée</span>
                      </Button>
                    </div>

                    {selectedSuggestion === "rejetée" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Raisons de rejet :</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {REJECTION_REASONS.map((reason) => (
                              <div 
                                key={reason.id}
                                className={`flex items-start space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
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
                          <p className="text-sm font-medium">Détails supplémentaires :</p>
                          <Textarea
                            placeholder="Ajoutez des détails supplémentaires..."
                            value={additionalDetails}
                            onChange={(e) => setAdditionalDetails(e.target.value)}
                            className="bg-background"
                          />
                        </div>
                      </div>
                    )}

                    {selectedSuggestion === "résolue" && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Détails de la résolution :</p>
                        <Textarea
                          placeholder="Décrivez comment la réclamation a été résolue..."
                          value={additionalDetails}
                          onChange={(e) => setAdditionalDetails(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
            <div className="flex gap-4 mt-6 justify-end">
              <Button
                onClick={() => handleStatusUpdate("traitée")}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={selectedSuggestion !== "résolue" || isTyping}
              >
                <Check className="mr-2 h-4 w-4" /> Confirmer Résolue
              </Button>
              <Button
                onClick={() => handleStatusUpdate("rejetée")}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={selectedSuggestion !== "rejetée" || selectedRejectionReasons.length === 0 || isTyping}
              >
                <X className="mr-2 h-4 w-4" /> Confirmer Rejetée
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Modal */}
      {selectedReclamation && selectedReclamation.files.length > 0 && (
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[90vh] rounded-lg overflow-hidden p-0 bg-background border border-muted">
            <div className="relative w-full h-[80vh]">
              <img
                src={getFileUrl(selectedReclamation.files[currentImageIndex])}
                alt={`Fichier joint ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-background/50 hover:bg-background/80"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-background/50 hover:bg-background/80"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                {selectedReclamation.files.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${currentImageIndex === index ? 'bg-primary' : 'bg-muted-foreground'}`}
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