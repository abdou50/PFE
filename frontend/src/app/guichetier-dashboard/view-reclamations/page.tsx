"use client";
import { useState, useMemo } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Reclamation = {
  _id: string;
  firstName: string;
  type: string;
  ministre: string;
  status: "brouillant" | "envoyer" | "en attente" | "rejetée" | "traitée";
  createdAt: string;
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

export default function ReclamationTable({ data }: { data: Reclamation[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter data based on search term, status, and type
  const filteredData = useMemo(() => {
    return data.filter((reclamation) => {
      const matchesSearch =
        reclamation.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.ministre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reclamation.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || reclamation.status === statusFilter;
      const matchesType = typeFilter === "all" || reclamation.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [data, searchTerm, statusFilter, typeFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="p-6 space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Input
          placeholder="Rechercher par prénom, ministre ou type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-md"
        />
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_TRANSLATIONS).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="Data Request">Demande de Données</SelectItem>
              <SelectItem value="Reclamation">Réclamation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-semibold">Prénom</TableCell>
              <TableCell className="font-semibold">Type</TableCell>
              <TableCell className="font-semibold">Ministre</TableCell>
              <TableCell className="font-semibold">Statut</TableCell>
              <TableCell className="font-semibold">Date</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((reclamation) => (
              <TableRow key={reclamation._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <TableCell>{reclamation.firstName}</TableCell>
                <TableCell>{TYPE_TRANSLATIONS[reclamation.type as keyof typeof TYPE_TRANSLATIONS] || reclamation.type}</TableCell>
                <TableCell>{reclamation.ministre}</TableCell>
                <TableCell>
                  <Badge className={`${STATUS_TRANSLATIONS[reclamation.status].color} text-white px-3 py-1 rounded-full`}>
                    {STATUS_TRANSLATIONS[reclamation.status].label}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(reclamation.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-4">
          <span>Lignes par page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Précédent
          </button>
          <span className="mx-2">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}