import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, ChevronLeft, ChevronRight, Trash, X, Save, Send, File, User, Briefcase, Calendar, MessageCircle, FileText, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { Label } from "@radix-ui/react-label";
import { toast, Toaster } from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal.mixin({
  customClass: {
    popup: '!bg-background !text-foreground !border !border-border !rounded-lg !shadow-lg',
    title: '!text-foreground !text-lg !font-semibold !mb-3',
    htmlContainer: '!text-muted-foreground !text-sm',
    confirmButton: '!bg-primary hover:!bg-primary/90 !text-primary-foreground !rounded-md !px-4 !py-2 !text-sm',
    cancelButton: '!bg-muted hover:!bg-muted/80 !text-muted-foreground !rounded-md !px-4 !py-2 !text-sm',
    actions: '!gap-3 !mt-4',
  },
  buttonsStyling: false,
  backdrop: `
    rgba(0, 0, 0, 0.4)
    left top
    no-repeat
  `,
}));

interface ReclamationCardProps {
  title: string;
  firstName: string;
  department: string;
  type: string;
  ministre: string;
  description: string;
  status: "brouillant" | "envoyer" | "en attente" | "rejetée" | "traitée";
  feedback?: string;
  files?: string[];
  createdAt: string;
  sentAt?: string;
  onEdit: (id: string, updatedData: any) => void;
  onDelete: (id: string) => Promise<void>;
  id: string;
  isUpdated?: boolean;
  onRefresh?: () => void;
}

export function ReclamationCard({
  title,
  firstName,
  department,
  type,
  ministre,
  description,
  status,
  feedback,
  files = [],
  createdAt,
  sentAt,
  onEdit,
  onDelete,
  id,
  isUpdated = false,
  onRefresh,
}: ReclamationCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedDescription, setEditedDescription] = useState(description);
  const [editedFiles, setEditedFiles] = useState<File[] | null>(null);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setEditedTitle(title);
    setEditedDescription(description);
  }, [title, description]);

  const badgeColor = {
    brouillant: "bg-gray-500",
    envoyer: "bg-blue-500",
    "en attente": "bg-yellow-500",
    rejetée: "bg-red-500",
    traitée: "bg-green-500",
  }[status];

  const statusText = {
    brouillant: "Brouillant",
    envoyer: "Envoyée",
    "en attente": "En attente",
    rejetée: "Rejetée",
    traitée: "Traitée",
  }[status];

  const getFileUrl = (filePath: string) => {
    return `http://localhost:5000${filePath}`;
  };

  const displayType = type === "Data Request" ? "Demande de Données" : "Réclamation";

  const handleCardClick = () => {
    if (isUpdated) {
      setHasBeenClicked(true);
    }
    setIsDetailsOpen(true);
  };

  const handleDelete = async () => {
    const result = await MySwal.fire({
      title: 'Supprimer la réclamation',
      html: `
        <div class="text-left space-y-3">
          <div class="flex items-center gap-2 text-muted-foreground">
            <svg class="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>Cette action est irréversible</span>
          </div>
          <p>Voulez-vous vraiment supprimer cette réclamation ?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      icon: 'warning',
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        await onDelete(id);
        toast.success("Réclamation supprimée avec succès");
        if (onRefresh) onRefresh();
      } catch (error) {
        toast.error("Échec de la suppression");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSend = async () => {
    const result = await MySwal.fire({
      title: 'Confirmer l\'envoi',
      html: `
        <div class="text-left space-y-3">
          <div class="flex items-center gap-2 text-muted-foreground">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <span>Cette réclamation sera envoyée au ministère</span>
          </div>
          <p>Confirmez-vous l'envoi définitif ?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Envoyer',
      cancelButtonText: 'Annuler',
      icon: 'question',
    });

    if (!result.isConfirmed) return;

    setIsSending(true);
    const loadingToastId = toast.loading("Envoi en cours...");

    try {
      const response = await axios.put(`http://localhost:5000/api/reclamations/${id}/status`, {
        status: "envoyer",
      });

      if (response.status === 200) {
        onEdit(id, {
          title: editedTitle,
          description: editedDescription,
          status: "envoyer",
          sentAt: new Date().toISOString(),
        });

        toast.dismiss(loadingToastId);
        toast.success("Réclamation envoyée avec succès");
        setIsDetailsOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error("Échec de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedDescription.trim()) {
      toast.error("Le titre et la description sont obligatoires");
      return;
    }

    const formData = new FormData();
    formData.append("title", editedTitle);
    formData.append("description", editedDescription);

    if (editedFiles) {
      editedFiles.forEach((file) => formData.append("files", file));
    }

    formData.append("filesToDelete", JSON.stringify(filesToDelete));

    const loadingToastId = toast.loading("Enregistrement en cours...");

    try {
      const response = await axios.put(`http://localhost:5000/api/reclamations/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        const updatedFiles = response.data.data.files || [];
        onEdit(id, {
          title: editedTitle,
          description: editedDescription,
          files: updatedFiles,
        });

        setIsEditing(false);
        setIsDetailsOpen(false);
        setFilesToDelete([]);
        setEditedFiles(null);

        toast.dismiss(loadingToastId);
        toast.success("Modifications enregistrées");
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error updating reclamation:", error);
      toast.dismiss(loadingToastId);
      toast.error("Échec de la mise à jour");
    }
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setEditedDescription(description);
    setEditedFiles(null);
    setFilesToDelete([]);
    setIsEditing(false);
    setIsDetailsOpen(false);
  };

  const handleFileDeleteToggle = (file: string) => {
    setFilesToDelete((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % files.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const handleImageDelete = async (index: number) => {
    if (!files.length) return;
    const fileUrl = files[index];

    setIsDeletingImage(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/reclamations/${id}`,
        { filesToDelete: JSON.stringify([fileUrl]) },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        onEdit(id, { files: response.data.data.files });
        toast.success("Fichier supprimé");
        setIsImageModalOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Échec de la suppression");
    } finally {
      setIsDeletingImage(false);
    }
  };

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))'
          }
        }}
      />
      <Card
        className={`w-full max-w-md shadow-md border rounded-lg p-4 ${
          isUpdated && !hasBeenClicked ? "border-red-500 animate-pulse" : "border-border"
        }`}
      >
        <CardHeader className="flex justify-between items-center p-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm">{firstName} - {department}</CardDescription>
          </div>
          {isUpdated && !hasBeenClicked && (
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </CardHeader>
        <CardContent className="p-0 space-y-2">
          <div className="text-sm flex items-center gap-2">
            <FileText size={16} className="min-w-4" />
            <span><strong>Type:</strong> {displayType}</span>
          </div>
          <div className="text-sm flex items-center gap-2">
            <Landmark size={16} className="min-w-4" />
            <span><strong>Ministère:</strong> {ministre}</span>
          </div>
          <div className="text-sm flex items-center gap-2">
            <Calendar size={16} className="min-w-4" />
            <span><strong>Créée le:</strong> {new Date(createdAt).toLocaleDateString()}</span>
          </div>
          {sentAt && (
            <div className="text-sm flex items-center gap-2">
              <Calendar size={16} className="min-w-4" />
              <span><strong>Envoyée le:</strong> {new Date(sentAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className="text-sm flex items-center gap-2">
            <File size={16} className="min-w-4" />
            <span><strong>Fichiers:</strong> {files.length || "Aucun"}</span>
          </div>
        </CardContent>
        <CardFooter className="p-0 pt-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleCardClick}>
              <Eye size={16} />
            </Button>
            {status === "brouillant" && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Edit size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSend}
                  disabled={isSending}
                >
                  <Send size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash size={16} />
                </Button>
              </>
            )}
          </div>
          <Badge className={`${badgeColor} text-white px-3 py-1 rounded-full text-xs`}>
            {statusText}
          </Badge>
        </CardFooter>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Réclamation</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <FileText size={16} /> Objet:
                </strong>
                <p className="mt-1 ml-6">{editedTitle}</p>
              </div>
              
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <User size={16} /> Prénom:
                </strong>
                <p className="mt-1 ml-6">{firstName}</p>
              </div>
              
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <Briefcase size={16} /> Département:
                </strong>
                <p className="mt-1 ml-6">{department}</p>
              </div>
              
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <FileText size={16} /> Type:
                </strong>
                <p className="mt-1 ml-6">{displayType}</p>
              </div>
              
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <Landmark size={16} /> Ministère:
                </strong>
                <p className="mt-1 ml-6">{ministre}</p>
              </div>
              
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <MessageCircle size={16} /> Description:
                </strong>
                <pre className="whitespace-pre-wrap p-2 rounded-lg mt-2 bg-muted ml-6">
                  {editedDescription}
                </pre>
              </div>
              
              {feedback && (
                <div className="text-sm">
                  <strong className="flex items-center gap-2">
                    <MessageCircle size={16} /> Feedback:
                  </strong>
                  <p className="mt-1 ml-6">{feedback}</p>
                </div>
              )}
              
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <Calendar size={16} /> Créée le:
                </strong>
                <p className="mt-1 ml-6">{new Date(createdAt).toLocaleDateString()}</p>
              </div>
              
              {sentAt && (
                <div className="text-sm">
                  <strong className="flex items-center gap-2">
                    <Calendar size={16} /> Envoyée le:
                  </strong>
                  <p className="mt-1 ml-6">{new Date(sentAt).toLocaleDateString()}</p>
                </div>
              )}
              
              <div className="text-sm">
                <strong className="flex items-center gap-2">
                  <File size={16} /> Fichiers joints:
                </strong>
                <p className="mt-1 ml-6">
                  {files.length > 0 ? `${files.length} fichier(s)` : "Aucun fichier"}
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <div className="relative w-full h-64">
                    {files[currentImageIndex].endsWith(".pdf") ? (
                      <iframe
                        src={getFileUrl(files[currentImageIndex])}
                        className="w-full h-full rounded-lg bg-muted"
                        title={`Fichier joint ${currentImageIndex + 1}`}
                      />
                    ) : (
                      <img
                        src={getFileUrl(files[currentImageIndex])}
                        alt="Fichier attaché"
                        className="w-full h-full rounded-lg object-cover bg-muted cursor-pointer"
                        onClick={() => handleImageClick(currentImageIndex)}
                      />
                    )}
                    {files.length > 1 && (
                      <>
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
                      </>
                    )}
                  </div>
                  {files.length > 1 && (
                    <div className="flex justify-center mt-2">
                      {files.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full mx-1 transition-all duration-300 ${
                            currentImageIndex === index
                              ? "bg-primary scale-150"
                              : "bg-muted-foreground hover:scale-125"
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative w-full h-[80vh]">
            {files.length > 0 && (
              <>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 z-10"
                  onClick={() => handleImageDelete(currentImageIndex)}
                  disabled={isDeletingImage}
                >
                  <Trash size={18} />
                </Button>
                {files[currentImageIndex].endsWith(".pdf") ? (
                  <iframe
                    src={getFileUrl(files[currentImageIndex])}
                    className="w-full h-full"
                    title={`Fichier joint ${currentImageIndex + 1}`}
                  />
                ) : (
                  <img
                    src={getFileUrl(files[currentImageIndex])}
                    alt={`Fichier joint ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain bg-muted"
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Réclamation</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Nouveaux fichiers (PDF/image)</Label>
                <Input
                  type="file"
                  accept="application/pdf, image/*"
                  multiple
                  onChange={(e) => setEditedFiles(Array.from(e.target.files || []))}
                />
              </div>
              
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Fichiers existants</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className={`relative border rounded-lg overflow-hidden transition-all ${
                          filesToDelete.includes(file)
                            ? "opacity-50 border-destructive scale-95"
                            : "border-border"
                        }`}
                      >
                        {file.endsWith(".pdf") ? (
                          <div className="flex flex-col items-center justify-center p-4 bg-muted h-32">
                            <FileText size={24} className="mb-2" />
                            <span className="text-sm">Document PDF</span>
                          </div>
                        ) : (
                          <div className="relative w-full h-32">
                            <img
                              src={getFileUrl(file)}
                              alt={`Fichier joint ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Button
                          variant={filesToDelete.includes(file) ? "default" : "destructive"}
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => handleFileDeleteToggle(file)}
                        >
                          {filesToDelete.includes(file) ? (
                            <X size={14} />
                          ) : (
                            <Trash size={14} />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-4 mt-4">
            <Button onClick={handleCancel} variant="outline">
              <X size={16} className="mr-2" /> Annuler
            </Button>
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" /> Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}