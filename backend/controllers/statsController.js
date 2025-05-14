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