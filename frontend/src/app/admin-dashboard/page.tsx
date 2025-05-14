'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Calendar as CalendarIcon, Star, FileText, Users, AlertCircle, Filter, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, PieChart, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useState, useEffect } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface Performer {
  _id: string;
  name: string;
  role: string;
  userId: string;
  departmentCount: number;
  totalCount: number;
  treatedCount: number;
  rejectedCount: number;
  treatedPercentage: number;
  rejectedPercentage: number;
  avgResolutionHours: number;
}

interface DepartmentStats {
  department: string;
  total: number;
  treated: number;
  pending: number;
  rejected: number;
  treatedPercentage: number;
  avgResolutionHours: number;
}

interface DashboardData {
  statusDistribution: { status: string; count: number }[];
  departmentStats: DepartmentStats[];
  employeePerformance: Performer[];
  guichetierPerformance: Performer[];
  overallStats: {
    totalReclamations: number;
    treated: number;
    rejected: number;
    resolutionRate: number;
    avgResolutionTime: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const STATUS_COLORS = {
  'traitée': '#4CAF50',
  'en attente': '#FFC107',
  'rejetée': '#F44336',
  'envoyer': '#2196F3',
  'brouillant': '#9E9E9E'
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous statuts' },
  { value: 'traitée', label: 'Traitée' },
  { value: 'en attente', label: 'En attente' },
  { value: 'rejetée', label: 'Rejetée' },
  { value: 'envoyer', label: 'Envoyer' },
  { value: 'brouillant', label: 'Brouillant' }
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPerformer, setSelectedPerformer] = useState<Performer | null>(null);
  const [showPerformerDetails, setShowPerformerDetails] = useState(false);
  const [showTreatmentRateDetails, setShowTreatmentRateDetails] = useState(false);
  const [reportDescription, setReportDescription] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [rating, setRating] = useState<number>(0);

  const departments = ['Madaniya', 'Insaf', 'Rached'];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        department: selectedDepartment !== 'all' ? selectedDepartment : '',
        status: selectedStatus !== 'all' ? selectedStatus : ''
      });

      const response = await fetch(`http://localhost:5000/api/stats/dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedDepartment, selectedStatus]);

  const getAllPerformers = (): Performer[] => {
    if (!data) return [];
    
    return [
      ...(data.employeePerformance || []),
      ...(data.guichetierPerformance || [])
    ].sort((a, b) => b.treatedCount - a.treatedCount);
  };

  const getTopPerformers = (): Performer[] => {
    return getAllPerformers().slice(0, 3);
  };

  const statusData = data?.statusDistribution.map(item => ({
    name: item.status,
    value: item.count,
    color: STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#8884d8'
  })) || [];

  const departmentComparisonData = data?.departmentStats.map(dept => ({
    name: dept.department,
    'Traitée': dept.treated,
    'Rejetée': dept.rejected
  })) || [];

  const renderGuichetierCards = () => {
    if (!data?.guichetierPerformance?.length) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance des Guichetiers</CardTitle>
          <CardDescription>
            Cliquez sur une carte pour voir les détails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.guichetierPerformance.map((guichetier) => (
              <div
                key={guichetier._id}
                className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedPerformer(guichetier);
                  setShowPerformerDetails(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{guichetier.name}</h3>
                  <Badge variant="outline" className="capitalize">
                    {guichetier.role}
                  </Badge>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="font-medium">{guichetier.totalCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Traités:</span>
                    <span className="font-medium">{guichetier.treatedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rejetés:</span>
                    <span className="font-medium">{guichetier.rejectedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Taux traitement:</span>
                    <span 
                      className="font-medium cursor-pointer text-blue-500 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPerformer(guichetier);
                        setShowTreatmentRateDetails(true);
                      }}
                    >
                      {guichetier.treatedPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Temps moyen:</span>
                    <span className="font-medium">
                      {guichetier.avgResolutionHours?.toFixed(1) || 'N/A'}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const topPerformers = getTopPerformers();
  const allPerformers = getAllPerformers();

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6">No data available</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de Bord des Réclamations</h1>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.start, 'PPP', { locale: fr })} - {format(dateRange.end, 'PPP', { locale: fr })}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
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
                <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
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
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Produit CNI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous Produits</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => setActiveTab('report')} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Générer Rapport
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Users className="h-4 w-4 mr-2" />
            Vue d'Ensemble
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Star className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="report">
            <FileText className="h-4 w-4 mr-2" />
            Rapport
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Réclamations</CardTitle>
                  <span className="text-muted-foreground">📊</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overallStats.totalReclamations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedDepartment === 'all' ? 'Tous produits' : selectedDepartment}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Traitement</CardTitle>
                  <span className="text-muted-foreground">📈</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overallStats.resolutionRate.toFixed(1)}%</div>
                  <p 
                    className="text-xs text-blue-500 hover:underline cursor-pointer mt-1"
                    onClick={() => setShowTreatmentRateDetails(true)}
                  >
                    +{(data.overallStats.resolutionRate - 75).toFixed(1)}% vs cible (Cliquez pour détails)
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                  <span className="text-muted-foreground">⏱️</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overallStats.avgResolutionTime.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Temps moyen de traitement
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Personnel Actif</CardTitle>
                  <span className="text-muted-foreground">👥</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {allPerformers.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total des réclamations traitées
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition par Statut</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance par Produit CNI</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="Traitée" name="Traitée" fill="#4CAF50" />
                      <Bar dataKey="Rejetée" name="Rejetée" fill="#F44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {topPerformers.map((performer, index) => (
                <Card key={performer._id} className={
                  index === 0 ? 'border-yellow-400 border-2 shadow-lg' : 
                  index === 1 ? 'border-gray-400 border-2 shadow-md' : 
                  index === 2 ? 'border-amber-600 border-2 shadow-sm' : ''
                }>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {index === 0 && <Medal className="h-8 w-8 text-yellow-400" />}
                      {index === 1 && <Medal className="h-8 w-8 text-gray-400" />}
                      {index === 2 && <Medal className="h-8 w-8 text-amber-600" />}
                      <div>
                        <CardTitle>{performer.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {performer.role}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {index === 0 ? 'Or' : index === 1 ? 'Argent' : 'Bronze'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Traités</p>
                        <p className="text-2xl font-bold">{performer.treatedCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rejetés</p>
                        <p className="text-2xl font-bold">{performer.rejectedCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Taux traitement</p>
                        <p 
                          className="text-xl font-semibold text-blue-500 hover:underline cursor-pointer"
                          onClick={() => {
                            setSelectedPerformer(performer);
                            setShowTreatmentRateDetails(true);
                          }}
                        >
                          {performer.treatedPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Temps moyen</p>
                        <p className="text-xl font-semibold">
                          {performer.avgResolutionHours?.toFixed(1) || 'N/A'}h
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance des Employés</CardTitle>
                <CardDescription>
                  Classement des employés par performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {data?.employeePerformance?.map((employee) => (
                    <div 
                      key={employee._id} 
                      className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedPerformer(employee);
                        setShowPerformerDetails(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{employee.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {employee.role}
                        </Badge>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total:</span>
                          <span className="font-medium">{employee.totalCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Traités:</span>
                          <span className="font-medium">{employee.treatedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Rejetés:</span>
                          <span className="font-medium">{employee.rejectedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Taux traitement:</span>
                          <span 
                            className="font-medium text-blue-500 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPerformer(employee);
                              setShowTreatmentRateDetails(true);
                            }}
                          >
                            {employee.treatedPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Temps moyen:</span>
                          <span className="font-medium">
                            {employee.avgResolutionHours?.toFixed(1) || 'N/A'}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {renderGuichetierCards()}
          </div>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle>Génération de Rapport</CardTitle>
              <CardDescription>
                Créez un rapport personnalisé avec analyse automatique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Période</h3>
                  <div className="flex items-center gap-2">
                    <div className="border rounded-md p-2 flex-1">
                      {format(dateRange.start, 'PPP', { locale: fr })}
                    </div>
                    <span>au</span>
                    <div className="border rounded-md p-2 flex-1">
                      {format(dateRange.end, 'PPP', { locale: fr })}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Produit CNI</h3>
                  <div className="border rounded-md p-2">
                    {selectedDepartment === 'all' ? 'Tous Produits' : selectedDepartment}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Statut</h3>
                  <div className="border rounded-md p-2">
                    {selectedStatus === 'all' ? 'Tous Statuts' : 
                     STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Description Additionnelle</h3>
                <Textarea 
                  placeholder="Ajoutez des commentaires ou des points spécifiques à inclure dans le rapport..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => setIsGeneratingReport(true)} 
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Générer Rapport PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPerformerDetails} onOpenChange={setShowPerformerDetails}>
        <DialogContent>
          {selectedPerformer && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPerformer.name}</DialogTitle>
                <DialogDescription className="capitalize">
                  {selectedPerformer.role} - {selectedPerformer.departmentCount} département(s)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Performance</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-6 w-6 cursor-pointer ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                        onClick={() => setRating(i + 1)}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {rating}/5
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Total Réclamations</h3>
                      <div className="mt-2 text-xl font-bold">
                        {selectedPerformer.totalCount}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Temps Moyen</h3>
                      <div className="mt-2 text-xl font-bold">
                        {selectedPerformer.avgResolutionHours?.toFixed(1) || 'N/A'}h
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Traités</h3>
                      <div className="mt-2 text-lg font-semibold">
                        {selectedPerformer.treatedCount}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Rejetés</h3>
                      <div className="mt-2 text-lg font-semibold">
                        {selectedPerformer.rejectedCount}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Taux de Traitement</h3>
                      <div className="mt-2 text-lg font-semibold">
                        {selectedPerformer.treatedPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Taux de Rejet</h3>
                      <div className="mt-2 text-lg font-semibold">
                        {selectedPerformer.rejectedPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowPerformerDetails(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTreatmentRateDetails} onOpenChange={setShowTreatmentRateDetails}>
        <DialogContent>
          {selectedPerformer && (
            <>
              <DialogHeader>
                <DialogTitle>Détails du Taux de Traitement</DialogTitle>
                <DialogDescription>
                  Analyse détaillée pour {selectedPerformer.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium">Réclamations Traitées</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedPerformer.treatedCount}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPerformer.treatedPercentage.toFixed(1)}% du total
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium">Réclamations Rejetées</h3>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedPerformer.rejectedCount}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPerformer.rejectedPercentage.toFixed(1)}% du total
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium">Performance Globale</h3>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Taux de traitement cible:</span>
                      <span className="font-medium">75%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Écart par rapport à la cible:</span>
                      <span className={`font-medium ${selectedPerformer.treatedPercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {(selectedPerformer.treatedPercentage - 75).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowTreatmentRateDetails(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}