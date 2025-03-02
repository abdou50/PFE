import Link from "next/link";
import { Home, FilePlus, Calendar, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  return (
    <div className="flex flex-col h-screen w-64 border-r p-4">
      <div className="space-y-4">
        <Link href="/user-dashboard">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/user-dashboard/create-reclamation">
          <Button variant="ghost" className="w-full justify-start">
            <FilePlus className="mr-2 h-4 w-4" />
            Create Reclamation
          </Button>
        </Link>
        <Link href="/user-dashboard/schedule-meeting">
          <Button variant="ghost" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        </Link>
        <Link href="/user-dashboard/track-reclamation">
          <Button variant="ghost" className="w-full justify-start">
            <FileSearch className="mr-2 h-4 w-4" />
            Track Reclamation Status
          </Button>
        </Link>
      </div>
    </div>
  );
}