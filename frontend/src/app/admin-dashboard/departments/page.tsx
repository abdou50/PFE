'use client';
import { useState, useEffect, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reclamation {
  _id: string;
  title: string;
  status: 'traitée' | 'en attente' | 'rejetée';
  department: string;
  createdAt: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  employeeId?: {
    firstName: string;
    lastName: string;
  };
  guichetierId?: {
    firstName: string;
    lastName: string;
  };
  files: string[];
}

const PRODUITS_CNI = [
  { 
    name: 'Madaniya', 
    value: 'Madaniya', 
    color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800' 
  },
  { 
    name: 'Insaf', 
    value: 'Insaf', 
    color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-800' 
  },
  { 
    name: 'Rached', 
    value: 'Rached', 
    color: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 border-amber-200 dark:border-amber-800' 
  },
];

const ITEMS_PER_PAGE = 10;

export default function ReclamationsTable() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [produitFilter, setProduitFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/reclamations/all');
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Response is not JSON");
        }

        const data = await response.json();
        setReclamations(data.data || []);
      } catch (error) {
        console.error('Error fetching reclamations:', error);
        setReclamations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReclamations();
  }, []);

  // Update the filter logic in the filteredReclamations
  // First, move the statusBadgeColors definition before the filteredReclamations
  const statusBadgeColors = {
    'traitée': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800',
    'en attente': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800',
    'rejetée': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200 dark:border-red-800'
  };
  
  const filteredReclamations = reclamations.filter(rec => {
    const matchesSearch = rec.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       rec.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       rec.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    const matchesProduit = produitFilter === 'all' || rec.department === produitFilter;
    
    return matchesSearch && matchesStatus && matchesProduit;
  });
  
  // Remove the standalone Select component and keep only the one in the return statement
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filtrer par statut" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Tous statuts</SelectItem>
      <SelectItem value="traitée">
        <Badge className={cn("capitalize", statusBadgeColors['traitée'])}>
          Traitée
        </Badge>
      </SelectItem>
      <SelectItem value="en attente">
        <Badge className={cn("capitalize", statusBadgeColors['en attente'])}>
          En attente
        </Badge>
      </SelectItem>
      <SelectItem value="rejetée">
        <Badge className={cn("capitalize", statusBadgeColors['rejetée'])}>
          Rejetée
        </Badge>
      </SelectItem>
    </SelectContent>
  </Select>

  // Pagination logic
  const totalPages = Math.ceil(filteredReclamations.length / ITEMS_PER_PAGE);
  const paginatedReclamations = filteredReclamations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const produitCounts = PRODUITS_CNI.map(produit => ({
    ...produit,
    count: reclamations.filter(rec => rec.department === produit.value).length
  }));

  const downloadFile = (fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileUrl.split('/').pop() || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Réclamations</h1>
          <p className="text-sm text-muted-foreground">
            Suivi et gestion des réclamations par produit CNI
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Input
            placeholder="Rechercher par titre ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut">
                {statusFilter === 'all' ? 'Tous statuts' : (
                  <Badge className={cn("capitalize", statusBadgeColors[statusFilter as keyof typeof statusBadgeColors])}>
                    {statusFilter}
                  </Badge>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="traitée">
                <Badge className={cn("capitalize", statusBadgeColors['traitée'])}>
                  Traitée
                </Badge>
              </SelectItem>
              <SelectItem value="en attente">
                <Badge className={cn("capitalize", statusBadgeColors['en attente'])}>
                  En attente
                </Badge>
              </SelectItem>
              <SelectItem value="rejetée">
                <Badge className={cn("capitalize", statusBadgeColors['rejetée'])}>
                  Rejetée
                </Badge>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={produitFilter} onValueChange={setProduitFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par produit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous produits</SelectItem>
              {PRODUITS_CNI.map(produit => (
                <SelectItem key={produit.value} value={produit.value}>{produit.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {produitCounts.map((produit) => (
          <Card 
            key={produit.value}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-2",
              produit.color,
              produitFilter === produit.value && "ring-2 ring-offset-2 ring-blue-500"
            )}
            onClick={() => setProduitFilter(produit.value)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{produit.name}</CardTitle>
              <CardDescription>Produit CNI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{produit.count}</div>
              <p className="text-sm text-muted-foreground">Réclamations</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Liste des Réclamations</CardTitle>
          <CardDescription>
            {filteredReclamations.length} réclamations trouvées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[200px]">Object</TableHead>
                  <TableHead>Utilisateur produit</TableHead>
                  <TableHead>Produit CNI</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Guichetier</TableHead>
                  <TableHead>technisien</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedReclamations.length > 0 ? (
                  paginatedReclamations.map((rec) => (
                    <TableRow key={rec._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{rec.title}</TableCell>
                      <TableCell>
                        <div className="font-medium">{rec.userId.firstName} {rec.userId.lastName}</div>
                        <div className="text-sm text-muted-foreground">{rec.userId.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "capitalize",
                          PRODUITS_CNI.find(p => p.value === rec.department)?.color
                        )}>
                          {rec.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "capitalize",
                          statusBadgeColors[rec.status]
                        )}>
                          {rec.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(rec.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        {rec.guichetierId ? (
                          <div className="font-medium">
                            {rec.guichetierId.firstName} {rec.guichetierId.lastName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rec.employeeId ? (
                          <div className="font-medium">
                            {rec.employeeId.firstName} {rec.employeeId.lastName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedReclamation(rec)}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Aucune réclamation trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: string | number | bigint | boolean | ((prevState: number) => number) | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                return (
                    <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(Number(pageNum))}
                    >
                        {pageNum}
                    </Button>
                );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reclamation Details Dialog */}
      <Dialog open={!!selectedReclamation} onOpenChange={() => setSelectedReclamation(null)}>
        <DialogContent className="max-w-2xl">
          {selectedReclamation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Détails de la Réclamation</DialogTitle>
                <DialogDescription>
                  ID: {selectedReclamation._id}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Titre</h3>
                      <p className="text-lg font-medium">{selectedReclamation.title}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Utilisateur produit</h3>
                      <div className="space-y-1">
                        <p className="text-lg font-medium">
                          {selectedReclamation.userId.firstName} {selectedReclamation.userId.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{selectedReclamation.userId.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Produit CNI</h3>
                      <Badge variant="outline" className="text-base">
                        {selectedReclamation.department}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Statut</h3>
                      <Badge className={cn(
                        "text-base",
                        statusBadgeColors[selectedReclamation.status]
                      )}>
                        {selectedReclamation.status}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Date de création</h3>
                      <p className="text-lg font-medium">
                        {new Date(selectedReclamation.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Guichetier assigné</h3>
                    {selectedReclamation.guichetierId ? (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <p className="font-medium">
                          {selectedReclamation.guichetierId.firstName} {selectedReclamation.guichetierId.lastName}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 border rounded-lg bg-gray-50 text-muted-foreground">
                        Non assigné
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Employé assigné</h3>
                    {selectedReclamation.employeeId ? (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <p className="font-medium">
                          {selectedReclamation.employeeId.firstName} {selectedReclamation.employeeId.lastName}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 border rounded-lg bg-gray-50 text-muted-foreground">
                        Non assigné
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Fichiers joints</h3>
                  <div className="space-y-2">
                    {selectedReclamation.files.length > 0 ? (
                      selectedReclamation.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-3 text-blue-500" />
                            <span className="font-medium">{file.split('/').pop()}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => downloadFile(file)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 border rounded-lg bg-gray-50 text-muted-foreground text-center">
                        Aucun fichier joint
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}