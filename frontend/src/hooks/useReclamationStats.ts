import { useState, useEffect } from 'react';

interface StatusStat {
  status: string;
  count: number;
}

interface DepartmentStat {
  department: string;
  total: number;
  treated: number;
  pending: number;
  treatedPercentage: string;
}

interface EmployeePerformance {
  name: string;
  role: string;
  count: number;
  avgResolutionHours: number;
}

interface DashboardStats {
  statusDistribution: StatusStat[];
  departmentStats: DepartmentStat[];
  employeePerformance: EmployeePerformance[];
  trendAnalysis: {
    resolutionRate: number;
    month: string;
  };
  efficiencyStats: {
    averageEfficiency: number;
  };
}

export function useReclamationStats() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    statusDistribution: [],
    departmentStats: [],
    employeePerformance: [],
    trendAnalysis: {
      resolutionRate: 0,
      month: new Date().toLocaleString('default', { month: 'long' })
    },
    efficiencyStats: {
      averageEfficiency: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/reclamations/stats/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');

      const data = await response.json();
      
      // Calculate additional stats
      const resolutionRate = calculateResolutionRate(data.statusDistribution);
      const averageEfficiency = calculateAverageEfficiency(data.departmentStats);

      setDashboardStats({
        statusDistribution: data.statusDistribution,
        departmentStats: data.departmentStats.map((dept: any) => ({
          ...dept,
          treatedPercentage: `${dept.treatedPercentage}%`
        })),
        employeePerformance: data.employeePerformance,
        trendAnalysis: {
          resolutionRate,
          month: new Date().toLocaleString('default', { month: 'long' })
        },
        efficiencyStats: {
          averageEfficiency
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const calculateResolutionRate = (statusDistribution: StatusStat[]): number => {
    const treated = statusDistribution.find(s => s.status === 'traitée')?.count || 0;
    const total = statusDistribution.reduce((sum, item) => sum + item.count, 0);
    return total > 0 ? (treated / total) * 100 : 0;
  };

  const calculateAverageEfficiency = (departmentStats: DepartmentStat[]): number => {
    if (departmentStats.length === 0) return 0;
    const sum = departmentStats.reduce((sum, dept) => {
      return sum + parseFloat(dept.treatedPercentage);
    }, 0);
    return sum / departmentStats.length;
  };

  const generateReport = async (type: 'department' | 'employee', id: string) => {
    try {
      setLoading(true);
      
      const endpoint = type === 'department' 
        ? `/api/reclamations/stats/report/${id}`
        : `/api/reclamations/stats/report/employee/${encodeURIComponent(id)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY })
      });

      if (!response.ok) throw new Error(`Failed to generate ${type} report`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to generate ${type} report`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardStats(); }, []);

  return {
    // Data
    dashboardStats,
    
    // State
    loading,
    error,
    
    // Actions
    fetchDashboardStats,
    generateDepartmentReport: (department: string) => generateReport('department', department),
    generateEmployeeReport: (employeeName: string) => generateReport('employee', employeeName),
    
    // Helpers
    getTopDepartments: (count = 5) => 
      [...dashboardStats.departmentStats]
        .sort((a, b) => b.total - a.total)
        .slice(0, count),
        
    getTopEmployees: (count = 5) => 
      [...dashboardStats.employeePerformance]
        .sort((a, b) => b.count - a.count)
        .slice(0, count),
        
    getTrendAnalysis: () => dashboardStats.trendAnalysis,
    getEfficiencyStats: () => dashboardStats.efficiencyStats
  };
}