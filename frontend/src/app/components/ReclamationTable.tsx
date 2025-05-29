"use client";
import { useState, useMemo, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, User, Briefcase, Landmark, MessageCircle, File, Check, X, ChevronRight, ChevronLeft, Circle } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";

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

const STATUS_TRANSLATIONS = {
  "envoyer": {
    label: "Envoyée",
    color: "bg-blue-100 text-blue-800",
    rowClass: "hover:bg-blue-50/50",
    flash: true
  },
  "en attente": {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
    rowClass: "hover:bg-yellow-50/50",
    flash: false
  },
  "rejetée": {
    label: "Rejetée",
    color: "bg-red-100 text-red-800",
    rowClass: "hover:bg-red-50/50",
    flash: false
  },
  "traitée": {
    label: "Traitée",
    color: "bg-green-100 text-green-800",
    rowClass: "hover:bg-green-50/50",
    flash: false
  }
} as const;

const REJECTION_REASONS = [
  { id: 1, reason: "Manque de détails", description: "La demande ne contient pas suffisamment d'informations pour être traitée." },
  { id: 2, reason: "Documents incomplets", description: "Les documents joints sont incomplets ou illisibles." },
  { id: 3, reason: "Hors compétence", description: "Cette demande ne relève pas de notre domaine de compétence." },
  { id: 4, reason: "Informations incorrectes", description: "Les informations fournies sont erronées ou incohérentes." },
  { id: 5, reason: "Doublon", description: "Une demande similaire existe déjà." },
  { id: 6, reason: "Non conforme", description: "La demande ne respecte pas les critères requis." }
];

export default function ReclamationTable({ 
  data, 
  sortOrder, 
  onSortChange,
  onRefresh,
  isLoading 
}: { 
  data: Reclamation[]; 
  sortOrder: "asc" | "desc";
  onSortChange: (order: "asc" | "desc") => void;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"assign" | "resolve" | "reject" | null>(null);
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<number[]>([]);

  const filteredData = useMemo(() => {
    return data.filter((reclamation) => {
      const matchesSearch =
        reclamation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.ministre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reclamation.service && reclamation.service.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "Nouvelle Requête" && reclamation.status === "envoyer") ||
        (statusFilter === "En cours" && reclamation.status === "en attente") ||
        (statusFilter === "Rejetée" && reclamation.status === "rejetée") ||
        (statusFilter === "Traitée" && reclamation.status === "traitée");

      const matchesType = typeFilter === "all" || reclamation.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [data, searchTerm, statusFilter, typeFilter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [filteredData, sortOrder]);

  const handleRowClick = async (reclamation: Reclamation) => {
    try {
      setSelectedReclamation(reclamation);
      setIsDialogOpen(true);

      const response = await axios.get(
        `http://localhost:5000/api/users/employees/by-department?department=${reclamation.department}`
      );
      setEmployees(response.data.data);
    } catch (error) {
      console.error("Error fetching reclamation details:", error);
      toast.error("Échec de la récupération des détails");
    }
  };

  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  const handleAction = async () => {
    if (!selectedReclamation) return;
  
    try {
      setStatusChangeLoading(true);
      let updateData: any = {};
  
      if (actionType === "assign") {
        updateData = {
          employeeId: selectedEmployee,
          status: "en attente"
        };
      } else if (actionType === "resolve") {
        updateData = {
          status: "traitée",
          feedback: feedbackText
        };
      } else if (actionType === "reject") {
        const reasonsText = selectedRejectionReasons
          .map(id => REJECTION_REASONS.find(r => r.id === id)?.reason)
          .filter(Boolean)
          .join(", ");
        
        updateData = {
          status: "rejetée",
          feedback: `Rejetée pour les raisons suivantes: ${reasonsText}. ${feedbackText}`
        };
      }
  
      await axios.put(
        `http://localhost:5000/api/reclamations/${selectedReclamation._id}`,
        updateData
      );
  
      toast.success(`Action ${actionType} réussie`);
      setIsActionDialogOpen(false);
      setIsDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Échec de l'action");
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const getFileUrl = (filePath: string) => {
    return `http://localhost:5000${filePath}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-center" />
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="Nouvelle Requête">Nouvelle</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Traitée">Traitée</SelectItem>
              <SelectItem value="Rejetée">Rejetée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="Data Request">Demande</SelectItem>
              <SelectItem value="Reclamation">Réclamation</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => onSortChange(sortOrder === "asc" ? "desc" : "asc")}>
            Trier {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Prénom</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Ministre</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((reclamation) => (
              <TableRow 
                key={reclamation._id}
                className={`${STATUS_TRANSLATIONS[reclamation.status].rowClass} cursor-pointer`}
                onClick={() => handleRowClick(reclamation)}
              >
                <TableCell>{reclamation.firstName}</TableCell>
                <TableCell>{reclamation.service || "-"}</TableCell>
                <TableCell>{reclamation.type}</TableCell>
                <TableCell>{reclamation.ministre}</TableCell>
                <TableCell>
                  <Badge className={STATUS_TRANSLATIONS[reclamation.status].color}>
                    {STATUS_TRANSLATIONS[reclamation.status].label}
                    {STATUS_TRANSLATIONS[reclamation.status].flash && (
                      <span className="ml-1 animate-pulse">●</span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(reclamation.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Requête</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" /> Utilisateur
                    </p>
                    <p>{selectedReclamation?.firstName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Type
                    </p>
                    <p>{selectedReclamation?.type}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <Landmark className="w-4 h-4" /> Ministère
                    </p>
                    <p>{selectedReclamation?.ministre}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Service
                    </p>
                    <p>{selectedReclamation?.service || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">
                    {selectedReclamation?.description}
                  </p>
                </CardContent>
              </Card>

              {selectedReclamation?.files && selectedReclamation.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <File className="w-5 h-5" />
                      Fichiers joints ({selectedReclamation?.files?.length ?? 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedReclamation?.files?.map((file, index) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
                      const isPDF = /\.pdf$/i.test(file);
                      const isDoc = /\.(doc|docx)$/i.test(file);
                      return (
                        <div 
                          key={index}
                          className="border rounded-md overflow-hidden cursor-pointer relative group"
                          onClick={() => {
                            if (isImage) {
                              setCurrentImageIndex(index);
                              setIsImageModalOpen(true);
                            } else {
                              window.open(getFileUrl(file), '_blank');
                            }
                          }}
                        >
                          {isImage ? (
                            <img
                              src={getFileUrl(file)}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white text-sm">
                              {isImage ? "View Image" : "Open File"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-4 justify-end">
            {selectedReclamation?.status !== "traitée" && selectedReclamation?.status !== "rejetée" && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setActionType("assign");
                    setIsActionDialogOpen(true);
                  }}
                >
                  Affecter à un technicien
                </Button>
                <Button 
                  onClick={() => {
                    setActionType("resolve");
                    setIsActionDialogOpen(true);
                  }}
                >
                  Marquer comme résolue
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setActionType("reject");
                    setIsActionDialogOpen(true);
                  }}
                >
                  Rejeter
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "assign" && "Affecter à un technicien"}
              {actionType === "resolve" && "Marquer comme résolue"}
              {actionType === "reject" && "Rejeter la requête"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === "assign" && (
              <div className="space-y-2">
                <p>Sélectionnez un technicien:</p>
                <Select 
                  value={selectedEmployee} 
                  onValueChange={setSelectedEmployee}
                  disabled={statusChangeLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un technicien" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem 
                        key={employee._id} 
                        value={employee._id}
                      >
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(actionType === "resolve" || actionType === "reject") && (
              <div className="space-y-2">
                <p>Feedback:</p>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    actionType === "resolve" 
                      ? "Entrez les détails de la résolution..." 
                      : "Entrez des détails supplémentaires (optionnel)..."
                  }
                  className="min-h-[120px]"
                  disabled={statusChangeLoading}
                />
              </div>
            )}

            {actionType === "reject" && (
              <div className="space-y-2">
                <p className="font-medium">Raisons de rejet: <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REJECTION_REASONS.map((reason) => (
                    <div 
                      key={reason.id}
                      className={`flex items-start space-x-2 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedRejectionReasons.includes(reason.id)
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "hover:bg-muted/50"
                      } ${statusChangeLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => {
                        if (!statusChangeLoading) {
                          setSelectedRejectionReasons(prev =>
                            prev.includes(reason.id)
                              ? prev.filter(id => id !== reason.id)
                              : [...prev, reason.id]
                          );
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRejectionReasons.includes(reason.id)}
                        disabled={statusChangeLoading}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{reason.reason}</p>
                        <p className="text-sm text-muted-foreground">
                          {reason.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button 
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
              disabled={statusChangeLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAction}
              disabled={
                statusChangeLoading ||
                (actionType === "assign" && !selectedEmployee) ||
                (actionType === "reject" && selectedRejectionReasons.length === 0)
              }
              className="min-w-[100px]"
            >
              {statusChangeLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>En cours...</span>
                </div>
              ) : (
                "Confirmer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedReclamation?.files && (
            <div className="relative">
              <img
                src={getFileUrl(selectedReclamation.files[currentImageIndex])}
                alt="Attachment"
                className="w-full max-h-[80vh] object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-4 -translate-y-1/2"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(prev => 
                    (prev - 1 + selectedReclamation.files.length) % selectedReclamation.files.length
                  );
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-4 -translate-y-1/2"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(prev => 
                    (prev + 1) % selectedReclamation.files.length
                  );
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {selectedReclamation.files.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentImageIndex === index ? "bg-primary" : "bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}