"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import ReclamationTable from "../components/ReclamationTable ";

export default function GuichetierDashboard() {
  const [reclamations, setReclamations] = useState([]);
  const [department, setDepartment] = useState<string>("");

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Requêtes  pour {department}</h1>
      <ReclamationTable data={reclamations} />
    </div>
  );
}