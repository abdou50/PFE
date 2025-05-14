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

interface DepartmentDetail {
  id: string;
  title: string;
  status: string;
  user: string;
  createdAt: string;
}

interface DashboardStats {
  statusDistribution: StatusStat[];
  departmentStats: DepartmentStat[];
  employeePerformance: EmployeePerformance[];
}

interface DepartmentStats {
  statusStats: StatusStat[];
  recentActivity: DepartmentDetail[];
}

export function useReclamationStats() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    statusDistribution: [],
    departmentStats: [],
    employeePerformance: []
  });

  const [departmentStats, setDepartmentStats] = useState<DepartmentStats>({
    statusStats: [],
    recentActivity: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/reclamations/stats/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');

      const data = await response.json();
      
      setDashboardStats({
        statusDistribution: data.statusDistribution,
        departmentStats: data.departmentStats.map((dept: any) => ({
          ...dept,
          treatedPercentage: `${dept.treatedPercentage}%`
        })),
        employeePerformance: data.employeePerformance
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStats = async (department: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedDepartment(department);
      
      const response = await fetch(`/api/reclamations/stats/department/${department}`);
      if (!response.ok) throw new Error('Failed to fetch department stats');

      const data = await response.json();
      setDepartmentStats({
        statusStats: data.statusStats,
        recentActivity: data.recentActivity.map((activity: any) => ({
          ...activity,
          createdAt: new Date(activity.createdAt).toLocaleDateString()
        }))
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
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
    departmentStats,
    selectedDepartment,
    
    // State
    loading,
    error,
    
    // Actions
    fetchDashboardStats,
    fetchDepartmentStats,
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
        
    getStatusPercentage: (status: string) => {
      const total = dashboardStats.statusDistribution.reduce((sum, item) => sum + item.count, 0);
      const statusData = dashboardStats.statusDistribution.find(item => item.status === status);
      return statusData ? Math.round((statusData.count / total) * 100) : 0;
    }
  };
}