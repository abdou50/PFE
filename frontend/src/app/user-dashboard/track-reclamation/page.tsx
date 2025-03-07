"use client";
import { useEffect, useState } from "react";
import { ReclamationCard } from "../../components/ReclamationCard";
import axios from "axios";
import dayjs from "dayjs"; // Import dayjs for date formatting

interface Reclamation {
  _id: string;
  firstName: string;
  department: string;
  type: string;
  ministre: string;
  description: string;
  status: "pending" | "accepted" | "rejected" | "resolved";
  feedback?: string;
  pdf?: string;
  createdAt: string; // ✅ Added createdAt field
}

export default function Dashboard() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
          throw new Error("User ID not found in localStorage");
        }

        console.log("Fetching reclamations for user ID:", userId);

        const response = await axios.get(`http://localhost:5000/api/reclamations/user/${userId}`);
        console.log("Reclamations fetched successfully:", response.data);
        setReclamations(response.data.data);
      } catch (error) {
        console.error("Failed to fetch reclamations:", error);
        setError("Failed to fetch reclamations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReclamations();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Your Reclamations</h1>
      
      {/* ✅ Grid layout to display two cards per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
        {reclamations.length > 0 ? (
          reclamations.map((reclamation) => (
            <ReclamationCard
              key={reclamation._id}
              firstName={reclamation.firstName}
              department={reclamation.department}
              type={reclamation.type}
              ministre={reclamation.ministre}
              description={reclamation.description}
              status={reclamation.status}
              feedback={reclamation.feedback}
              hasPdf={Boolean(reclamation.pdf)}
              createdAt={dayjs(reclamation.createdAt).format("DD/MM/YYYY HH:mm")} // ✅ Format date
            />
          ))
        ) : (
          <p className="text-white">No reclamations found.</p>
        )}
      </div>
    </div>
  );
}
