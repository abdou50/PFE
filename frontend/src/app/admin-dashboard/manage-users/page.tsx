"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Edit, Trash2, Search, GanttChart, List, Download, ChevronLeft, ChevronRight, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "guichetier" | "user" | "director";
  department: "Madaniya" | "Insaf" | "Rached";
  ministre?: string;
  service?: string;
  createdAt: string;
  updatedAt: string;
};

type CreateUserRequestBody = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: "admin" | "employee" | "guichetier" | "user" | "director";
  department?: "Madaniya" | "Insaf" | "Rached";
  ministre?: string;
  service?: string;
};

const MINISTRES_BY_DEPARTMENT = {
  Madaniya: [
    "Ministre de l'Intérieur",
    "Ministre des Finances",
    "Ministre de l'Éducation"
  ],
  Insaf: [
    "Ministre de la Santé",
    "Ministre des Transports",
    "Ministre de l'Agriculture"
  ],
  Rached: [
    "Ministre de la Culture",
    "Ministre des Affaires Étrangères",
    "Ministre de la Justice"
  ]
};

const SERVICES_BY_MINISTRE = {
  "Ministre de l'Intérieur": [
    "Service de Sécurité",
    "Service des Ressources Humaines",
    "Service Logistique"
  ],
  "Ministre des Finances": [
    "Service Financier",
    "Service Comptabilité",
    "Service Budget"
  ],
  "Ministre de l'Éducation": [
    "Service Pédagogique",
    "Service Formation",
    "Service Examens"
  ],
  "Ministre de la Santé": [
    "Service Médical",
    "Service Pharmacie",
    "Service Prévention"
  ],
  "Ministre des Transports": [
    "Service Routier",
    "Service Ferroviaire",
    "Service Aérien"
  ],
  "Ministre de l'Agriculture": [
    "Service Production",
    "Service Irrigation",
    "Service Développement"
  ],
  "Ministre de la Culture": [
    "Service Patrimoine",
    "Service Arts",
    "Service Événements"
  ],
  "Ministre des Affaires Étrangères": [
    "Service Diplomatie",
    "Service Consulaire",
    "Service Coopération"
  ],
  "Ministre de la Justice": [
    "Service Judiciaire",
    "Service Législation",
    "Service Pénal"
  ]
};

const ROLE_COLORS = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  employee: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  guichetier: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  user: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  director: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const DEPARTMENT_COLORS = {
  Madaniya: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Insaf: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Rached: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

const translateRole = (role: string) => {
  const translations: Record<string, string> = {
    admin: "Administrateur",
    employee: "Technicien",
    guichetier: "Guichetier",
    user: "Utilisateur",
    director: "Directeur"
  };
  return translations[role] || role;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [availableMinistres, setAvailableMinistres] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user" as const,
    department: "Madaniya" as const,
    ministre: "",
    service: "",
  });

  // Fetch users with filters
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (departmentFilter !== "all") params.append("department", departmentFilter);
      params.append("sort", dateSort);

      const response = await fetch(`http://127.0.0.1:5000/api/users?${params.toString()}`);
      if (!response.ok) throw new Error("Échec du chargement des utilisateurs");
      
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Impossible de charger les utilisateurs");
      console.error("Erreur de chargement:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Update available ministres when department changes
  useEffect(() => {
    if (formData.department) {
      const ministres = MINISTRES_BY_DEPARTMENT[formData.department] || [];
      setAvailableMinistres(ministres);
      
      // Reset ministre and service if not available in new department
      if (!ministres.includes(formData.ministre)) {
        setFormData(prev => ({
          ...prev,
          ministre: "",
          service: ""
        }));
        setAvailableServices([]);
      }
    }
  }, [formData.department]);

  // Update available services when ministre changes
  useEffect(() => {
    if (formData.ministre) {
      const services = SERVICES_BY_MINISTRE[formData.ministre as keyof typeof SERVICES_BY_MINISTRE] || [];
      setAvailableServices(services);
      
      // Reset service if not available for new ministre
      if (!services.includes(formData.service)) {
        setFormData(prev => ({
          ...prev,
          service: ""
        }));
      }
    }
  }, [formData.ministre]);

  // Toggle date sort order
  const toggleDateSort = () => {
    setDateSort(prev => prev === "asc" ? "desc" : "asc");
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Edit user - populate form with existing data
  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role as "user",
      department: user.department as "Madaniya",
      ministre: user.ministre || "",
      service: user.service || "",
    });
    setOpenDialog(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(
      currentUser ? "Mise à jour en cours..." : "Création en cours..."
    );

    try {
      const requestBody: CreateUserRequestBody = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        ...(formData.password && { password: formData.password }),
        role: formData.role,
        ...(["user", "employee", "guichetier"].includes(formData.role) && {
          department: formData.department
        }),
        ...(formData.role === "user" && { 
          ministre: formData.ministre,
          service: formData.service 
        })
      };

      const url = currentUser 
        ? `http://127.0.0.1:5000/api/users/${currentUser._id}`
        : "http://127.0.0.1:5000/api/users";
      
      const response = await fetch(url, {
        method: currentUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.msg || "Opération échouée");
      }

      toast.success(
        currentUser 
          ? "Utilisateur mis à jour avec succès"
          : "Utilisateur créé avec succès",
        { id: loadingToast }
      );

      setOpenDialog(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue", { id: loadingToast });
      console.error("Erreur:", error);
    }
  };

  // Delete user with SweetAlert
  const handleDelete = async (userId: string) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas revenir en arrière!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;
    
    const loadingToast = toast.loading("Suppression en cours...");

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || "Échec de la suppression");
      }

      setUsers(users.filter(user => user._id !== userId));
      toast.success("Utilisateur supprimé avec succès", { id: loadingToast });
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer l'utilisateur", { id: loadingToast });
      console.error("Erreur:", error);
    }
  };

  // Prepare export preview data
  const prepareExportPreview = () => {
    const headers = ['Prénom', 'Nom', 'Email', 'Rôle', 'Produit CNI', 'Ministre', 'Service', 'Date création'];
    const data = [
      headers,
      ...filteredUsers.map(user => [
        user.firstName,
        user.lastName,
        user.email,
        translateRole(user.role),
        user.department,
        user.ministre || '-',
        user.service || '-',
        format(parseISO(user.createdAt), 'dd/MM/yyyy')
      ])
    ];
    setPreviewData(data);
    setShowPreview(true);
  };

  // Export users to CSV
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const headers = ['Prénom', 'Nom', 'Email', 'Rôle', 'Produit CNI', 'Ministre', 'Service', 'Date création'];
      const csvData = [
        headers.join(','),
        ...filteredUsers.map(user => [
          `"${user.firstName}"`,
          `"${user.lastName}"`,
          `"${user.email}"`,
          `"${translateRole(user.role)}"`,
          `"${user.department}"`,
          `"${user.ministre || ''}"`,
          `"${user.service || ''}"`,
          `"${format(parseISO(user.createdAt), 'dd/MM/yyyy')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `utilisateurs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      toast.success("Export réalisé avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export");
      console.error("Erreur d'export:", error);
    } finally {
      setExportLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "user",
      department: "Madaniya",
      ministre: "",
      service: "",
    });
    setAvailableMinistres([]);
    setAvailableServices([]);
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, departmentFilter, dateSort]);

  // Filter users by search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto py-8">
      <Toaster position="top-right" />
      
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Aperçu de l'export</h2>
            <div className="flex-1 overflow-auto">
              <table className="min-w-full border dark:border-gray-700">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                  <tr>
                    {previewData[0]?.map((header, index) => (
                      <th key={index} className="border px-4 py-2 text-left dark:border-gray-700">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border px-4 py-2 dark:border-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                setShowPreview(false);
                handleExport();
              }}>
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={prepareExportPreview} disabled={exportLoading}>
            {exportLoading ? (
              "Export en cours..."
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </>
            )}
          </Button>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setCurrentUser(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {currentUser ? "Modifier Utilisateur" : "Ajouter Utilisateur"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      Prénom
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Nom
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Nom"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    {currentUser ? "Nouveau mot de passe" : "Mot de passe"}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder={currentUser ? "Laisser vide pour ne pas changer" : "Mot de passe"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!currentUser}
                    minLength={6}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium mb-1">
                      Rôle
                    </label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => handleSelectChange("role", value)}
                      required
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="employee">Technicien</SelectItem>
                        <SelectItem value="guichetier">Guichetier</SelectItem>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="director">Directeur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(["user", "employee", "guichetier"].includes(formData.role)) && (
                    <div>
                      <label htmlFor="department" className="block text-sm font-medium mb-1">
                        Produit CNI
                      </label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => handleSelectChange("department", value)}
                        required={["user", "employee", "guichetier"].includes(formData.role)}
                      >
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Sélectionner un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Madaniya">Madaniya</SelectItem>
                          <SelectItem value="Rached">Rached</SelectItem>
                          <SelectItem value="Insaf">Insaf</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {formData.role === "user" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ministre" className="block text-sm font-medium mb-1">
                        Ministre
                      </label>
                      <Select
                        value={formData.ministre}
                        onValueChange={(value) => handleSelectChange("ministre", value)}
                        required={formData.role === "user"}
                        disabled={!formData.department}
                      >
                        <SelectTrigger id="ministre">
                          <SelectValue placeholder="Sélectionner un ministre" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMinistres.map(ministre => (
                            <SelectItem key={ministre} value={ministre}>
                              {ministre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label htmlFor="service" className="block text-sm font-medium mb-1">
                        Service
                      </label>
                      <Select
                        value={formData.service}
                        onValueChange={(value) => handleSelectChange("service", value)}
                        required={formData.role === "user"}
                        disabled={!formData.ministre}
                      >
                        <SelectTrigger id="service">
                          <SelectValue placeholder="Sélectionner un service" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableServices.map(service => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenDialog(false);
                      resetForm();
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {currentUser ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher utilisateurs..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={toggleDateSort}
            className="w-[180px]"
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            {dateSort === "asc" ? "Plus ancien" : "Plus récent"}
          </Button>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="employee">Technicien</SelectItem>
              <SelectItem value="guichetier">Guichetier</SelectItem>
              <SelectItem value="user">Utilisateur</SelectItem>
              <SelectItem value="director">Directeur</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tous les produits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              <SelectItem value="Madaniya">Madaniya</SelectItem>
              <SelectItem value="Rached">Rached</SelectItem>
              <SelectItem value="Insaf">Insaf</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
          >
            {viewMode === "table" ? (
              <>
                <GanttChart className="mr-2 h-4 w-4" />
                Cartes
              </>
            ) : (
              <>
                <List className="mr-2 h-4 w-4" />
                Tableau
              </>
            )}
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <>
          <div className="rounded-md border overflow-auto max-h-[calc(100vh-300px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-gray-950">
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Produit CNI</TableHead>
                  <TableHead>Ministre/Service</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={ROLE_COLORS[user.role]}>
                          {translateRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={DEPARTMENT_COLORS[user.department]}>
                          {user.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.role === "user" ? (
                          <>
                            <div className="text-sm">{user.ministre || '-'}</div>
                            <div className="text-xs text-muted-foreground">{user.service || '-'}</div>
                          </>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(user.createdAt), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination controls */}
          {filteredUsers.length > itemsPerPage && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                    <div className="h-8 bg-gray-200 rounded w-8"></div>
                  </CardFooter>
                </Card>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              currentItems.map((user) => (
                <Card key={user._id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>
                        {user.firstName} {user.lastName}
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={ROLE_COLORS[user.role]}>
                        {translateRole(user.role)}
                      </Badge>
                      <Badge variant="outline" className={DEPARTMENT_COLORS[user.department]}>
                        {user.department}
                      </Badge>
                    </div>

                    {user.role === "user" && (
                      <>
                        <Separator className="my-2" />
                        <div>
                          <p className="text-sm font-medium">Ministre</p>
                          <p className="text-sm">{user.ministre || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Service</p>
                          <p className="text-sm">{user.service || '-'}</p>
                        </div>
                      </>
                    )}
                    
                    <Separator className="my-2" />
                    <div className="text-sm text-muted-foreground">
                      Créé le {format(parseISO(user.createdAt), "dd/MM/yyyy")}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(user._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          
          {/* Pagination controls */}
          {filteredUsers.length > itemsPerPage && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
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
        </>
      )}
    </div>
  );
}