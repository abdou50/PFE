"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // To detect the active route
import { Home, FilePlus, Calendar, FileSearch, Users, Settings, BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Utility for conditional class names

export function Sidebar() {
  const [role, setRole] = useState<null | string>(null);
  const [isCollapsed, setIsCollapsed] = useState(false); // State for sidebar collapse
  const pathname = usePathname(); // Get the current route

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role");
      setRole(storedRole);
    }
  }, []);

  // Function to check if a link is active
  const isActive = (href: string) => pathname === href;

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r p-4 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 p-2 rounded-full hover:bg-accent/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Menu Items */}
      <div className="space-y-1">
        {/* Liste de Requêtes */}
        <Link href="/user-dashboard">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
              isActive("/user-dashboard") && "border-primary/50 shadow-sm"
            )}
          >
            <Home className="mr-2 h-4 w-4" />
            {!isCollapsed && "Liste de Requêtes"}
          </Button>
        </Link>

        {role === "user" && (
          <>
            {/* Nouvelle Requête */}
            <Link href="/user-dashboard/create-reclamation">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/user-dashboard/create-reclamation") && "border-primary/50 shadow-sm"
                )}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                {!isCollapsed && "Nouvelle Requête"}
              </Button>
            </Link>

            {/* Mes RDV */}
            <Link href="/user-dashboard/schedule-meeting">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/user-dashboard/schedule-meeting") && "border-primary/50 shadow-sm"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {!isCollapsed && "Mes RDV"}
              </Button>
            </Link>

            {/* Requêtes en Cours */}
            <Link href="/user-dashboard/track-reclamation">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/user-dashboard/track-reclamation") && "border-primary/50 shadow-sm"
                )}
              >
                <FileSearch className="mr-2 h-4 w-4" />
                {!isCollapsed && "Requêtes en Cours"}
              </Button>
            </Link>

            {/* Guide Utilisateur */}
            <Link href="/user-dashboard/guide">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/user-dashboard/guide") && "border-primary/50 shadow-sm"
                )}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {!isCollapsed && "Guide Utilisateur"}
              </Button>
            </Link>
          </>
        )}

        {/* Other roles remain unchanged */}
        {role === "guichetier" && (
          <>
            <Link href="/guichetier-dashboard/view-reclamations">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/guichetier-dashboard/view-reclamations") && "border-primary/50 shadow-sm"
                )}
              >
                <FileSearch className="mr-2 h-4 w-4" />
                {!isCollapsed && "Voir les Réclamations"}
              </Button>
            </Link>
            <Link href="/dashboard/manage-transactions">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/dashboard/manage-transactions") && "border-primary/50 shadow-sm"
                )}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {!isCollapsed && "Gérer les Transactions"}
              </Button>
            </Link>
          </>
        )}

        {role === "employee" && (
          <>
            <Link href="/dashboard/assign-tasks">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/dashboard/assign-tasks") && "border-primary/50 shadow-sm"
                )}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                {!isCollapsed && "Assigner des Tâches"}
              </Button>
            </Link>
            <Link href="/dashboard/manage-projects">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/dashboard/manage-projects") && "border-primary/50 shadow-sm"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {!isCollapsed && "Gérer les Projets"}
              </Button>
            </Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link href="/dashboard/manage-users">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/dashboard/manage-users") && "border-primary/50 shadow-sm"
                )}
              >
                <Users className="mr-2 h-4 w-4" />
                {!isCollapsed && "Gérer les Utilisateurs"}
              </Button>
            </Link>
            <Link href="/dashboard/system-settings">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/dashboard/system-settings") && "border-primary/50 shadow-sm"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                {!isCollapsed && "Paramètres du Système"}
              </Button>
            </Link>
          </>
        )}

        {role === "director" && (
          <>
            <Link href="/dashboard/view-reports">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/dashboard/view-reports") && "border-primary/50 shadow-sm"
                )}
              >
                <FileSearch className="mr-2 h-4 w-4" />
                {!isCollapsed && "Voir les Rapports"}
              </Button>
            </Link>
            <Link href="/dashboard/approve-budgets">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                  isActive("/dashboard/approve-budgets") && "border-primary/50 shadow-sm"
                )}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {!isCollapsed && "Approuver les Budgets"}
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}