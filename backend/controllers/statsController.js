const Reclamation = require("../models/Reclamation");
const User = require("../models/User");

// Enhanced getDashboardStats to handle multiple departments
exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.query;
    
    const filter = {};
    
    // Date filtering
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Department filtering
    if (department && department !== 'all') {
      const departments = department.split(',');
      filter.department = departments.length > 1 ? { $in: departments } : departments[0];
    }
    
    // Status filtering
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [statusStats, departmentStats, employeeStats, guichetierStats] = await Promise.all([
      this.getStatusDistribution(filter),
      this.getDepartmentStats(filter),
      this.getEmployeePerformance(filter),
      this.getGuichetierPerformance(filter)
    ]);

    // Calculate overall stats
    const totalReclamations = statusStats.reduce((sum, item) => sum + item.count, 0);
    const treated = statusStats.find(s => s.status === 'traitée')?.count || 0;
    const rejected = statusStats.find(s => s.status === 'rejetée')?.count || 0;
    const resolutionRate = totalReclamations > 0 ? (treated / totalReclamations) * 100 : 0;
    
    const avgResolutionTime = departmentStats.reduce((sum, dept) => {
      return sum + (dept.avgResolutionHours || 0);
    }, 0) / (departmentStats.length || 1);

    res.json({
      statusDistribution: statusStats,
      departmentStats,
      employeePerformance: employeeStats,
      guichetierPerformance: guichetierStats,
      overallStats: {
        totalReclamations,
        treated,
        rejected,
        resolutionRate,
        avgResolutionTime
      },
      filters: {
        startDate,
        endDate,
        department,
        status
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get reclamations with filters
exports.getReclamations = async (req, res) => {
  try {
    const { startDate, endDate, department, status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    
    // Date filtering
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Department filtering
    if (department && department !== 'all') {
      const departments = department.split(',');
      filter.department = departments.length > 1 ? { $in: departments } : departments[0];
    }
    
    // Status filtering
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    const [reclamations, total] = await Promise.all([
      Reclamation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('employeeId', 'firstName lastName role')
        .populate('guichetierId', 'firstName lastName role'),
      Reclamation.countDocuments(filter)
    ]);

    // Format response
    const formattedReclamations = reclamations.map(rec => {
      const assignee = rec.employeeId || rec.guichetierId;
      return {
        ...rec._doc,
        assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Non assigné',
        assigneeRole: assignee?.role || '',
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt
      };
    });

    res.status(200).json({ 
      success: true,
      data: formattedReclamations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Error fetching reclamations:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
};

// Helper methods
exports.getStatusDistribution = async (filter = {}) => {
  return await Reclamation.aggregate([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
    { $sort: { count: -1 } }
  ]);
};

exports.getDepartmentStats = async (filter = {}) => {
  return await Reclamation.aggregate([
    { $match: filter },
    { $group: {
        _id: "$department",
        total: { $sum: 1 },
        treated: { $sum: { $cond: [{ $eq: ["$status", "traitée"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "en attente"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejetée"] }, 1, 0] } },
        totalHours: { $sum: { $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 3600000] } }
    }},
    { $project: {
        department: "$_id",
        total: 1,
        treated: 1,
        pending: 1,
        rejected: 1,
        treatedPercentage: { 
          $cond: [
            { $eq: ["$total", 0] },
            0,
            { $multiply: [{ $divide: ["$treated", "$total"] }, 100] }
          ]
        },
        avgResolutionHours: { 
          $cond: [
            { $eq: ["$treated", 0] },
            0,
            { $divide: ["$totalHours", "$treated"] }
          ]
        }
    }},
    { $sort: { total: -1 } }
  ]);
};

exports.getEmployeePerformance = async (filter = {}, limit = 10) => {
  return await Reclamation.aggregate([
    { 
      $match: { 
        ...filter, 
        employeeId: { $exists: true },
        status: { $in: ["traitée", "rejetée"] } 
      } 
    },
    { 
      $group: {
        _id: "$employeeId",
        totalCount: { $sum: 1 },
        treatedCount: { $sum: { $cond: [{ $eq: ["$status", "traitée"] }, 1, 0] } },
        rejectedCount: { $sum: { $cond: [{ $eq: ["$status", "rejetée"] }, 1, 0] } },
        totalHours: { $sum: { $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 3600000] } },
        departments: { $addToSet: "$department" }
      }
    },
    { 
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "employee"
      }
    },
    { $unwind: "$employee" },
    { 
      $project: {
        userId: "$_id",
        name: { $concat: ["$employee.firstName", " ", "$employee.lastName"] },
        role: "$employee.role",
        departmentCount: { $size: "$departments" },
        totalCount: 1,
        treatedCount: 1,
        rejectedCount: 1,
        treatedPercentage: {
          $multiply: [
            { $divide: ["$treatedCount", { $max: ["$totalCount", 1] }] },
            100
          ]
        },
        rejectedPercentage: {
          $multiply: [
            { $divide: ["$rejectedCount", { $max: ["$totalCount", 1] }] },
            100
          ]
        },
        avgResolutionHours: { 
          $cond: [
            { $eq: ["$treatedCount", 0] },
            0,
            { $divide: ["$totalHours", "$treatedCount"] }
          ]
        }
      }
    },
    { $sort: { totalCount: -1 } },
    { $limit: limit }
  ]);
};

exports.getGuichetierPerformance = async (filter = {}, limit = 10) => {
  return await Reclamation.aggregate([
    { 
      $match: { 
        ...filter, 
        guichetierId: { $exists: true },
        status: { $in: ["traitée", "rejetée"] }
      } 
    },
    { 
      $group: {
        _id: "$guichetierId",
        totalCount: { $sum: 1 },
        treatedCount: { $sum: { $cond: [{ $eq: ["$status", "traitée"] }, 1, 0] } },
        rejectedCount: { $sum: { $cond: [{ $eq: ["$status", "rejetée"] }, 1, 0] } },
        totalHours: { $sum: { $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 3600000] } },
        departments: { $addToSet: "$department" }
      }
    },
    { 
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "guichetier"
      }
    },
    { $unwind: "$guichetier" },
    { 
      $project: {
        userId: "$_id",
        name: { $concat: ["$guichetier.firstName", " ", "$guichetier.lastName"] },
        role: "$guichetier.role",
        departmentCount: { $size: "$departments" },
        totalCount: 1,
        treatedCount: 1,
        rejectedCount: 1,
        treatedPercentage: {
          $multiply: [
            { $divide: ["$treatedCount", { $max: ["$totalCount", 1] }] },
            100
          ]
        },
        rejectedPercentage: {
          $multiply: [
            { $divide: ["$rejectedCount", { $max: ["$totalCount", 1] }] },
            100
          ]
        },
        avgResolutionHours: { 
          $cond: [
            { $eq: ["$treatedCount", 0] },
            0,
            { $divide: ["$totalHours", "$treatedCount"] }
          ]
        }
      }
    },
    { $sort: { totalCount: -1 } },
    { $limit: limit }
  ]);
};

exports.generateReport = async (req, res) => {
  try {
    const { startDate, endDate, department, reportType } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (department && department !== 'all') {
      filter.department = department;
    }

    // Fetch all required data based on report type
    const reportData = {
      departmentStats: [],
      employeePerformance: [],
      guichetierPerformance: [],
      overallStats: {},
      trends: {},
      recommendations: []
    };

    // Get department statistics with extended metrics
    if (reportType === 'all' || reportType === 'departments') {
      reportData.departmentStats = await this.getDepartmentStats(filter);
      
      // Add trend analysis for departments
      const previousPeriodFilter = {
        ...filter,
        createdAt: {
          $gte: new Date(new Date(startDate).setDate(new Date(startDate).getDate() - 30)),
          $lte: new Date(startDate)
        }
      };
      const previousStats = await this.getDepartmentStats(previousPeriodFilter);
      
      reportData.trends.departments = reportData.departmentStats.map(dept => {
        const previousDept = previousStats.find(p => p.department === dept.department);
        return {
          department: dept.department,
          treatmentTrend: previousDept ? 
            ((dept.treatedPercentage - previousDept.treatedPercentage) / previousDept.treatedPercentage * 100).toFixed(1) : 0,
          volumeTrend: previousDept ? 
            ((dept.total - previousDept.total) / previousDept.total * 100).toFixed(1) : 0
        };
      });
    }

    // Get employee performance with detailed metrics
    if (reportType === 'all' || reportType === 'employees') {
      const [employeeStats, employeeTrends] = await Promise.all([
        this.getEmployeePerformance(filter, 50),
        this.getEmployeePerformanceTrends(filter)
      ]);

      reportData.employeePerformance = employeeStats.map(emp => ({
        ...emp,
        performance: {
          efficiency: (emp.treatedCount / (emp.totalCount || 1) * 100).toFixed(1),
          quality: ((emp.treatedCount - emp.rejectedCount) / (emp.treatedCount || 1) * 100).toFixed(1),
          speed: emp.avgResolutionHours.toFixed(1)
        },
        trend: employeeTrends.find(t => t.userId.toString() === emp.userId.toString())
      }));

      // Top performers by different metrics
      reportData.topPerformers = {
        efficiency: [...reportData.employeePerformance]
          .sort((a, b) => b.performance.efficiency - a.performance.efficiency)
          .slice(0, 5),
        speed: [...reportData.employeePerformance]
          .sort((a, b) => a.performance.speed - b.performance.speed)
          .slice(0, 5),
        quality: [...reportData.employeePerformance]
          .sort((a, b) => b.performance.quality - a.performance.quality)
          .slice(0, 5)
      };
    }

    // Get guichetier performance with detailed analysis
    if (reportType === 'all' || reportType === 'guichetiers') {
      const guichetierStats = await this.getGuichetierPerformance(filter, 50);
      
      reportData.guichetierPerformance = guichetierStats.map(g => ({
        ...g,
        performance: {
          submissionQuality: ((g.treatedCount - g.rejectedCount) / (g.totalCount || 1) * 100).toFixed(1),
          volumeHandled: g.totalCount,
          avgProcessingTime: g.avgResolutionHours.toFixed(1)
        }
      }));
    }

    // Calculate overall statistics
    const statusStats = await this.getStatusDistribution(filter);
    const totalReclamations = statusStats.reduce((sum, item) => sum + item.count, 0);
    const treated = statusStats.find(s => s.status === 'traitée')?.count || 0;
    const rejected = statusStats.find(s => s.status === 'rejetée')?.count || 0;

    reportData.overallStats = {
      totalReclamations,
      treated,
      rejected,
      resolutionRate: totalReclamations > 0 ? (treated / totalReclamations * 100).toFixed(1) : 0,
      avgResolutionTime: reportData.departmentStats.reduce((sum, dept) => 
        sum + (dept.avgResolutionHours || 0), 0) / (reportData.departmentStats.length || 1),
      periodComparison: await this.getPeriodComparison(filter, startDate, endDate)
    };

    res.json({
      success: true,
      data: reportData,
      filters: {
        startDate,
        endDate,
        department,
        reportType
      }
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Add this helper method for period comparison
exports.getPeriodComparison = async (filter, startDate, endDate) => {
  const previousPeriodFilter = {
    ...filter,
    createdAt: {
      $gte: new Date(new Date(startDate).setDate(new Date(startDate).getDate() - 30)),
      $lte: new Date(startDate)
    }
  };

  const [currentStats, previousStats] = await Promise.all([
    this.getStatusDistribution(filter),
    this.getStatusDistribution(previousPeriodFilter)
  ]);

  const currentTotal = currentStats.reduce((sum, item) => sum + item.count, 0);
  const previousTotal = previousStats.reduce((sum, item) => sum + item.count, 0);

  return {
    volumeChange: previousTotal ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 0,
    previousPeriodTotal: previousTotal,
    currentPeriodTotal: currentTotal
  };
};

// Add this helper method for employee performance trends
exports.getEmployeePerformanceTrends = async (filter) => {
  const previousPeriodFilter = {
    ...filter,
    createdAt: {
      $gte: new Date(new Date(filter.createdAt.$gte).setDate(new Date(filter.createdAt.$gte).getDate() - 30)),
      $lte: new Date(filter.createdAt.$gte)
    }
  };

  const previousStats = await this.getEmployeePerformance(previousPeriodFilter);
  
  return previousStats.map(prev => ({
    userId: prev.userId,
    performanceChange: {
      volume: ((prev.totalCount - prev.previousCount) / (prev.previousCount || 1) * 100).toFixed(1),
      efficiency: ((prev.treatedPercentage - prev.previousTreatedPercentage) / (prev.previousTreatedPercentage || 1) * 100).toFixed(1)
    }
  }));
};