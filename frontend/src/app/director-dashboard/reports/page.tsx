'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Download, Loader2, Calendar as CalendarIcon, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import toast, { Toaster } from 'react-hot-toast';
import { usePDF } from 'react-to-pdf';

interface ReportData {
  departmentStats?: {
    department: string;
    total: number;
    treated: number;
    pending: number;
    rejected: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  employeePerformance?: {
    name: string;
    role: string;
    totalCount: number;
    treatedCount: number;
    rejectedCount: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  guichetierPerformance?: {
    name: string;
    totalCount: number;
    treatedCount: number;
    rejectedCount: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  overallStats?: {
    totalReclamations?: number;
    treated?: number;
    rejected?: number;
    resolutionRate?: number;
    avgResolutionTime?: number;
  };
  trends?: {
    volumeChange?: number;
    previousPeriodTotal?: number;
  };
}

const PRODUITS_CNI = [
  { name: 'Madaniya', value: 'Madaniya', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Insaf', value: 'Insaf', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Rached', value: 'Rached', color: 'bg-amber-100 text-amber-800 border-amber-200' },
];

export default function ReportsDashboard() {
  const { toPDF, targetRef } = usePDF({filename: 'rapport-reclamations.pdf'});
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedProduit, setSelectedProduit] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('all');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedProduit, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockData: ReportData = {
        departmentStats: PRODUITS_CNI.map(produit => ({
          department: produit.name,
          total: Math.floor(Math.random() * 100) + 50,
          treated: Math.floor(Math.random() * 80) + 30,
          pending: Math.floor(Math.random() * 20) + 5,
          rejected: Math.floor(Math.random() * 10) + 2,
          treatedPercentage: Math.floor(Math.random() * 30) + 70,
          avgResolutionHours: Math.floor(Math.random() * 24) + 12
        })),
        employeePerformance: [
          {
            name: 'John Doe',
            role: 'Superviseur',
            totalCount: 45,
            treatedCount: 40,
            rejectedCount: 5,
            treatedPercentage: 88.9,
            avgResolutionHours: 18.2
          },
          {
            name: 'Jane Smith',
            role: 'Agent',
            totalCount: 35,
            treatedCount: 30,
            rejectedCount: 5,
            treatedPercentage: 85.7,
            avgResolutionHours: 22.5
          }
        ],
        guichetierPerformance: [
          {
            name: 'Ahmed Ben Ali',
            totalCount: 60,
            treatedCount: 55,
            rejectedCount: 5,
            treatedPercentage: 91.7,
            avgResolutionHours: 15.8
          },
          {
            name: 'Fatima Zohra',
            totalCount: 50,
            treatedCount: 45,
            rejectedCount: 5,
            treatedPercentage: 90.0,
            avgResolutionHours: 17.2
          }
        ],
        overallStats: {
          totalReclamations: 270,
          treated: 215,
          rejected: 20,
          resolutionRate: 79.6,
          avgResolutionTime: 22.3
        },
        trends: {
          volumeChange: 12.5,
          previousPeriodTotal: 240
        }
      };

      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportData(mockData);

      // For actual implementation:
      // const params = new URLSearchParams({
      //   startDate: dateRange.start.toISOString(),
      //   endDate: dateRange.end.toISOString(),
      //   department: selectedProduit,
      //   reportType: reportType
      // });
      // const response = await fetch(`http://localhost:5000/api/stats/report?${params}`);
      // if (!response.ok) throw new Error('Failed to fetch report data');
      // const result = await response.json();
      // setReportData(result.data);

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error("Impossible de charger les données du rapport");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportData) {
      toast.error("Aucune donnée disponible pour générer le PDF");
      return;
    }

    try {
      toPDF();
      toast.success("Le rapport PDF a été généré avec succès");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const renderProduitStats = () => {
    if (!reportData?.departmentStats?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques par Produit CNI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aucune donnée disponible pour les produits CNI</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques par Produit CNI</CardTitle>
          <CardDescription>Performance des différents produits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {reportData.departmentStats.map((produit) => (
              <Card key={produit.department} className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{produit.department}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-medium">{produit.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Traités:</span>
                      <span className="font-medium">{produit.treated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rejetés:</span>
                      <span className="font-medium">{produit.rejected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taux:</span>
                      <span className="font-medium">{produit.treatedPercentage?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Temps moyen:</span>
                      <span className="font-medium">{produit.avgResolutionHours?.toFixed(1)}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {includeCharts && (
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="treated" name="Traités" fill="#4CAF50" />
                  <Bar dataKey="rejected" name="Rejetés" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmployeePerformance = () => {
    if (!reportData?.employeePerformance?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Performance des Employés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aucune donnée disponible pour les employés</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance des Employés</CardTitle>
          <CardDescription>Analyse des performances par employé</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Traités</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="text-right">Temps moyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.employeePerformance.map((emp) => (
                <TableRow key={emp.name}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell className="text-right">{emp.totalCount}</TableCell>
                  <TableCell className="text-right">{emp.treatedCount}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={emp.treatedPercentage > 75 ? 'default' : 'destructive'}>
                      {emp.treatedPercentage?.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{emp.avgResolutionHours?.toFixed(1)}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderGuichetierPerformance = () => {
    if (!reportData?.guichetierPerformance?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Performance des Guichetiers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aucune donnée disponible pour les guichetiers</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance des Guichetiers</CardTitle>
          <CardDescription>Analyse des performances par guichetier</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Traités</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="text-right">Temps moyen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.guichetierPerformance.map((guichetier) => (
                <TableRow key={guichetier.name}>
                  <TableCell className="font-medium">{guichetier.name}</TableCell>
                  <TableCell className="text-right">{guichetier.totalCount}</TableCell>
                  <TableCell className="text-right">{guichetier.treatedCount}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={guichetier.treatedPercentage > 80 ? 'default' : 'destructive'}>
                      {guichetier.treatedPercentage?.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{guichetier.avgResolutionHours?.toFixed(1)}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderSummary = () => {
    if (!reportData?.overallStats) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Résumé Global</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aucune donnée globale disponible</p>
          </CardContent>
        </Card>
      );
    }

    const resolutionRate = reportData.overallStats.resolutionRate || 0;
    const avgResolutionTime = reportData.overallStats.avgResolutionTime || 0;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Résumé Global</CardTitle>
            <CardDescription>Statistiques globales pour la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total des Réclamations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.overallStats.totalReclamations || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Réclamations Traitées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.overallStats.treated || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Traitement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resolutionRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgResolutionTime.toFixed(1)}h</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {includeTrends && reportData.trends && (
          <Card>
            <CardHeader>
              <CardTitle>Tendances</CardTitle>
              <CardDescription>Comparaison avec la période précédente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Évolution du Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      (reportData.trends.volumeChange || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(reportData.trends.volumeChange || 0).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      vs {reportData.trends.previousPeriodTotal || 0} réclamations
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6" ref={targetRef}>
      <Toaster
        position="top-center"
        toastOptions={{
          className: '',
          style: {
            border: '1px solid #713200',
            padding: '16px',
            color: '#713200',
          },
          success: {
            style: {
              border: '1px solid #4CAF50',
              color: '#4CAF50',
            },
          },
          error: {
            style: {
              border: '1px solid #F44336',
              color: '#F44336',
            },
          },
        }}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de Bord des Rapports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration du Rapport</CardTitle>
          <CardDescription>
            Personnalisez les paramètres de votre rapport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.start, 'PP', { locale: fr })}
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
                <span className="flex items-center">à</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.end, 'PP', { locale: fr })}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Produit CNI</label>
              <Select value={selectedProduit} onValueChange={setSelectedProduit}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les produits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  {PRODUITS_CNI.map((produit) => (
                    <SelectItem key={produit.value} value={produit.value}>
                      {produit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de Rapport</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Rapport Complet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Rapport Complet</SelectItem>
                  <SelectItem value="departments">Produits CNI</SelectItem>
                  <SelectItem value="employees">Employés</SelectItem>
                  <SelectItem value="guichetiers">Guichetiers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="charts"
                checked={includeCharts}
                onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
              />
              <label htmlFor="charts" className="text-sm font-medium">
                Inclure les graphiques
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="trends"
                checked={includeTrends}
                onCheckedChange={(checked) => setIncludeTrends(checked as boolean)}
              />
              <label htmlFor="trends" className="text-sm font-medium">
                Inclure les tendances
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes Additionnelles</label>
            <Textarea
              placeholder="Ajoutez des notes ou commentaires spécifiques..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={generatePDF} disabled={loading || !reportData}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Générer le PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reportData ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="produits" disabled={reportType === 'employees' || reportType === 'guichetiers'}>
              Produits CNI
            </TabsTrigger>
            <TabsTrigger value="employees" disabled={reportType === 'departments' || reportType === 'guichetiers'}>
              Employés
            </TabsTrigger>
            <TabsTrigger value="guichetiers" disabled={reportType === 'departments' || reportType === 'employees'}>
              Guichetiers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">{renderSummary()}</TabsContent>
          <TabsContent value="produits">{renderProduitStats()}</TabsContent>
          <TabsContent value="employees">{renderEmployeePerformance()}</TabsContent>
          <TabsContent value="guichetiers">{renderGuichetierPerformance()}</TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aucune donnée disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Aucune donnée n'a pu être chargée. Veuillez vérifier vos paramètres ou réessayer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}