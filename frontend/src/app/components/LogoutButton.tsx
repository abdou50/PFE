"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react"; // Import the logout icon from Lucide

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("department");
    localStorage.removeItem("name");
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 bg-red-500 rounde"
      aria-label="Quittez" // Accessibility: Add a label for screen readers
    >
      <LogOut className="h-5 w-5" /> {/* Use the LogOut icon */}
    </button>
  );
}