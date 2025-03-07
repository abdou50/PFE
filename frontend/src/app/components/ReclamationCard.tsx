import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ReclamationCardProps {
  firstName: string;
  department: string;
  type: string;
  ministre: string;
  description: string;
  status: "pending" | "accepted" | "rejected" | "resolved";
  feedback?: string;
  hasPdf: boolean;
  createdAt: string;
}

export function ReclamationCard({
  firstName,
  department,
  type,
  ministre,
  description,
  status,
  feedback,
  hasPdf,
  createdAt,
}: ReclamationCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine badge color based on status
  const badgeColor =
    status === "pending"
      ? "bg-orange-500"
      : status === "accepted"
      ? "bg-blue-500"
      : status === "rejected"
      ? "bg-red-500"
      : "bg-green-500";

  return (
    <>
      <Card className="w-full max-w-lg shadow-md border border-border rounded-lg p-4 bg-background text-foreground">
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold">{firstName}</CardTitle>
            <CardDescription>{department}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm"><strong>Type:</strong> {type}</p>
          <p className="text-sm"><strong>Ministre:</strong> {ministre}</p>
          <p className="text-sm"><strong>Créé le:</strong> {createdAt}</p>
          <p className="text-sm"><strong>PDF fourni:</strong> {hasPdf ? "Oui" : "Non"}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <Button onClick={() => setIsOpen(true)} variant="outline" className="flex items-center">
            <Eye size={16} className="mr-2" /> Voir les détails
          </Button>
          <Badge className={`${badgeColor} text-white px-3 py-1 rounded-full`}>{status}</Badge>
        </CardFooter>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl p-6 bg-background text-foreground rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Détails de la Réclamation</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p className="text-sm"><strong>Prénom:</strong> {firstName}</p>
            <p className="text-sm"><strong>Département:</strong> {department}</p>
            <p className="text-sm"><strong>Type:</strong> {type}</p>
            <p className="text-sm"><strong>Ministre:</strong> {ministre}</p>
            <p className="text-sm"><strong>Description:</strong> {description}</p>
            {feedback && <p className="text-sm"><strong>Feedback:</strong> {feedback}</p>}
            <p className="text-sm"><strong>Créé le:</strong> {createdAt}</p>
            <p className="text-sm"><strong>PDF fourni:</strong> {hasPdf ? "Oui" : "Non"}</p>
            <p className="text-sm font-semibold mt-2">Statut:</p>
            <Badge className={`${badgeColor} text-white px-3 py-1 rounded-full`}>{status}</Badge>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
