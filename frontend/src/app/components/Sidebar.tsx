"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, FilePlus, Calendar, FileSearch, Users, Settings, BookOpen, Menu, PieChart, Building, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [role, setRole] = useState<null | string>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role");
      setRole(storedRole);
      // Get stored sidebar state
      const storedSidebarState = localStorage.getItem("sidebarCollapsed");
      setIsCollapsed(storedSidebarState === "true");
    }
  }, []);

  const isActive = (href: string) => pathname === href;

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-3 py-4 border-b">
        <div className="flex items-center">
          <Image
            src="/assets/csi.png"
            alt="CSI Logo"
            width={50}
            height={50}
            className="rounded-md object-contain"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 rounded-full hover:bg-accent/50 transition-colors"
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-2">
          {role === "user" && (
            <>
              <Link href="/user-dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg",
                    "hover:bg-accent/50 transition-colors",
                    "border border-transparent",
                    isActive("/user-dashboard") && "bg-accent/50 border-accent"
                  )}
                >
                  <Home className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="ml-3">Liste de Requêtes</span>}
                </Button>
              </Link>
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

          {role === "guichetier" && (
            <>
              <Link href="/guichetier-dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/guichetier-dashboard") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Tableau de Bord"}
                </Button>
              </Link>
              <Link href="/guichetier-dashboard/manage-appointments">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/guichetier-dashboard/manage-appointments") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Gestion des RDV"}
                </Button>
              </Link>
            </>
          )}

          {role === "employee" && (
            <>
              <Link href="/employee-dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/employee-dashboard") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Tableau de Bord"}
                </Button>
              </Link>
              <Link href="/employee-dashboard/manage-appointments">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/employee-dashboard/manage-appointments") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Gestion des RDV"}
                </Button>
              </Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link href="/admin-dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/admin-dashboard") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Tableau de Bord"}
                </Button>
              </Link>
              <Link href="/admin-dashboard/departments">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/admin-dashboard/departments") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Building className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Liste des Reclamations"}
                </Button>
              </Link>
              <Link href="/admin-dashboard/manage-users">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/admin-dashboard/manage-users") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Gestion Utilisateurs"}
                </Button>
              </Link>
            </>
          )}

          {role === "director" && (
            <>
              <Link href="/director-dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/director-dashboard") && "border-primary/50 shadow-sm"
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Tableau de Bord"}
                </Button>
              </Link>
              <Link href="/director-dashboard/reports">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/director-dashboard/reports") && "border-primary/50 shadow-sm"
                  )}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Rapports"}
                </Button>
              </Link>
              <Link href="/director-dashboard/stats">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start rounded-lg border border-transparent hover:border-primary/50 transition-all duration-200",
                    isActive("/director-dashboard/stats") && "border-primary/50 shadow-sm"
                  )}
                >
                  <PieChart className="mr-2 h-4 w-4" />
                  {!isCollapsed && "Statistiques"}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start rounded-lg",
            "hover:bg-accent/50 transition-colors"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="ml-3">Paramètres</span>}
        </Button>
      </div>
    </div>
  );
}