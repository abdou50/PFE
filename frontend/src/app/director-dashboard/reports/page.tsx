'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Download, Loader2, Calendar as CalendarIcon, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, subDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define PDF margin constant
const PDF_MARGIN = 15;

interface DashboardStats {
  statusDistribution?: {
    status: string;
    count: number;
  }[];
  departmentStats?: {
    department: string;
    total: number;
    treated: number;
    rejected: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  employeePerformance?: {
    userId: string;
    name: string;
    role: string;
    totalCount: number;
    treatedCount: number;
    rejectedCount: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  guichetierPerformance?: {
    userId: string;
    name: string;
    role: string;
    totalCount: number;
    treatedCount: number;
    rejectedCount: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  overallStats?: {
    totalReclamations: number;
    treated: number;
    rejected: number;
    resolutionRate: number;
    avgResolutionTime: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsDashboard() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('all');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTrends, setIncludeTrends] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedDepartment, reportType]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        department: selectedDepartment,
        status: 'all'
      });
      
      const response = await fetch(`http://localhost:5000/api/stats/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const result = await response.json();
      setDashboardData(result);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || "Impossible de charger les données du tableau de bord");
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!dashboardData) {
      toast.error("Aucune donnée disponible pour générer le PDF");
      return;
    }
  
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const chartWidth = pageWidth - (PDF_MARGIN * 2);
      const chartHeight = 100;
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 53, 147);
      doc.setFont('helvetica', 'bold');
      doc.text('Rapport des Réclamations', pageWidth / 2, 20, { align: 'center' });
      
      // Filters
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(`Période: ${format(dateRange.start, 'dd/MM/yyyy', { locale: fr })} - ${format(dateRange.end, 'dd/MM/yyyy', { locale: fr })}`, PDF_MARGIN, 30);
      doc.text(`Département: ${selectedDepartment === 'all' ? 'Tous' : selectedDepartment}`, PDF_MARGIN, 36);
      
      // Overall Stats
      if (dashboardData.overallStats) {
        doc.setFontSize(16);
        doc.setTextColor(40, 53, 147);
        doc.text('Statistiques Globales', PDF_MARGIN, 50);
        
        doc.setFontSize(12);
        autoTable(doc, {
          startY: 55,
          head: [['Métrique', 'Valeur']],
          body: [
            ['Total des réclamations', dashboardData.overallStats.totalReclamations?.toString() || '0'],
            ['Réclamations traitées', dashboardData.overallStats.treated?.toString() || '0'],
            ['Réclamations rejetées', dashboardData.overallStats.rejected?.toString() || '0'],
            ['Taux de résolution', `${dashboardData.overallStats.resolutionRate?.toFixed(1) || 0}%`],
            ['Temps moyen de traitement', `${dashboardData.overallStats.avgResolutionTime?.toFixed(1) || 0}h`]
          ],
          theme: 'grid',
          headStyles: {
            fillColor: [40, 53, 147],
            textColor: 255,
            fontStyle: 'bold'
          }
        });

        // Add status distribution pie chart for overall stats
        if (dashboardData.statusDistribution?.length) {
          const lastY = (doc as any).lastAutoTable.finalY || 120;
          doc.text('Répartition par Statut', PDF_MARGIN, lastY + 10);
          
          // Create canvas for chart
          const canvas = document.createElement('canvas');
          canvas.width = chartWidth * 4; // Higher resolution
          canvas.height = chartHeight * 4;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Draw pie chart
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;
            let startAngle = 0;
            
            // Calculate total for percentages
            const total = dashboardData.statusDistribution.reduce((sum, item) => sum + item.count, 0);
            
            // Draw pie slices
            dashboardData.statusDistribution.forEach((item, index) => {
              const sliceAngle = (item.count / total) * 2 * Math.PI;
              
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
              ctx.closePath();
              
              // Use appropriate colors
              const color = item.status === 'traitée' ? '#4CAF50' : 
                           item.status === 'rejetée' ? '#F44336' : 
                           COLORS[index % COLORS.length];
              ctx.fillStyle = color;
              ctx.fill();
              
              // Add labels
              const midAngle = startAngle + sliceAngle / 2;
              const labelX = centerX + Math.cos(midAngle) * (radius * 0.7);
              const labelY = centerY + Math.sin(midAngle) * (radius * 0.7);
              
              ctx.fillStyle = '#FFFFFF';
              ctx.font = 'bold 24px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${Math.round((item.count / total) * 100)}%`, labelX, labelY);
              
              startAngle += sliceAngle;
            });
            
            // Add legend
            const legendY = centerY + radius + 30;
            const legendItemHeight = 30;
            
            dashboardData.statusDistribution.forEach((item, index) => {
              const legendItemY = legendY + (index * legendItemHeight);
              
              // Color box
              const color = item.status === 'traitée' ? '#4CAF50' : 
                           item.status === 'rejetée' ? '#F44336' : 
                           COLORS[index % COLORS.length];
              ctx.fillStyle = color;
              ctx.fillRect(PDF_MARGIN * 4, legendItemY, 20, 20);
              
              // Text
              ctx.fillStyle = '#000000';
              ctx.font = '20px Arial';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${item.status} (${item.count})`, (PDF_MARGIN * 4) + 30, legendItemY + 10);
            });
            
            // Add chart to PDF
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', PDF_MARGIN, lastY + 15, chartWidth, chartHeight);
          }
        }
      }

      // Department Stats
      if (dashboardData.departmentStats?.length) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(40, 53, 147);
        doc.text('Statistiques par Département', PDF_MARGIN, 20);
        
        const deptData = dashboardData.departmentStats.map(dept => [
          dept.department,
          dept.total.toString(),
          dept.treated.toString(),
          `${dept.treatedPercentage.toFixed(1)}%`,
          `${dept.avgResolutionHours.toFixed(1)}h`
        ]);

        autoTable(doc, {
          startY: 25,
          head: [['Département', 'Total', 'Traités', 'Taux', 'Temps moyen']],
          body: deptData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 53, 147],
            textColor: 255,
            fontStyle: 'bold'
          }
        });

        // Add bar chart for department comparison
        const lastY = (doc as any).lastAutoTable.finalY || 120;
        doc.text('Comparaison des Départements', PDF_MARGIN, lastY + 10);
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.width = chartWidth * 4; // Higher resolution
        canvas.height = chartHeight * 4;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Setup chart dimensions
          const margin = { top: 20, right: 20, bottom: 60, left: 60 };
          const innerWidth = canvas.width - margin.left - margin.right;
          const innerHeight = canvas.height - margin.top - margin.bottom;
          
          // Clear canvas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw axes
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(margin.left, margin.top);
          ctx.lineTo(margin.left, margin.top + innerHeight);
          ctx.lineTo(margin.left + innerWidth, margin.top + innerHeight);
          ctx.stroke();
          
          // Calculate bar width and spacing
          const barCount = dashboardData.departmentStats.length;
          const barWidth = innerWidth / (barCount * 2);
          const barSpacing = barWidth;
          
          // Find max value for scaling
          const maxTotal = Math.max(...dashboardData.departmentStats.map(d => d.total));
          const yScale = innerHeight / maxTotal;
          
          // Draw bars
          dashboardData.departmentStats.forEach((dept, index) => {
            const x = margin.left + (index * (barWidth + barSpacing)) + barSpacing;
            const barHeight = dept.total * yScale;
            const y = margin.top + innerHeight - barHeight;
            
            // Total bar
            ctx.fillStyle = '#0088FE';
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Treated bar
            const treatedHeight = dept.treated * yScale;
            const treatedY = margin.top + innerHeight - treatedHeight;
            ctx.fillStyle = '#00C49F';
            ctx.fillRect(x + barWidth + 5, treatedY, barWidth, treatedHeight);
            
            // Department name label
            ctx.fillStyle = '#000000';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(dept.department, x + barWidth/2, margin.top + innerHeight + 20);
          });
          
          // Add legend
          ctx.fillStyle = '#0088FE';
          ctx.fillRect(margin.left, margin.top - 15, 15, 15);
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'left';
          ctx.fillText('Total', margin.left + 20, margin.top - 7);
          
          ctx.fillStyle = '#00C49F';
          ctx.fillRect(margin.left + 100, margin.top - 15, 15, 15);
          ctx.fillStyle = '#000000';
          ctx.fillText('Traités', margin.left + 120, margin.top - 7);
          
          // Add chart to PDF
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', PDF_MARGIN, lastY + 15, chartWidth, chartHeight);
        }
      }

      // Employee Performance
      if (dashboardData.employeePerformance?.length) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(40, 53, 147);
        doc.text('Performance des Techniciens', PDF_MARGIN, 20);
        
        const empData = dashboardData.employeePerformance.map(emp => [
          emp.name,
          emp.role,
          emp.totalCount.toString(),
          emp.treatedCount.toString(),
          `${emp.treatedPercentage.toFixed(1)}%`,
          `${emp.avgResolutionHours.toFixed(1)}h`
        ]);

        autoTable(doc, {
          startY: 25,
          head: [['Nom', 'Rôle', 'Total', 'Traités', 'Taux', 'Temps moyen']],
          body: empData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 53, 147],
            textColor: 255,
            fontStyle: 'bold'
          }
        });

        // Add horizontal bar chart for employee performance
        const lastY = (doc as any).lastAutoTable.finalY || 120;
        doc.text('Taux de Résolution par Technicien', PDF_MARGIN, lastY + 10);
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.width = chartWidth * 4; // Higher resolution
        canvas.height = chartHeight * 4;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Setup chart dimensions
          const margin = { top: 20, right: 20, bottom: 30, left: 150 };
          const innerWidth = canvas.width - margin.left - margin.right;
          const innerHeight = canvas.height - margin.top - margin.bottom;
          
          // Clear canvas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Sort employees by performance
          const sortedEmployees = [...dashboardData.employeePerformance]
            .sort((a, b) => b.treatedPercentage - a.treatedPercentage);
          
          // Limit to top 10 for readability
          const displayEmployees = sortedEmployees.slice(0, 10);
          
          // Calculate bar height and spacing
          const barCount = displayEmployees.length;
          const barHeight = innerHeight / (barCount * 1.5);
          const barSpacing = barHeight / 2;
          
          // Draw horizontal bars
          displayEmployees.forEach((emp, index) => {
            const y = margin.top + (index * (barHeight + barSpacing));
            const barWidth = (emp.treatedPercentage / 100) * innerWidth;
            
            // Performance bar
            ctx.fillStyle = emp.treatedPercentage > 75 ? '#4CAF50' : 
                           emp.treatedPercentage > 50 ? '#FFC107' : '#F44336';
            ctx.fillRect(margin.left, y, barWidth, barHeight);
            
            // Employee name label
            ctx.fillStyle = '#000000';
            ctx.font = '18px Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(emp.name, margin.left - 10, y + barHeight/2);
            
            // Percentage label
            ctx.textAlign = 'left';
            ctx.fillText(`${emp.treatedPercentage.toFixed(1)}%`, margin.left + barWidth + 5, y + barHeight/2);
          });
          
          // Add chart to PDF
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', PDF_MARGIN, lastY + 15, chartWidth, chartHeight);
        }
      }

      // Guichetier Performance
      if (dashboardData.guichetierPerformance?.length) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(40, 53, 147);
        doc.text('Performance des Guichetiers', PDF_MARGIN, 20);
        
        const guichetierData = dashboardData.guichetierPerformance.map(g => [
          g.name,
          g.totalCount.toString(),
          g.treatedCount.toString(),
          `${g.treatedPercentage.toFixed(1)}%`,
          `${g.avgResolutionHours.toFixed(1)}h`
        ]);
        
        autoTable(doc, {
          startY: 25,
          head: [['Nom', 'Total', 'Traités', 'Taux', 'Temps moyen']],
          body: guichetierData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 53, 147],
            textColor: 255,
            fontStyle: 'bold'
          }
        });

        // Add radar chart for guichetier performance comparison
        const lastY = (doc as any).lastAutoTable.finalY || 120;
        doc.text('Comparaison des Performances', PDF_MARGIN, lastY + 10);
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.width = chartWidth * 4; // Higher resolution
        canvas.height = chartHeight * 4;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Setup chart dimensions
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(centerX, centerY) - 50;
          
          // Clear canvas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Sort guichetiers by performance
          const sortedGuichetiers = [...dashboardData.guichetierPerformance]
            .sort((a, b) => b.treatedPercentage - a.treatedPercentage);
          
          // Limit to top 5 for readability
          const displayGuichetiers = sortedGuichetiers.slice(0, 5);
          
          // Draw horizontal bars for each guichetier
          const barHeight = 40;
          const barSpacing = 20;
          const startY = (canvas.height - (displayGuichetiers.length * (barHeight + barSpacing))) / 2;
          
          displayGuichetiers.forEach((g, index) => {
            const y = startY + (index * (barHeight + barSpacing));
            const barWidth = (g.treatedPercentage / 100) * (canvas.width - 300);
            
            // Performance bar
            ctx.fillStyle = g.treatedPercentage > 80 ? '#4CAF50' : '#F44336';
            ctx.fillRect(150, y, barWidth, barHeight);
            
            // Guichetier name label
            ctx.fillStyle = '#000000';
            ctx.font = '24px Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.name, 140, y + barHeight/2);
            
            // Percentage and time labels
            ctx.textAlign = 'left';
            ctx.fillText(`${g.treatedPercentage.toFixed(1)}% (${g.avgResolutionHours.toFixed(1)}h)`, 150 + barWidth + 10, y + barHeight/2);
          });
          
          // Add chart to PDF
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', PDF_MARGIN, lastY + 15, chartWidth, chartHeight);
        }
      }

      // Additional Notes
      if (additionalNotes) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(40, 53, 147);
        doc.text('Notes Additionnelles', PDF_MARGIN, 20);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(additionalNotes, PDF_MARGIN, 30, { maxWidth: pageWidth - PDF_MARGIN * 2 });
      }

      // Save PDF
      doc.save(`rapport-reclamations-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success("Le rapport PDF a été généré avec succès");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const renderDepartmentStats = () => {
    if (!dashboardData?.departmentStats?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques par Département</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucune donnée disponible</AlertTitle>
              <AlertDescription>
                Aucune statistique départementale n'a été trouvée pour la période sélectionnée.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques par Département</CardTitle>
          <CardDescription>Performance des différents départements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData.departmentStats.map((dept) => (
              <Card key={dept.department} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium">{dept.department}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-medium">{dept.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Traités:</span>
                      <span className="font-medium text-green-600">{dept.treated}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Rejetés:</span>
                      <span className="font-medium text-red-600">{dept.rejected}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Taux de traitement:</span>
                        <span className="font-medium">{dept.treatedPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={dept.treatedPercentage} 
                        className="h-2"
                        indicatorColor={dept.treatedPercentage > 75 ? 'bg-green-500' : 'bg-yellow-500'}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Temps moyen:</span>
                      <span className="font-medium text-blue-600">{dept.avgResolutionHours.toFixed(1)}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderEmployeePerformance = () => {
    if (!dashboardData?.employeePerformance?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Performance des Techniciens</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucune donnée disponible</AlertTitle>
              <AlertDescription>
                Aucune donnée de performance n'a été trouvée pour les techniciens.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance des Techniciens</CardTitle>
          <CardDescription>Analyse des performances par technicien</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted">
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
                {dashboardData.employeePerformance.map((emp) => (
                  <TableRow key={emp.userId} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell className="text-right">{emp.totalCount}</TableCell>
                    <TableCell className="text-right text-green-600">{emp.treatedCount}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={emp.treatedPercentage > 75 ? 'default' : 'destructive'}>
                        {emp.treatedPercentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-blue-600">{emp.avgResolutionHours.toFixed(1)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderGuichetierPerformance = () => {
    if (!dashboardData?.guichetierPerformance?.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Performance des Guichetiers</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucune donnée disponible</AlertTitle>
              <AlertDescription>
                Aucune donnée de performance n'a été trouvée pour les guichetiers.
              </AlertDescription>
            </Alert>
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
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Traités</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">Temps moyen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.guichetierPerformance.map((guichetier) => (
                  <TableRow key={guichetier.userId} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{guichetier.name}</TableCell>
                    <TableCell className="text-right">{guichetier.totalCount}</TableCell>
                    <TableCell className="text-right text-green-600">{guichetier.treatedCount}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={guichetier.treatedPercentage > 80 ? 'default' : 'destructive'}>
                        {guichetier.treatedPercentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-blue-600">{guichetier.avgResolutionHours.toFixed(1)}h</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderSummary = () => {
    if (!dashboardData?.overallStats) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Résumé Global</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucune donnée disponible</AlertTitle>
              <AlertDescription>
                Aucune statistique globale n'a été trouvée pour la période sélectionnée.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    const resolutionRate = dashboardData.overallStats.resolutionRate || 0;
    const avgResolutionTime = dashboardData.overallStats.avgResolutionTime || 0;
    const totalReclamations = dashboardData.overallStats.totalReclamations || 0;
    const treated = dashboardData.overallStats.treated || 0;
    const rejected = dashboardData.overallStats.rejected || 0;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Résumé Global</CardTitle>
            <CardDescription>Statistiques globales pour la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total des Réclamations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalReclamations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {differenceInDays(dateRange.end, dateRange.start)} jours
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Réclamations Traitées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{treated}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalReclamations > 0 ? `${Math.round((treated / totalReclamations) * 100)}% du total` : '0%'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Résolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {resolutionRate.toFixed(1)}%
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={resolutionRate} 
                      className="h-2"
                      indicatorColor={resolutionRate > 75 ? 'bg-green-500' : resolutionRate > 50 ? 'bg-yellow-500' : 'bg-red-500'}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">
                    {avgResolutionTime.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Temps moyen de traitement
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        {dashboardData.statusDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.status === 'traitée' ? '#4CAF50' : 
                            entry.status === 'rejetée' ? '#F44336' : 
                            COLORS[index % COLORS.length]
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        value, 
                        props.payload.status
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };
  
  return (
    <div className="p-6 space-y-6">
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-sans',
          style: {
            border: '1px solid #713200',
            padding: '16px',
            color: '#713200',
            borderRadius: '8px',
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
  
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rapport Par Produit</h1>

        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="gap-1"
          >
            {isCollapsed ? 'Afficher les filtres' : 'Masquer les filtres'}
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button 
            onClick={generatePDF} 
            disabled={loading || !dashboardData}
            className="gap-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Générer le PDF</span>
          </Button>
        </div>
      </div>
      
      {!isCollapsed && (
        <Card>
          <CardHeader>
            <CardTitle>Configuration du Rapport</CardTitle>
            <CardDescription>
              Personnalisez les paramètres de votre rapport
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Compact Period Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Période</label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {format(dateRange.start, 'dd/MM/yy', { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.start}
                        onSelect={(date) => date && setDateRange({...dateRange, start: date})}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-xs text-muted-foreground">à</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {format(dateRange.end, 'dd/MM/yy', { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                
                {/* Quick period selection buttons */}
                <div className="flex flex-wrap gap-1 ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    onClick={() => setDateRange({
                      start: subDays(new Date(), 7),
                      end: new Date()
                    })}
                  >
                    7j
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    onClick={() => setDateRange({
                      start: subDays(new Date(), 30),
                      end: new Date()
                    })}
                  >
                    30j
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    onClick={() => setDateRange({
                      start: subDays(new Date(), 90),
                      end: new Date()
                    })}
                  >
                    90j
                  </Button>
                </div>
              </div>
            </div>

            {/* Other filters on new line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Département</label>
                <Select 
                  value={selectedDepartment} 
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les départements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    <SelectItem value="Madaniya">Madaniya</SelectItem>
                    <SelectItem value="Insaf">Insaf</SelectItem>
                    <SelectItem value="Rached">Rached</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium block">Type de Rapport</label>
                <Select 
                  value={reportType} 
                  onValueChange={setReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rapport Complet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Rapport Complet</SelectItem>
                    <SelectItem value="departments">Par Département</SelectItem>
                    <SelectItem value="employees">Techniciens</SelectItem>
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
                <label htmlFor="charts" className="text-sm font-medium leading-none">
                  Inclure les graphiques
                </label>
              </div>
            
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trends"
                  checked={includeTrends}
                  onCheckedChange={(checked) => setIncludeTrends(checked as boolean)}
                />
                <label htmlFor="trends" className="text-sm font-medium leading-none">
                  Inclure les tendances
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium block">Notes Additionnelles</label>
              <Textarea
                placeholder="Ajoutez des notes ou commentaires spécifiques..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button 
              onClick={fetchDashboardData} 
              disabled={loading}
              className="ml-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Appliquer les filtres
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : dashboardData ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger 
              value="departments" 
              disabled={reportType === 'employees' || reportType === 'guichetiers'}
            >
              Départements
            </TabsTrigger>
            <TabsTrigger 
              value="employees" 
              disabled={reportType === 'departments' || reportType === 'guichetiers'}
            >
              Techniciens
            </TabsTrigger>
            <TabsTrigger 
              value="guichetiers" 
              disabled={reportType === 'departments' || reportType === 'employees'}
            >
              Guichetiers
            </TabsTrigger>
          </TabsList>
  
          <TabsContent value="summary">{renderSummary()}</TabsContent>
          <TabsContent value="departments">{renderDepartmentStats()}</TabsContent>
          <TabsContent value="employees">{renderEmployeePerformance()}</TabsContent>
          <TabsContent value="guichetiers">{renderGuichetierPerformance()}</TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aucune donnée disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucune donnée trouvée</AlertTitle>
              <AlertDescription>
                Aucune donnée n'a pu être chargée. Veuillez vérifier vos paramètres ou réessayer.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={fetchDashboardData} 
              className="mt-4"
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}