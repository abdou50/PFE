"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function AccessDenied() {
  const router = useRouter();

  const handleGoBack = () => {
    const role = localStorage.getItem("role");
    switch (role) {
      case "user":
        router.push("/user-dashboard");
        break;
      case "guichetier":
        router.push("/guichetier-dashboard");
        break;
      case "employee":
        router.push("/employee-dashboard");
        break;
      case "admin":
        router.push("/admin-dashboard");
        break;
      case "director":
        router.push("/director-dashboard");
        break;
      default:
        router.push("/login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="text-center space-y-6">
        <XCircle className="w-20 h-20 text-destructive mx-auto" />
        <h1 className="text-4xl font-bold text-destructive">Accès Refusé</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
        <Button
          onClick={handleGoBack}
          className="bg-primary hover:bg-primary/90"
        >
          Retourner à mon tableau de bord
        </Button>
      </div>
    </div>
  );
}