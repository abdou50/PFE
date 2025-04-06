"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";

export default function EditReclamationPage() {
  const [firstName, setFirstName] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [type, setType] = useState<string>("Reclamation");
  const [title, setTitle] = useState<string>("");
  const [ministre, setMinistre] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchReclamation = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/reclamations/${id}`);
        const reclamation = response.data.data;
        setFirstName(reclamation.firstName);
        setDepartment(reclamation.department);
        setUserId(reclamation.userId);
        setType(reclamation.type);
        setTitle(reclamation.title);
        setMinistre(reclamation.ministre);
        setDescription(reclamation.description);
      } catch (error) {
        console.error("Failed to fetch reclamation:", error);
        toast.error("Failed to fetch reclamation. Please try again later.");
      }
    };

    fetchReclamation();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("department", department);
    formData.append("userId", userId);
    formData.append("type", type);
    formData.append("title", title);
    formData.append("ministre", ministre);
    formData.append("description", description);
    if (file) formData.append("pdf", file);

    try {
      const response = await axios.put(`http://localhost:5000/api/reclamations/${id}`, formData);
      if (response.status === 200) {
        toast.success("Reclamation updated successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error updating reclamation:", error);
      toast.error("Failed to update reclamation. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Edit Reclamation</h1>
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label>Prénom</Label>
          <Input value={firstName} readOnly />
        </div>
        
        <div className="space-y-2">
          <Label>Département</Label>
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
          <Label>Ministre</Label>
          <Input value={ministre} readOnly />
        </div>

        <div className="space-y-2">
          <Label>Titre</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Joindre un fichier (PDF, optionnel)</Label>
          <Input 
            type="file" 
            accept="application/pdf" 
            onChange={(e) => setFile(e.target.files?.[0] || null)} 
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours..." : "Envoyer"}
          </Button>
          
          <Button 
            type="button" 
            variant="secondary" 
            className="flex-1"
            onClick={() => router.push("/dashboard")}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}