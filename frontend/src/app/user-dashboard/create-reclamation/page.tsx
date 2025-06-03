"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import ReclamationPDF from "../../components/ReclamationPDF";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Define department-specific object options
const departmentOptions = {
  Madaniya: [
    "Madaniya 1",
    "Madaniya 2",
    "Madaniya 3",
    "Madaniya 4",
  ],
  Insaf: [
    "Validation des décisions d'avancement collectif",
    "Changer le mot de passe",
    "Ajouter une procédure ou Ajouter une action",
    "Annulation d'une décision d'absence injustifiée"
  ],
  Rached: [
    "Demande de formation",
    "Signalement technique",
    "Demande d'équipement",
    "Problème de réseau"
  ]
};

export default function CreateReclamationPage() {
  const [firstName, setFirstName] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [type, setType] = useState<string>("Reclamation");
  const [service, setService] = useState<string>("");
  const [title, setTitle] = useState<{ text: string; type: string }>({ text: "", type: "" });
  const [ministre, setMinistre] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiDetails, setAiDetails] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [actionType, setActionType] = useState<"envoyer" | "brouillant">("envoyer");
  const [objectOptions, setObjectOptions] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedService = localStorage.getItem("service");
      const storedDepartment = localStorage.getItem("department") || "";
      
      if (!storedService) {
        toast.error("Service information is missing. Please log in again.");
      }

      setFirstName(localStorage.getItem("firstName") || "");
      setDepartment(storedDepartment);
      setUserId(localStorage.getItem("userId") || "");
      setMinistre(localStorage.getItem("ministre") || "");
      setService(storedService || "");

      if (storedDepartment && departmentOptions[storedDepartment as keyof typeof departmentOptions]) {
        setObjectOptions(departmentOptions[storedDepartment as keyof typeof departmentOptions]);
      }
    }
  }, []);

  useEffect(() => {
    if (department && departmentOptions[department as keyof typeof departmentOptions]) {
      setObjectOptions(departmentOptions[department as keyof typeof departmentOptions]);
      setTitle({ text: "", type: "" }); 
    }
  }, [department]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(file => 
        ["application/pdf", "image/jpeg", "image/png", "image/gif"].includes(file.type)
      );
      if (files.length > 0) {
        setFile(files);
      } else {
        toast.error("Types autorisés : PDF, JPEG, PNG, GIF.");
      }
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

  // Handle AI-generated description
  const generateDescriptionWithAI = async () => {
    if (!title.text) {
      toast.error("Veuillez d'abord entrer un titre.");
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `Rédige un texte descriptif pour une ${type}
                     
                    Le texte doit être court et concis, et doit inclure les informations suivantes :
                    le nom ${firstName}. lieu de travail la ministére de ${ministre}.
                    Titre: ${title.text}. 
                    Détails supplémentaires: ${aiDetails}. 
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
      typeText(generatedDescription, setDescription);
      toast.success("Description générée avec succès !");
    } catch (error) {
      console.error("Error generating description:", error);
      toast.error("Erreur lors de la génération de la description.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!userId) {
      toast.error("Utilisateur non trouvé. Veuillez vous reconnecter.");
      setIsSubmitting(false);
      return;
    }

    if (!title.text || !description) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("department", department);
    formData.append("userId", userId);
    formData.append("type", type);
    formData.append("title", title.text);
    formData.append("service", service);
    formData.append("titleType", title.type);
    formData.append("ministre", ministre);
    formData.append("description", description);
    formData.append("status", actionType);

    file.forEach((f) => {
      formData.append("files", f);
    });

    try {
      const response = await fetch("http://localhost:5000/api/reclamations", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Réclamation créée avec succès !");
        setTitle({ text: "", type: "" });
        setDescription("");
        setFile([]);

        setIsConfirmationOpen(true);
      } else {
        const errorMsg = await response.text();
        toast.error(`Erreur: ${errorMsg}`);
      }
    } catch (error) {
      toast.error("Erreur réseau. Veuillez réessayer plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLocally = async () => {
    if (!title.text || !description) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("department", department);
    formData.append("userId", userId);
    formData.append("type", type);
    formData.append("title", title.text);
    formData.append("service", service); 
    formData.append("titleType", title.type);
    formData.append("ministre", ministre);
    formData.append("description", description);
    formData.append("status", "brouillant");

    file.forEach((f) => {
      formData.append("files", f);
    });

    try {
      const response = await fetch("http://localhost:5000/api/reclamations", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Réclamation enregistrée avec succès !");
        setIsConfirmationOpen(true);
      } else {
        const errorMsg = await response.text();
        toast.error(`Erreur: ${errorMsg}`);
      }
    } catch (error) {
      toast.error("Erreur réseau. Veuillez réessayer plus tard.");
    }
  };

  const handleCancel = () => {
    setTitle({ text: "", type: "" });
    setDescription("");
    setFile([]);
    toast.success("Formulaire annulé.");
  };

  const handleDownloadPDF = async () => {
    const pdfBlob = await pdf(
      <ReclamationPDF
        firstName={firstName}
        department={department}
        type={type}
        ministre={ministre}
        description={description}
      />
    ).toBlob();

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reclamation.pdf";
    link.click();
    URL.revokeObjectURL(url);

    setIsConfirmationOpen(false);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Créer une Requêtes</h1>
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label>Prénom</Label>
          <Input value={firstName} readOnly />
        </div>
        
        <div className="space-y-2">
          <Label>Produit Cni</Label>
          <Input value={department} readOnly />
        </div>

        <div className="space-y-2">
          <Label>Type de réclamation</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded bg-background text-foreground"
          >
            <option value="Reclamation">Réclamation</option>
            <option value="Data Request">Demande de Données</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Ministère</Label>
          <Input value={ministre} readOnly />
        </div>
        
        <div className="space-y-2">
          <Label>Service</Label>
          <Input value={service} readOnly />
        </div>
        
        <div className="space-y-2">
          <Label>Object</Label>
          <select
            value={title.text}
            onChange={(e) => setTitle({ ...title, text: e.target.value })}
            className="w-full p-2 border rounded bg-background text-foreground"
            required
          >
            <option value="">Sélectionnez un objet</option>
            {objectOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          {useAI ? (
            <div className="space-y-2">
              <div className="space-y-2">
                <Label>Mots-clés pour l'IA</Label>
                <Textarea
                  value={aiDetails}
                  onChange={(e) => setAiDetails(e.target.value)}
                  placeholder="Entrez des mots-clés pour guider l'IA (ex: problème de transport, retard, surcharge)."
                  className="min-h-[80px]"
                />
              </div>
              <Button
                type="button"
                onClick={generateDescriptionWithAI}
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? "Génération en cours..." : "Générer la description avec l'IA"}
              </Button>
              {isGenerating && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              )}
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="min-h-[120px]"
              />
            </div>
          ) : (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[120px]"
            />
          )}
        </div>
        
        <div className="space-y-2">
          <Label>Joindre un fichier (PDF ou image, optionnel)</Label>
          <Input 
            type="file" 
            accept="application/pdf, image/*" 
            multiple
            onChange={handleFileChange} 
          />
        </div>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={isSubmitting}
            onClick={() => setActionType("envoyer")}
          >
            {isSubmitting ? "Envoi en cours..." : "Envoyer"}
          </Button>
          
          <Button 
            type="button" 
            variant="secondary" 
            className="flex-1"
            onClick={() => {
              setActionType("brouillant");
              handleSaveLocally();
            }}
          >
            Enregistrer
          </Button>

          <Button 
            type="button" 
            variant="destructive" 
            className="flex-1"
            onClick={handleCancel}
          >
            Annuler
          </Button>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant={useAI ? "default" : "outline"}
            onClick={() => setUseAI(!useAI)}
          >
            {useAI ? "Écrire la description moi-même" : "Utiliser l'IA pour générer la description"}
          </Button>
        </div>
      </form>

      <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Télécharger le PDF</DialogTitle>
            <DialogDescription>
              Voulez-vous télécharger un PDF de cette réclamation ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsConfirmationOpen(false)} variant="secondary">
              Non
            </Button>
            <Button onClick={handleDownloadPDF}>Oui, télécharger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}