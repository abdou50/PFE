"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import ReclamationTable from "../components/ReclamationTable ";

export default function GuichetierDashboard() {
  const [reclamations, setReclamations] = useState([]);
  const [department, setDepartment] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the guichetier's department from localStorage
    const storedDepartment = localStorage.getItem("department") ?? "";
    setDepartment(storedDepartment);

    // Fetch reclamations by department
    if (storedDepartment) {
      axios
        .get(`http://localhost:5000/api/reclamations/department/${storedDepartment}`)
        .then((response) => setReclamations(response.data.data))
        .catch((error) => console.error("Error fetching reclamations:", error));
    }
  }, []);

  if (error) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Requêtes pour {department}
      </h1>
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <ReclamationTable data={reclamations} />
      )}
    </div>
  );
}