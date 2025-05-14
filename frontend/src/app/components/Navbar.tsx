"use client";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu } from "lucide-react"; // Changed Search to Menu
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react"; // Added useEffect

// Add this function before the Navbar component
const translateRole = (role: string): string => {
  switch (role) {
    case "employee": return "Technicien";
    case "admin": return "Administrateur";
    case "director": return "Directeur";
    case "user": return "Utilisateur Produit";
    case "guichetier": return "Guichetier";
    default: return role;
  }
};

export function Navbar() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setUserName(localStorage.getItem("firstName") || "");
    setUserRole(translateRole(localStorage.getItem("role") || ""));
    const role = localStorage.getItem("role");
    if (role && !["admin", "director"].includes(role)) {
      setUserDepartment(localStorage.getItem("department") || "");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("department");
    localStorage.removeItem("name");
    router.push("/login");
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      {/* Left side: Only sidebar toggle */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
      >
        {isSidebarCollapsed ? (
          <Menu className="h-5 w-5 transform rotate-180" /> // Arrow pointing right
        ) : (
          <Menu className="h-5 w-5" /> // Arrow pointing left
        )}
      </button>

      {/* Right side: Theme toggle, user info, and avatar */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-end">
            <span className="font-medium">{userName}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {userRole}{userDepartment && !["admin", "director"].includes(userRole) && ` - ${userDepartment}`}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center focus:outline-none">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/assets/avatar.jpg" alt="User Avatar" />
                  <AvatarFallback>{userName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 mt-2">
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Quittez</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}