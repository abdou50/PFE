'use client';

import { useState, useEffect } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from 'react-hot-toast';
import { Reclamation } from "@/types/reclamation";

interface AllReclamationsProps {
  reclamations: Reclamation[];
  loading: boolean;
  departments: string[];
  dateRange: { start: Date; end: Date };
  setDateRange: (range: { start: Date; end: Date }) => void;
  selectedDepartment: string;
  setSelectedDepartment: (department: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  onReclamationClick: (reclamation: Reclamation) => void;
}

export function AllReclamations({
  reclamations,
  loading,
  departments,
  dateRange,
  setDateRange,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  onReclamationClick
}: AllReclamationsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const filteredReclamations = reclamations.filter(rec => {
    // Filter by department
    const matchesDepartment = 
      selectedDepartment === 'all' || rec.department === selectedDepartment;

    // Filter by status
    const matchesStatus = 
      selectedStatus === 'all' || rec.status === selectedStatus;

    // Filter by date range
    const recDate = new Date(rec.createdAt);
    const matchesDateRange = 
      recDate >= dateRange.start && recDate <= dateRange.end;

    // Filter by search term
    const matchesSearch = 
      rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.employeeId && getEmployeeName(rec.employeeId).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rec.guichetierId && getEmployeeName(rec.guichetierId).toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by employee if selected
    const matchesEmployee = 
      selectedEmployee === 'all' || 
      (selectedEmployee === 'unassigned' && !rec.employeeId && !rec.guichetierId) ||
      (rec.employeeId?._id === selectedEmployee) ||
      (rec.guichetierId?._id === selectedEmployee);
    
    return matchesSearch && matchesEmployee && matchesDepartment && matchesStatus && matchesDateRange;
  });

  const getEmployeeName = (employee?: { _id?: string; firstName?: string; lastName?: string } | null) => {
    if (!employee || !employee._id || (!employee.firstName && !employee.lastName)) {
      return 'Non assigné';
    }
    return `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Non assigné';
  };

  const getUniqueEmployees = () => {
    const employees = new Map<string, { id: string; name: string }>();
    
    reclamations.forEach(rec => {
      if (rec.employeeId?._id) {
        employees.set(rec.employeeId._id, {
          id: rec.employeeId._id,
          name: getEmployeeName(rec.employeeId)
        });
      }
      if (rec.guichetierId?._id) {
        employees.set(rec.guichetierId._id, {
          id: rec.guichetierId._id,
          name: getEmployeeName(rec.guichetierId)
        });
      }
    });
    
    return Array.from(employees.values());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Réclamations</CardTitle>
          <CardDescription>Chargement en cours...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Réclamations</CardTitle>
            <CardDescription>
              {filteredReclamations.length} réclamations trouvées
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recherche</label>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Période</label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.start, 'PPP', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => date && setDateRange({...dateRange, start: date})}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>

                <span>au</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.end, 'PPP', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => date && setDateRange({...dateRange, end: date})}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Produit CNI</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Produit CNI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="traitée">Traitée</SelectItem>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="rejetée">Rejetée</SelectItem>
                  <SelectItem value="envoyer">Envoyée</SelectItem>
                  <SelectItem value="brouillant">Brouillon</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Employé</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Employé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  <SelectItem value="unassigned">Non assigné</SelectItem>
                  {getUniqueEmployees().map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Utilisateur</TableHead>  {/* New column */}
              <TableHead>Produit CNI</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Guichetier</TableHead>
              <TableHead>Employé</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReclamations.map((rec) => (
              <TableRow key={rec._id}>
                <TableCell className="font-medium">{rec.title}</TableCell>
                <TableCell>
                  {rec.userId ? 
                    `${rec.userId.firstName || ''} ${rec.userId.lastName || ''}`.trim() || 'Non assigné' 
                    : 'Non assigné'}
                </TableCell>
                <TableCell>{rec.department}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    style={{ backgroundColor: STATUS_COLORS[rec.status] }}
                    className="text-white"
                  >
                    {rec.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(parseISO(rec.createdAt), 'PPP', { locale: fr })}</TableCell>
                <TableCell>
                  {rec.guichetierId ? 
                    `${rec.guichetierId.firstName || ''} ${rec.guichetierId.lastName || ''}`.trim() || 'Non assigné' 
                    : 'Non assigné'}
                </TableCell>
                <TableCell>
                  {rec.employeeId ? 
                    `${rec.employeeId.firstName || ''} ${rec.employeeId.lastName || ''}`.trim() || 'Non assigné' 
                    : 'Non assigné'}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onReclamationClick(rec)}
                  >
                    Détails
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS = {
  'traitée': '#4CAF50',
  'en attente': '#FFC107',
  'rejetée': '#F44336',
  'envoyer': '#2196F3',
  'brouillant': '#9E9E9E'
};