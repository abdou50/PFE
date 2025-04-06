"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Briefcase, MessageCircle, File } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Reclamation = {
  _id: string;
  title: string;
  firstName: string;
  department: string;
  type: string;
  description: string;
  files: string[];
  userId: string;
  status: "brouillant" | "envoyer" | "en attente" | "rejetée" | "traitée";
  feedback?: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_TRANSLATIONS = {
  brouillant: { label: "Brouillant", color: "bg-gray-500" },
  envoyer: { label: "Envoyée", color: "bg-blue-500" },
  "en attente": { label: "En attente", color: "bg-yellow-500" },
  rejetée: { label: "Rejetée", color: "bg-red-500" },
  traitée: { label: "Traitée", color: "bg-green-500" },
};

const TYPE_TRANSLATIONS = {
  "Data Request": "Demande de Données",
  "Reclamation": "Réclamation",
};

export default function ListeDeRequetes() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [seenReclamations, setSeenReclamations] = useState<Set<string>>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('seenReclamations');
      return new Set(saved ? JSON.parse(saved) : []);
    }
    return new Set();
  });

  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("User ID not found");
          return;
        }
  
        const queryParams = new URLSearchParams();
        if (typeFilter && typeFilter !== "all") queryParams.append("type", typeFilter);
        if (statusFilter && statusFilter !== "all") queryParams.append("status", statusFilter);
  
        const response = await fetch(
          `http://localhost:5000/api/reclamations/user/${userId}/filter?${queryParams.toString()}`
        );
  
        if (!response.ok) throw new Error("Failed to fetch reclamations");
  
        const data = await response.json();
        setReclamations(data.data);

        // Show toast for new important status changes
        data.data.forEach((rec: Reclamation) => {
          if (["en attente", "rejetée", "traitée"].includes(rec.status)) {
            if (!seenReclamations.has(rec._id)) {
              toast.info(`Nouveau statut pour "${rec.title}": ${STATUS_TRANSLATIONS[rec.status as keyof typeof STATUS_TRANSLATIONS].label}`);
            }
          }
        });
      } catch (error) {
        console.error("Error:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
  
    fetchReclamations();
  }, [typeFilter, statusFilter, seenReclamations]);

  const handleRowClick = (reclamation: Reclamation) => {
    // Mark as seen if it's a notifiable status
    if (["en attente", "rejetée", "traitée"].includes(reclamation.status)) {
      const newSeen = new Set(seenReclamations);
      newSeen.add(reclamation._id);
      setSeenReclamations(newSeen);
      localStorage.setItem('seenReclamations', JSON.stringify(Array.from(newSeen)));
    }

    setSelectedReclamation(reclamation);
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setGlobalFilter("");
    toast.info("Filtres effacés.");
  };

  const getFileUrl = (filePath: string) => {
    return `http://localhost:5000${filePath}`;
  };

  const columns = [
    {
      accessorKey: "_id",
      header: "ID",
    },
    {
      accessorKey: "title",
      header: "Object",
      cell: ({ row }: { row: any }) => {
        return row.original.title;
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: { row: any }) => {
        return TYPE_TRANSLATIONS[row.original.type as keyof typeof TYPE_TRANSLATIONS] || row.original.type;
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }: { row: any }) => {
        const status = STATUS_TRANSLATIONS[row.original.status as keyof typeof STATUS_TRANSLATIONS] || 
                      { label: row.original.status, color: "bg-gray-400" };
        return (
          <div className={`px-2 py-1 rounded-full text-white text-center ${status.color}`}>
            {status.label}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }: { row: any }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: any }) => {
        const isImportantStatus = ["en attente", "rejetée", "traitée"].includes(row.original.status);
        const isUnseen = isImportantStatus && !seenReclamations.has(row.original._id);
        
        return (
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRowClick(row.original)}
            >
              Voir détails
            </Button>
            {isUnseen && (
              <span className="absolute -top-1 -right-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: reclamations,
    columns,
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
  });

  useEffect(() => {
    table.setPageSize(5);
  }, [table]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Liste de Requêtes</h1>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Rechercher Par Object"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Reclamation">Réclamation</SelectItem>
            <SelectItem value="Data Request">Demande de Données</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="envoyer">Envoyée</SelectItem>
            <SelectItem value="en attente">En attente</SelectItem>
            <SelectItem value="rejetée">Rejetée</SelectItem>
            <SelectItem value="traitée">Traitée</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={clearFilters} variant="outline">
          Effacer
        </Button>

        <Link href="/user-dashboard/create-reclamation">
          <Button className="ml-auto">+ Nouvelle Requête</Button>
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2 text-left">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              if (row.original.status === "brouillant") return null;
              
              const isImportantStatus = ["en attente", "rejetée", "traitée"].includes(row.original.status);
              const isUnseen = isImportantStatus && !seenReclamations.has(row.original._id);
              
              return (
                <tr 
                  key={row.id} 
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer
                    ${isUnseen ? 'bg-red-50 dark:bg-red-900/20' : ''}
                  `}
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          >
            {[5, 10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={() => table.previousPage()} 
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <span className="text-sm dark:text-gray-300">
            Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
          </span>
          <Button 
            variant="outline"
            onClick={() => table.nextPage()} 
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* Reclamation Details Dialog */}
      {selectedReclamation && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl max-h-[90vh] rounded-lg overflow-auto p-6 bg-background text-foreground shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Détails de la Requête</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto">
              <DialogDescription className="space-y-4">
                {/* Username */}
                <div className="text-sm flex items-center gap-2">
                  <User size={16} />
                  <strong>Utilisateur:</strong> {selectedReclamation.firstName}
                </div>

                {/* User ID */}
                <div className="text-sm flex items-center gap-2">
                  <User size={16} />
                  <strong>ID Utilisateur:</strong> {selectedReclamation.userId}
                </div>

                {/* Reclamation ID */}
                <div className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  <strong>ID Requête:</strong> {selectedReclamation._id}
                </div>

                {/* Object */}
                <div className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  <strong>Object:</strong> {selectedReclamation.title}
                </div>

                {/* Files */}
                <div className="text-sm flex items-center gap-2">
                  <File size={16} />
                  <strong>Fichiers joints:</strong>{" "}
                  {selectedReclamation.files?.length > 0 ? (
                    <span className="ml-2 text-green-500">({selectedReclamation.files.length} fichier(s))</span>
                  ) : (
                    <span className="ml-2 text-gray-500">Aucun fichier</span>
                  )}
                </div>

                {/* Display Photos */}
                {selectedReclamation.files?.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-3 gap-4">
                      {selectedReclamation.files.map((file, index) => (
                        <div key={index} className="relative border rounded-lg overflow-hidden">
                          <img
                            src={getFileUrl(file)}
                            alt={`Fichier joint ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type */}
                <div className="text-sm flex items-center gap-2">
                  <FileText size={16} />
                  <strong>Type:</strong> {TYPE_TRANSLATIONS[selectedReclamation.type as keyof typeof TYPE_TRANSLATIONS] || selectedReclamation.type}
                </div>

                {/* Department */}
                <div className="text-sm flex items-center gap-2">
                  <Briefcase size={16} />
                  <strong>Produit Cni:</strong> {selectedReclamation.department}
                </div>

                {/* Description */}
                <div className="text-sm flex items-center gap-2">
                  <MessageCircle size={16} />
                  <strong>Description:</strong>
                  <pre className="whitespace-pre-wrap p-2 rounded-lg mt-2 bg-muted dark:bg-gray-800">
                    {selectedReclamation.description}
                  </pre>
                </div>

                {/* Feedback */}
                {selectedReclamation.feedback && (
                  <div className="text-sm flex items-center gap-2">
                    <MessageCircle size={16} />
                    <strong>Feedback:</strong>
                    <pre className="whitespace-pre-wrap p-2 rounded-lg mt-2 bg-muted dark:bg-gray-800">
                      {selectedReclamation.feedback}
                    </pre>
                  </div>
                )}

                {/* Status */}
                <div className="text-sm flex items-center gap-2">
                  <Badge className={`${STATUS_TRANSLATIONS[selectedReclamation.status as keyof typeof STATUS_TRANSLATIONS].color} text-white px-3 py-1 rounded-full`}>
                    {STATUS_TRANSLATIONS[selectedReclamation.status as keyof typeof STATUS_TRANSLATIONS].label}
                  </Badge>
                </div>
              </DialogDescription>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}