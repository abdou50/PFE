"use client";
import { useEffect, useState } from "react";
import { ReclamationCard } from "../../components/ReclamationCard";
import axios from "axios";
import { toast } from "sonner"; // J'utilise sonner pour des toasts plus modernes
import { Button } from "@/components/ui/button";

interface Reclamation {
  _id: string;
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
}

export default function PageBrouillons() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReclamations = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("ID utilisateur introuvable");

      const response = await axios.get(`http://localhost:5000/api/reclamations/user/${userId}`);
      const formattedData = response.data.data.map((rec: any) => ({
        ...rec,
        status: rec.status === "pending" ? "brouillant" : rec.status, // Adaptation du statut
        files: rec.files || [],
      }));
      setReclamations(formattedData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setError("Erreur lors du chargement des réclamations");
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReclamations();
  }, []);

  const handleEdit = async (id: string, updatedData: any) => {
    try {
      const formData = new FormData();
      formData.append("title", updatedData.title);
      formData.append("description", updatedData.description);
      
      if (updatedData.filesToDelete) {
        formData.append("filesToDelete", JSON.stringify(updatedData.filesToDelete));
      }
  
      if (updatedData.newFiles) {
        updatedData.newFiles.forEach((file: File) => formData.append("files", file));
      }

      await axios.put(
        `http://localhost:5000/api/reclamations/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      
      toast.success("Réclamation mise à jour");
      fetchReclamations(); // Rafraîchit la liste
    } catch (error) {
      console.error("Erreur de mise à jour:", error);
      toast.error("Échec de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/reclamations/${id}`);
      toast.success("Réclamation supprimée");
      fetchReclamations(); // Rafraîchit la liste après suppression
    } catch (error) {
      console.error("Erreur de suppression:", error);
      toast.error("Échec de la suppression");
    }
  };

  if (loading) return <div className="text-center py-8">Chargement...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  // Filtre pour n'afficher que les brouillons
  const brouillons = reclamations.filter(
    reclamation => reclamation.status === "brouillant"
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Mes brouillons</h1>
      
      {brouillons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun brouillon trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brouillons.map((reclamation) => (
            <ReclamationCard
              key={reclamation._id}
              id={reclamation._id}
              title={reclamation.title}
              firstName={reclamation.firstName}
              department={reclamation.department}
              type={reclamation.type}
              ministre={reclamation.ministre}
              description={reclamation.description}
              status={reclamation.status}
              feedback={reclamation.feedback}
              files={reclamation.files}
              createdAt={reclamation.createdAt}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}