"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, FilePlus, Calendar, FileSearch, Users, Settings, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [role, setRole] = useState<null | string>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role");
      setRole(storedRole);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-64 border-r p-4">
      <div className="space-y-4">
        <Link href="/user-dashboard">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>

        {role === "user" && (
          <>
            <Link href="/user-dashboard/create-reclamation">
              <Button variant="ghost" className="w-full justify-start">
                <FilePlus className="mr-2 h-4 w-4" />
                  Creé une Reclamtion
                </Button>
            </Link>
            <Link href="/dashboard/schedule-meeting">
              <Button variant="ghost" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Platification d'un RDV
              </Button>
            </Link>
            <Link href="/user-dashboard/track-reclamation">
              <Button variant="ghost" className="w-full justify-start">
                <FileSearch className="mr-2 h-4 w-4" />
                Suivi d'etat
              </Button>
            </Link>
          </>
        )}

        {role === "guichetier" && (
          <>
            <Link href="/guichetier-dashboard/view-reclamations">
              <Button variant="ghost" className="w-full justify-start">
                <FileSearch className="mr-2 h-4 w-4" />
                View Reclamations
              </Button>
            </Link>
            <Link href="/dashboard/manage-transactions">
              <Button variant="ghost" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Manage Transactions
              </Button>
            </Link>
          </>
        )}

        {role === "employee" && (
          <>
            <Link href="/dashboard/assign-tasks">
              <Button variant="ghost" className="w-full justify-start">
                <FilePlus className="mr-2 h-4 w-4" />
                Assign Tasks
              </Button>
            </Link>
            <Link href="/dashboard/manage-projects">
              <Button variant="ghost" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Projects
              </Button>
            </Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link href="/dashboard/manage-users">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/dashboard/system-settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
            </Link>
          </>
        )}

        {role === "director" && (
          <>
            <Link href="/dashboard/view-reports">
              <Button variant="ghost" className="w-full justify-start">
                <FileSearch className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </Link>
            <Link href="/dashboard/approve-budgets">
              <Button variant="ghost" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Approve Budgets
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
