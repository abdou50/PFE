const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Helper function for error handling
const handleError = (res, err, context) => {
  console.error(`Error in ${context}:`, err.message);
  res.status(500).json({ msg: "Server error", error: err.message });
};

// Authentication
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = {
      user: {
        userId: user._id,
        role: user.role,
        department: user.department,
        firstName: user.firstName,
        ...(user.role === "user" && { 
          ministre: user.ministre,
          service: user.service
        }),
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      userId: user._id,
      role: user.role,
      department: user.department,
      firstName: user.firstName,
      ...(user.role === "user" && { 
        ministre: user.ministre,
        service: user.service
      }),
    });
  } catch (err) {
    handleError(res, err, "loginUser");
  }
};

// Configure email transporter (update with your SMTP details)
// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Add this to avoid self-signed certificate issues
  }
});

// Verify transporter connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, ministre, service } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    // Validate department for user, employee, and guichetier
    if (["user", "employee", "guichetier"].includes(role) && !department) {
      return res.status(400).json({ 
        msg: "Department is required for users, employees, and guichetiers" 
      });
    }

    // Validate ministre and service for users
    if (role === "user" && (!ministre || !service)) {
      return res.status(400).json({ 
        msg: "Ministre and service are required for users" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      department: ["user", "employee", "guichetier"].includes(role) ? department : undefined,
      ...(role === "user" && { ministre, service }),
    });

    await user.save();
    
    // Send welcome email
    try {
      const htmlTemplatePath = path.join(__dirname, '../email-templates/welcome-email.html');
      let htmlContent = fs.readFileSync(htmlTemplatePath, 'utf8');
      
      // Replace placeholders with proper conditional for department
      htmlContent = htmlContent
        .replace(/{{firstName}}/g, firstName)
        .replace(/{{lastName}}/g, lastName)
        .replace(/{{email}}/g, email)
        .replace(/{{password}}/g, password)
        .replace(/{{role}}/g, getFrenchRoleName(role))
        .replace(/\{\{#if department\}\}.*?\{\{\/if\}\}/gs, department ? `<p><strong>Département :</strong> ${department}</p>` : '')
        .replace(/{{loginUrl}}/g, process.env.FRONTEND_URL || 'http://localhost:3000');

      const mailOptions = {
        from: '"Centre National d\'Informatique" <noreply@cni.ma>',
        to: email,
        subject: 'Vos identifiants de compte - CNI',
        html: htmlContent,
        headers: {
          'X-Priority': '1',
          'X-Mailer': 'CNI Mailer'
        }
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      msg: "User created successfully", 
      user: userResponse 
    });
  } catch (err) {
    handleError(res, err, "createUser");
  }
};

// Helper function to translate roles to French
function getFrenchRoleName(role) {
  const roles = {
    admin: "Administrateur",
    employee: "Technicien",
    guichetier: "Guichetier",
    user: "Utilisateur",
    director: "Directeur"
  };
  return roles[role] || role;
}

exports.getUsers = async (req, res) => {
  try {
    const { role, department, sort = "desc" } = req.query;
    let query = {};

    if (role && role !== 'all') query.role = role;
    if (department && department !== 'all') query.department = department;

    const sortOrder = sort === "asc" ? 1 : -1;
    
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: sortOrder });

    res.json(users);
  } catch (err) {
    handleError(res, err, "getUsers");
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    handleError(res, err, "getUserById");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, ministre, service } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Email change validation
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ msg: "Email already in use" });
      }
      user.email = email;
    }

    // Update fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.role = role || user.role;
    user.department = department || user.department;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Handle ministre/service for users
    if (role === "user") {
      user.ministre = ministre;
      user.service = service;
    } else {
      user.ministre = undefined;
      user.service = undefined;
    }

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      msg: "User updated successfully", 
      user: userResponse 
    });
  } catch (err) {
    handleError(res, err, "updateUser");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Prevent deletion of last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ msg: "Cannot delete the last admin user" });
      }
    }

    await User.findByIdAndDelete(userId);
    res.json({ msg: "User deleted successfully", userId });
  } catch (err) {
    handleError(res, err, "deleteUser");
  }
};

// Specialized Queries
exports.getEmployeesByDepartment = async (req, res) => {
  try {
    const { department } = req.query;

    if (!department) {
      return res.status(400).json({ msg: "Department is required" });
    }

    const employees = await User.find({ 
      department, 
      role: "employee" 
    }).select("-password");

    res.json({ 
      msg: "Employees retrieved successfully", 
      data: employees 
    });
  } catch (err) {
    handleError(res, err, "getEmployeesByDepartment");
  }
};

exports.getEmployeesWithSchedule = async (req, res) => {
  try {
    const { department, date } = req.query;
    
    if (!department) {
      return res.status(400).json({ error: "Department is required" });
    }

    const employees = await User.aggregate([
      { 
        $match: { 
          department,
          role: 'employee'
        } 
      },
      {
        $lookup: {
          from: "meetings",
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employeeId", "$$employeeId"] },
                    { $eq: ["$status", "Planifié"] },
                    date ? { 
                      $eq: [
                        { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        { $dateToString: { format: "%Y-%m-%d", date: new Date(date) } }
                      ]
                    } : {}
                  ]
                }
              }
            },
            { $sort: { date: 1 } }
          ],
          as: "meetings"
        }
      },
      { $project: { password: 0 } }
    ]);

    res.json(employees);
  } catch (err) {
    handleError(res, err, "getEmployeesWithSchedule");
  }
};

// Data Export
exports.exportUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    
    // CSV Header
    let csv = 'Nom,Prénom,Email,Rôle,Produit CNI,Ministre,Service,Date création\n';
    
    // CSV Rows
    users.forEach(user => {
      csv += `"${user.lastName}","${user.firstName}","${user.email}",` +
             `"${translateRole(user.role)}",` +
             `"${user.department}",` +
             `"${user.ministre || ''}","${user.service || ''}",` +
             `"${new Date(user.createdAt).toLocaleDateString('fr-FR')}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('utilisateurs.csv');
    return res.send(csv);
  } catch (err) {
    handleError(res, err, "exportUsers");
  }
};

// Helper function for role translation
function translateRole(role) {
  const roles = {
    admin: "Administrateur",
    employee: "Technicien",
    guichetier: "Guichetier",
    user: "Utilisateur",
    director: "Directeur"
  };
  return roles[role] || role;
}