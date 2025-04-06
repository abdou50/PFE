"use client";
import { useState, useMemo, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, User, Briefcase, Landmark, MessageCircle, Calendar, File, Check, X, ChevronRight, ChevronLeft, Circle } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
  status: "brouillant" | "envoyer" | "en attente" | "rejetée" | "traitée";
  feedback?: string;
  createdAt: string;
  service?: string;
};

type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
};

const STATUS_TRANSLATIONS = {
  brouillant: { label: "Brouillant", color: "bg-gray-500" },
  envoyer: { 
    label: "Nouvelle Requête", 
    color: "bg-blue-500",
    rowClass: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50",
    flash: false
  },
  "en attente": { 
    label: "En cours de traitement", 
    color: "bg-yellow-500",
    rowClass: "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50",
    flash: true
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
  "Manque de détails",
  "Documents incomplets",
  "Hors compétence",
  "Délai dépassé",
  "Demande non conforme",
  "Informations manquantes",
  "Double demande",
  "Non conforme aux règles"
];

const TYPE_TRANSLATIONS = {
  "Data Request": "Demande de Données",
  "Reclamation": "Réclamation",
};

export default function ReclamationTable({ data }: { data: Reclamation[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedbackField, setShowFeedbackField] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [guichetierId, setGuichetierId] = useState<string>("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPriseEnChargeOpen, setIsPriseEnChargeOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiGeneratedFeedback, setAIGeneratedFeedback] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<"rejetée" | "résolue" | null>(null);
  const [showAIFeedbackField, setShowAIFeedbackField] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState("");

  useEffect(() => {
    const storedGuichetierId = localStorage.getItem("userId") ?? "";
    setGuichetierId(storedGuichetierId);
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
    return data.filter((reclamation) => {
      const matchesSearch =
        reclamation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.ministre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reclamation.service && reclamation.service.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || reclamation.status === statusFilter;
      const matchesType = typeFilter === "all" || reclamation.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType && reclamation.status !== "brouillant";
    });
  }, [data, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleRowClick = async (reclamationId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reclamations/${reclamationId}`);
      const reclamation = response.data.data;

      if (reclamation.status === "envoyer") {
        setSelectedReclamation(reclamation);
        setIsDialogOpen(true);

        await axios.put(`http://localhost:5000/api/reclamations/${reclamationId}`, {
          status: "en attente",
          guichetierId: localStorage.getItem("userId") ?? "",
        });
        toast.success("Statut mis à jour à 'en attente'");
      }
    } catch (error) {
      console.error("Error fetching reclamation details:", error);
      toast.error("Échec de la récupération des détails de la réclamation");
    }
  };

  const handlePriseEnCharge = async () => {
    if (!selectedReclamation || !guichetierId) return;

    try {
      const response = await axios.put(`http://localhost:5000/api/reclamations/${selectedReclamation._id}`, {
        guichetierId,
        feedback: feedbackText,
        status: "en attente",
      });

      if (response.status === 200) {
        toast.success("Réclamation prise en charge avec succès");
        setIsDialogOpen(false);
        setIsPriseEnChargeOpen(true);
      }
    } catch (error) {
      console.error("Error taking charge:", error);
      toast.error("Échec de la prise en charge");
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
      const response = await axios.put(`http://localhost:5000/api/reclamations/${selectedReclamation._id}`, {
        status: newStatus,
        feedback: feedbackText,
      });

      if (response.status === 200) {
        toast.success(`Réclamation marquée comme ${newStatus}`);
        setIsDialogOpen(false);
        setIsPriseEnChargeOpen(false);
        window.location.reload();
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

  const generateDescriptionWithAI = async () => {
    if (!selectedReclamation?.title) {
      toast.error("Veuillez d'abord entrer un titre.");
      return;
    }

    setIsLoadingAI(true);
    setFeedbackText("");

    try {
      const prompt = `Rédige un texte descriptif pour une feedback concernant une réclamation.
                     
                    Le texte doit être court et concis, et doit inclure les informations suivantes :
                    avec chere ${selectedReclamation.firstName}
                    nous avant lu ${selectedReclamation.type} avec le objet  ${selectedReclamation.title}  lieu de travail la ministére de ${selectedReclamation.ministre}.
                    and voici le resultat 
                    Détails supplémentaires: ${additionalDetails}. 
                    Le texte doit être clair, professionnel et détaillé en dissant le lieu du travail`;

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          params: {
            key: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          },
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const generatedDescription = response.data.candidates[0].content.parts[0].text.trim();
      typeText(generatedDescription, setFeedbackText);
      toast.success("Description générée avec succès !");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Erreur lors de la génération de la description.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const typeText = (text: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    let index = 0;
    const interval = setInterval(() => {
      setter(text.slice(0, index));
      index++;
      if (index > text.length) clearInterval(interval);
    }, 20);
  };

  const handleSuggestionClick = (suggestion: "rejetée" | "résolue") => {
    setSelectedSuggestion(suggestion);
    if (suggestion === "résolue") {
      setFeedbackText("La réclamation a été résolue avec succès.");
      setAdditionalDetails("Résolue");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Toaster />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Input
          placeholder="Rechercher par prénom, ministre, service ou type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md"
        />
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_TRANSLATIONS).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Data Request">Demande de Données</SelectItem>
              <SelectItem value="Reclamation">Réclamation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-semibold">Prénom</TableCell>
              <TableCell className="font-semibold">Service</TableCell>
              <TableCell className="font-semibold">Type</TableCell>
              <TableCell className="font-semibold">Ministre</TableCell>
              <TableCell className="font-semibold">Statut</TableCell>
              <TableCell className="font-semibold">Date</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((reclamation) => (
              <TableRow
                key={reclamation._id}
                className={`${(STATUS_TRANSLATIONS[reclamation.status] as { rowClass: string }).rowClass || ''} transition-colors cursor-pointer`}
                onClick={() => handleRowClick(reclamation._id)}
              >
                <TableCell>{reclamation.firstName}</TableCell>
                <TableCell>{reclamation.service || "Non spécifié"}</TableCell>
                <TableCell>{TYPE_TRANSLATIONS[reclamation.type as keyof typeof TYPE_TRANSLATIONS] || reclamation.type}</TableCell>
                <TableCell>{reclamation.ministre}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={`${STATUS_TRANSLATIONS[reclamation.status].color} text-white px-3 py-1 rounded-full`}>
                      {STATUS_TRANSLATIONS[reclamation.status].label}
                    </Badge>
                    {(STATUS_TRANSLATIONS[reclamation.status] as { flash: boolean }).flash && (
                      <Circle className="w-2 h-2 text-yellow-500 animate-pulse" fill="currentColor" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{new Date(reclamation.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-4">
          <span>Lignes par page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
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
          >
            Précédent
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Suivant
          </Button>
        </div>
      </div>

      {selectedReclamation && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl max-h-[90vh] rounded-lg overflow-auto p-6 bg-background text-foreground shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Détails de la Requêtes</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto">
              <DialogDescription className="space-y-4">
                <div className="text-sm flex items-center gap-2">
                  <User size={16} />
                  <strong>Utilisateur:</strong> {selectedReclamation.firstName}
                </div>

                <div className="text-sm flex items-center gap-2">
                  <User size={16} />
                  <strong>ID Utilisateur:</strong> {selectedReclamation.userId}
                </div>

                <div className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  <strong>ID Requêtes :</strong> {selectedReclamation._id}
                </div>

                <div className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  <strong>Object:</strong> {selectedReclamation.title}
                </div>

                <div className="text-sm flex items-center gap-2">
                  <File size={16} />
                  <strong>Fichiers joints:</strong>{" "}
                  {selectedReclamation.files.length > 0 ? (
                    <span className="ml-2 text-green-500">({selectedReclamation.files.length} fichier(s))</span>
                  ) : (
                    <span className="ml-2 text-gray-500">Aucun fichier</span>
                  )}
                </div>

                {selectedReclamation.files.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      {selectedReclamation.files.map((file, index) => (
                        <div key={index} className="relative border rounded-lg overflow-hidden">
                          <img
                            src={getFileUrl(file)}
                            alt={`Fichier joint ${index + 1}`}
                            className="w-full h-32 object-cover cursor-pointer"
                            onClick={() => handleImageClick(index)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  <strong>Type:</strong> {selectedReclamation.type}
                </div>

                <div className="text-sm flex items-center gap-2">
                  <Briefcase size={16} />
                  <strong>Produit Cni:</strong> {selectedReclamation.department}
                </div>

                <div className="text-sm flex items-center gap-2">
                  <MessageCircle size={16} />
                  <strong>Description:</strong>
                  <pre className="whitespace-pre-wrap p-2 rounded-lg mt-2 bg-muted">
                    {selectedReclamation.description}
                  </pre>
                </div>

                <div className="flex gap-4 mt-8 justify-end">
                  <Button
                    onClick={() => setIsPriseEnChargeOpen(true)}
                    variant="outline"
                    className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Check size={16} /> Prise en charge
                  </Button>
                  <Button
                    onClick={() => setShowFeedbackField(true)}
                    variant="outline"
                    className="flex items-center gap-2 bg-purple-500 text-white hover:bg-purple-600"
                  >
                    Affecter à un technicien
                  </Button>
                </div>
              </DialogDescription>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {isPriseEnChargeOpen && (
        <Dialog open={isPriseEnChargeOpen} onOpenChange={setIsPriseEnChargeOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl max-h-[90vh] rounded-lg overflow-auto p-6 bg-background text-foreground shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Prise en Charge</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto">
              <DialogDescription className="space-y-4">
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Feedback:</p>
                  <Textarea
                    placeholder="Entrez votre feedback..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="mb-4"
                  />
                  <Button
                    onClick={() => setShowAIFeedbackField(true)}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Générer avec IA
                  </Button>
                </div>

                {showAIFeedbackField && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleSuggestionClick("résolue")}
                        variant={selectedSuggestion === "résolue" ? "default" : "outline"}
                        className="w-full"
                      >
                        Résolue
                      </Button>
                      <Button
                        onClick={() => setSelectedSuggestion("rejetée")}
                        variant={selectedSuggestion === "rejetée" ? "destructive" : "outline"}
                        className="w-full"
                      >
                        Rejetée
                      </Button>
                    </div>

                    {selectedSuggestion === "rejetée" && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Raison du rejet:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {REJECTION_REASONS.map((reason) => (
                            <Button
                              key={reason}
                              variant="outline"
                              className="text-left justify-start h-auto py-2"
                              onClick={() => {
                                setFeedbackText(`Rejetée: ${reason}`);
                                setAdditionalDetails(reason);
                              }}
                            >
                              {reason}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Textarea
                      placeholder="Entrez des détails supplémentaires..."
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      className="mt-4"
                    />

                    <Button
                      onClick={generateDescriptionWithAI}
                      className="w-full bg-blue-500 text-white hover:bg-blue-600"
                      disabled={isLoadingAI}
                    >
                      {isLoadingAI ? "Génération en cours..." : "Générer avec IA"}
                    </Button>
                  </div>
                )}
              </DialogDescription>
            </ScrollArea>

            <div className="flex gap-4 mt-8 justify-end">
              <Button
                onClick={() => handleStatusUpdate("traitée")}
                variant="outline"
                className="flex items-center gap-2 bg-green-500 text-white hover:bg-green-600"
              >
                <Check size={16} /> Résolue
              </Button>
              <Button
                onClick={() => handleStatusUpdate("rejetée")}
                variant="destructive"
                className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-600"
              >
                <X size={16} /> Rejetée
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showFeedbackField && (
        <Dialog open={showFeedbackField} onOpenChange={setShowFeedbackField}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl max-h-[90vh] rounded-lg overflow-auto p-6 bg-background text-foreground shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Affecter à un technicien</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto">
              <DialogDescription className="space-y-4">
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Sélectionner un technicien:</p>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un employé" />
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
                    className="mt-2 w-full bg-purple-500 text-white hover:bg-purple-600"
                  >
                    Affecter
                  </Button>
                </div>
              </DialogDescription>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {selectedReclamation && (
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl max-h-[90vh] rounded-lg overflow-auto p-6 bg-background text-foreground shadow-lg">
            <div className="relative w-full h-[80vh]">
              <img
                src={getFileUrl(selectedReclamation.files[currentImageIndex])}
                alt={`Fichier joint ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 transform -translate-y-1/2"
                onClick={handlePrevImage}
              >
                <ChevronLeft size={24} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 transform -translate-y-1/2"
                onClick={handleNextImage}
              >
                <ChevronRight size={24} />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}