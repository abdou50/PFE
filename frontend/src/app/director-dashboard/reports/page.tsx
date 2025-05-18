'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Calendar as CalendarIcon, FileText } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart } from 'chart.js/auto';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Type declarations
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: import('jspdf-autotable').UserOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface ReportData {
  departmentStats: {
    department: string;
    total: number;
    treated: number;
    pending: number;
    rejected: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  employeePerformance: {
    name: string;
    role: string;
    totalCount: number;
    treatedCount: number;
    rejectedCount: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
  guichetierPerformance: {
    name: string;
    totalCount: number;
    treatedCount: number;
    rejectedCount: number;
    treatedPercentage: number;
    avgResolutionHours: number;
  }[];
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('all');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const departments = ['Madaniya', 'Insaf', 'Rached'];

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedDepartment]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        department: selectedDepartment,
        reportType: reportType
      });

      const response = await fetch(`http://localhost:5000/api/stats/report?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report data');
      
      const result = await response.json();
      setReportData(result); // Remove .data since the backend returns the data directly
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async (data: ReportData) => {
    try {
      setGeneratingInsights(true);
      
      // Calculate averages
      const avgDeptTreatment = data.departmentStats.reduce((acc, dept) => 
        acc + dept.treatedPercentage, 0) / data.departmentStats.length;
      
      const avgEmpTreatment = data.employeePerformance.reduce((acc, emp) => 
        acc + emp.treatedPercentage, 0) / data.employeePerformance.length;
      
      const avgGuichetierTreatment = data.guichetierPerformance.reduce((acc, g) => 
        acc + g.treatedPercentage, 0) / data.guichetierPerformance.length;

      // Find best and worst performers
      const bestDept = data.departmentStats.reduce((a, b) => 
        a.treatedPercentage > b.treatedPercentage ? a : b);
      
      const worstDept = data.departmentStats.reduce((a, b) => 
        a.treatedPercentage < b.treatedPercentage ? a : b);

      return `Analyse des performances:

      1. Points forts:
         - Le département ${bestDept.department} montre une excellente performance avec un taux de traitement de ${bestDept.treatedPercentage.toFixed(1)}%
         - La moyenne générale de traitement des départements est de ${avgDeptTreatment.toFixed(1)}%
         - Les guichetiers maintiennent un taux moyen de traitement de ${avgGuichetierTreatment.toFixed(1)}%

      2. Points à améliorer:
         - Le département ${worstDept.department} nécessite une attention particulière (${worstDept.treatedPercentage.toFixed(1)}%)
         - Certains temps de traitement peuvent être optimisés
         - Uniformiser les performances entre les départements

      3. Recommandations spécifiques:
         - Analyser les méthodes de travail du département ${bestDept.department} pour les partager
         - Mettre en place un support supplémentaire pour ${worstDept.department}
         - Établir des objectifs de performance progressifs

      4. Actions concrètes suggérées:
         - Organiser des sessions de formation inter-départements
         - Mettre en place un système de mentorat
         - Réviser les processus de traitement des réclamations
         - Établir des réunions hebdomadaires de suivi`;
    } catch (error) {
      console.error('Error generating insights:', error);
      return `Analyse des performances non disponible.`;
    } finally {
      setGeneratingInsights(false);
    }
  };

  const generatePDF = async () => {
    if (!reportData) return;
  
    setLoading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
  
      // Initialize autoTable directly
      const autoTablePlugin = (doc: jsPDF, options: import('jspdf-autotable').UserOptions) => {
        
      }
  
      // Get page dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  
      // Cover page
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text('Rapport de Performance', pageWidth / 2, 80, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('Système CNI', pageWidth / 2, 100, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(
        `Période: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}`,
        pageWidth / 2,
        120,
        { align: 'center' }
      );
      
      doc.setTextColor(255, 255, 255, 0.5);
      doc.setFontSize(10);
      doc.text(
        `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
  
      // Add new page for content
      doc.addPage();
  
      // Department statistics
      if (reportType === 'all' || reportType === 'departments') {
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185);
        doc.text('Statistiques par Département', 20, 20);
  
        const deptData = reportData.departmentStats.map(dept => [
          dept.department,
          dept.total,
          dept.treated,
          dept.pending,
          dept.rejected,
          `${dept.treatedPercentage.toFixed(1)}%`,
          `${dept.avgResolutionHours.toFixed(1)}h`
        ]);
  
        autoTablePlugin(doc, {
          startY: 30,
          head: [['Département', 'Total', 'Traités', 'En attente', 'Rejetés', 'Taux', 'Temps moyen']],
          body: deptData,
          theme: 'striped',
        });
      }
  
      // Employee performance
      if (reportType === 'all' || reportType === 'employees') {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185);
        doc.text('Performance des Employés', 20, 20);
  
        const empData = reportData.employeePerformance.map(emp => [
          emp.name,
          emp.role,
          emp.totalCount,
          emp.treatedCount,
          emp.rejectedCount,
          `${emp.treatedPercentage.toFixed(1)}%`,
          `${emp.avgResolutionHours.toFixed(1)}h`
        ]);
  
        autoTablePlugin(doc, {
          startY: 30,
          head: [['Nom', 'Rôle', 'Total', 'Traités', 'Rejetés', 'Taux', 'Temps moyen']],
          body: empData,
          theme: 'striped',
        });
      }
  
      // Generate insights if enabled
      if (includeRecommendations) {
        doc.addPage();
        const insights = await generateAIInsights(reportData);
        
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185);
        doc.text('Recommandations', 20, 20);
  
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const splitInsights = doc.splitTextToSize(insights, 170);
        doc.text(splitInsights, 20, 30);
      }
  
      // Save and create URL
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(pdfUrl);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showPreview, setShowPreview] = useState(false);
  const [charts, setCharts] = useState<any>(null);

  useEffect(() => {
    if (reportData && Object.keys(reportData).length > 0) {
      generateCharts();
    }
  }, [reportData]);

  const generateCharts = () => {
    if (!reportData || !reportData.departmentStats || !reportData.employeePerformance || !reportData.guichetierPerformance) {
      return;
    }

    // Department Performance Chart Data
    const departmentChartData = reportData.departmentStats.map(dept => ({
      name: dept.department,
      'Taux de Traitement': parseFloat(dept.treatedPercentage.toFixed(1)),
      'Temps Moyen (h)': parseFloat(dept.avgResolutionHours.toFixed(1))
    }));

    // Employee Performance Chart Data
    const employeeChartData = reportData.employeePerformance.map(emp => ({
      name: emp.name,
      'Taux de Traitement': parseFloat(emp.treatedPercentage.toFixed(1)),
      'Temps Moyen (h)': parseFloat(emp.avgResolutionHours.toFixed(1))
    }));

    // Guichetier Performance Chart Data
    const guichetierChartData = reportData.guichetierPerformance.map(g => ({
      name: g.name,
      'Taux de Traitement': parseFloat(g.treatedPercentage.toFixed(1)),
      'Temps Moyen (h)': parseFloat(g.avgResolutionHours.toFixed(1))
    }));

    setCharts({
      departments: departmentChartData,
      employees: employeeChartData,
      guichetiers: guichetierChartData
    });
  };

  // Modify your return statement to include both preview and normal view
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Génération de Rapports</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Masquer' : 'Aperçu'}
          </Button>
          <Button
            onClick={generatePDF}
            disabled={loading || !reportData}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration du Rapport</CardTitle>
          <CardDescription>
            Personnalisez les paramètres de votre rapport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
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
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de Rapport</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Rapport Complet</SelectItem>
                  <SelectItem value="departments">Départements</SelectItem>
                  <SelectItem value="employees">Employés</SelectItem>
                  <SelectItem value="guichetiers">Guichetiers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Département</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
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
                id="recommendations"
                checked={includeRecommendations}
                onCheckedChange={(checked) => setIncludeRecommendations(checked as boolean)}
              />
              <label htmlFor="recommendations" className="text-sm font-medium">
                Inclure les recommandations (IA)
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes Additionnelles</label>
            <Textarea
              placeholder="Ajoutez des notes ou commentaires spécifiques..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            {pdfUrl && (
              <Button variant="outline" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Prévisualiser
                </a>
              </Button>
            )}
            <Button
              onClick={generatePDF}
              disabled={loading || !reportData || generatingInsights}
            >
              {loading || generatingInsights ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {generatingInsights ? 'Analyse IA...' : 'Génération...'}
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

      {pdfUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du Rapport</CardTitle>
          </CardHeader>
          <CardContent className="h-[600px]">
            <iframe 
              src={pdfUrl} 
              width="100%" 
              height="100%"
              className="border rounded-lg"
              title="Aperçu du rapport"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}