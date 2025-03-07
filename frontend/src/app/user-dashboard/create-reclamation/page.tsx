"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "react-hot-toast";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import ReclamationPDF from "../../components/ReclamationPDF";

export default function CreateReclamationPage() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [type, setType] = useState<string>(() => localStorage.getItem("type") || "Reclamation");
  const [ministre, setMinistre] = useState<string>(() => localStorage.getItem("ministre") || "");
  const [description, setDescription] = useState<string>(() => localStorage.getItem("description") || "");
  const [file, setFile] = useState<File | null>(null);
  const [isClient, setIsClient] = useState(false);

  // ✅ Load user data from localStorage
  useEffect(() => {
    setIsClient(true);
    const storedFirstName = localStorage.getItem("firstName");
    const storedDepartment = localStorage.getItem("department");
    const storedUserId = localStorage.getItem("userId");

    console.log("📥 Retrieved from LocalStorage:");
    console.log("First Name:", storedFirstName);
    console.log("Department:", storedDepartment);
    console.log("User ID:", storedUserId);

    setFirstName(storedFirstName);
    setDepartment(storedDepartment);
    setUserId(storedUserId);
  }, []);

  // ✅ Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("type", type);
  }, [type]);

  useEffect(() => {
    localStorage.setItem("ministre", ministre);
  }, [ministre]);

  useEffect(() => {
    localStorage.setItem("description", description);
  }, [description]);

  // ✅ Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Utilisateur non trouvé. Veuillez vous reconnecter.");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName || "");
    formData.append("department", department || "");
    formData.append("userId", userId || ""); // Ensure userId is included
    formData.append("type", type);
    formData.append("ministre", ministre);
    formData.append("description", description);
    if (file) formData.append("pdf", file);

    console.log("📤 Form data being sent:", {
      firstName,
      department,
      userId,
      type,
      ministre,
      description,
      file: file ? file.name : "No file",
    }); // Debugging

    try {
      const response = await fetch("http://localhost:5000/api/reclamations", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Réclamation créée avec succès !");
        // Clear form fields after successful submission
        setMinistre("");
        setDescription("");
        setFile(null);
        // Clear localStorage after successful submission
        localStorage.removeItem("type");
        localStorage.removeItem("ministre");
        localStorage.removeItem("description");
      } else {
        const errorMsg = await response.text();
        toast.error(`Erreur: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Erreur réseau");
    }
  };

  // ✅ Handle PDF download manually
  const handleDownloadPDF = async () => {
    const blob = await pdf(
      <ReclamationPDF
        firstName={firstName || ""}
        department={department || ""}
        type={type}
        ministre={ministre}
        description={description}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reclamation.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">Créer une Réclamation</h1>
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-2">
          <Label>Prénom</Label>
          <Input value={firstName || ""} readOnly />
        </div>
        <div className="space-y-2">
          <Label>Département</Label>
          <Input value={department || ""} readOnly />
        </div>
        <div className="space-y-2">
          <Label>Type de réclamation</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="Reclamation">Réclamation</option>
            <option value="Data Request">Demande de Données</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Ministre</Label>
          <Input
            value={ministre}
            onChange={(e) => setMinistre(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Joindre un fichier (Optionnel)</Label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
        </div>
        <Button
          type="submit"
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Créer une Réclamation
        </Button>

        {isClient && (
          <div className="mt-6">
            <Button
              onClick={handleDownloadPDF}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Télécharger le PDF
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}