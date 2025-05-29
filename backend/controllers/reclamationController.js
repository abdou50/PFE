
const Reclamation = require("../models/Reclamation");
const fs = require("fs");
const path = require("path");
const nodemailer = require('nodemailer');

// Helper function to construct file URLs
const constructFileUrls = (files) => {
  // Return the file paths as they are stored in the database
  return files;
};

// Helper function to create a directory if it doesn't exist
const createDirectoryIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create a new reclamation with multiple files
exports.createReclamation = async (req, res) => {
  try {
    const { title, firstName, department, type, ministre, description, userId, status } = req.body;

    if (!userId) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    // Validate the status
    const validStatuses = ["brouillant", "envoyer", "en attente", "rejetée", "traitée"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status provided" });
    }

    // Create a new reclamation
    const newReclamation = new Reclamation({
      title,
      firstName,
      department,
      type,
      ministre,
      description,
      service: req.body.service, // Add this line

      files: [], // Initialize files array
      userId,
      status: status || "brouillant", // Default to "brouillant" if status is not provided
    });

    // Save the reclamation to the database to get the ID
    const savedReclamation = await newReclamation.save();

    // Create a directory for the reclamation's files
    const reclamationDir = path.join(__dirname, `../uploads/reclamations/${savedReclamation._id}`);
    createDirectoryIfNotExists(reclamationDir);

    // Move uploaded files to the reclamation's directory
    if (req.files && req.files.length > 0) {
      const files = req.files.map((file) => {
        const newPath = path.join(reclamationDir, file.filename);
        fs.renameSync(file.path, newPath);
        return `/uploads/reclamations/${savedReclamation._id}/${file.filename}`;
      });

      savedReclamation.files = files;
      await savedReclamation.save();
    }

    res.status(201).json({
      msg: `Reclamation created successfully with status: ${savedReclamation.status}`,
      data: savedReclamation,
    });
  } catch (err) {
    console.error("Error creating reclamation:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Update a reclamation with multiple files
exports.updateReclamation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, filesToDelete, status, guichetierId, feedback, employeeId } = req.body;
    const newFiles = req.files ? req.files.map((file) => `/uploads/reclamations/${id}/${file.filename}`) : [];

    // Find the existing reclamation and populate user details
    const existingReclamation = await Reclamation.findById(id).populate({
      path: 'userId',
      select: 'firstName lastName email'
    });
    
    if (!existingReclamation) {
      return res.status(404).json({ msg: "Reclamation not found" });
    }

    // Remove files from the folder and the database
    if (filesToDelete && filesToDelete.length > 0) {
      let filesToDeleteArray;
      try {
        // Attempt to parse filesToDelete as JSON
        filesToDeleteArray = JSON.parse(filesToDelete);
      } catch (err) {
        // If parsing fails, assume filesToDelete is already an array
        filesToDeleteArray = Array.isArray(filesToDelete) ? filesToDelete : [filesToDelete];
      }

      filesToDeleteArray.forEach((file) => {
        const filePath = path.join(__dirname, `../${file}`); // Construct the full file path
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Delete the file from the filesystem
        }
      });
      existingReclamation.files = existingReclamation.files.filter((file) => !filesToDeleteArray.includes(file));
    }

    // Move new files to the reclamation's directory
    const reclamationDir = path.join(__dirname, `../uploads/reclamations/${id}`);
    if (!fs.existsSync(reclamationDir)) {
      fs.mkdirSync(reclamationDir, { recursive: true });
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const newPath = path.join(reclamationDir, file.filename);
        fs.renameSync(file.path, newPath);
      });
      existingReclamation.files.push(...newFiles);
    }

    // Update fields
    existingReclamation.title = title || existingReclamation.title;
    existingReclamation.description = description || existingReclamation.description;
    existingReclamation.status = status || existingReclamation.status;
    if (guichetierId) existingReclamation.guichetierId = guichetierId;
    if (employeeId) existingReclamation.employeeId = employeeId;
    if (feedback) existingReclamation.feedback = feedback;
    
    // Update additional fields if provided
    if (req.body.firstName) existingReclamation.firstName = req.body.firstName;
    if (req.body.department) existingReclamation.department = req.body.department;
    if (req.body.type) existingReclamation.type = req.body.type;
    if (req.body.ministre) existingReclamation.ministre = req.body.ministre;
    if (req.body.service) existingReclamation.service = req.body.service;

    // Check if status change requires email
    const isStatusChangeRequiringEmail = 
      (status === "en attente" || status === "traitée" || status === "rejetée") &&
      feedback &&
      existingReclamation.userId?.email;

    const updatedReclamation = await existingReclamation.save();

    // Send email for status changes with feedback
    if (isStatusChangeRequiringEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const statusColor = {
          'en attente': '#ffa500',
          'traitée': '#28a745',
          'rejetée': '#dc3545'
        };

        const statusMessage = {
          'en attente': 'Votre réclamation a été prise en charge',
          'traitée': 'Votre réclamation a été traitée',
          'rejetée': 'Votre réclamation a été rejetée'
        };

        const emailTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .status { 
                display: inline-block; 
                padding: 5px 10px; 
                border-radius: 4px; 
                color: white;
                background-color: ${statusColor[status]};
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>CNI - Mise à jour de votre réclamation</h2>
              </div>
              <div class="content">
                <p>Bonjour ${existingReclamation.userId.firstName} ${existingReclamation.userId.lastName},</p>
                <p>${statusMessage[status]}</p>
                <p><strong>Référence:</strong> ${existingReclamation._id}</p>
                <p><strong>Titre:</strong> ${existingReclamation.title}</p>
                <p><strong>Nouveau statut:</strong> <span class="status">${status.toUpperCase()}</span></p>
                <h3>Message:</h3>
                <p>${feedback}</p>
                <p>Cordialement,<br>L'équipe CNI</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: {
            name: 'CNI Service Réclamations',
            address: process.env.SMTP_USER
          },
          to: existingReclamation.userId.email,
          subject: `[CNI] ${statusMessage[status]}`,
          html: emailTemplate
        });

        console.log('Email sent successfully to:', existingReclamation.userId.email);
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
      }
    }
    
    // Populate the user details before sending response
    const populatedReclamation = await Reclamation.findById(updatedReclamation._id)
      .populate('employeeId', 'firstName lastName _id')
      .populate('guichetierId', 'firstName lastName _id')
      .populate('userId', 'firstName lastName email');

    res.json(populatedReclamation);
  } catch (err) {
    console.error("Error updating reclamation:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get reclamations by user ID
exports.getReclamationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const reclamations = await Reclamation.find({ userId });
    const formattedReclamations = reclamations.map((rec) => ({
      ...rec._doc,
      files: constructFileUrls(rec.files), // Construct full URLs for files
    }));
    res.status(200).json({ msg: "Reclamations retrieved successfully", data: formattedReclamations });
  } catch (err) {
    console.error("Error fetching reclamations:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get reclamations by department
exports.getReclamationsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const reclamations = await Reclamation.find({ department });
    if (reclamations.length === 0) {
      return res.status(404).json({ msg: "No reclamations found for this department" });
    }

    const formattedReclamations = reclamations.map((rec) => ({
      ...rec._doc,
      files: constructFileUrls(rec.files), // Construct full URLs for files
    }));
    res.status(200).json({ msg: "Reclamations retrieved successfully", data: formattedReclamations });
  } catch (err) {
    console.error("Error fetching reclamations by department:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Update reclamation status
// Update the updateStatus function
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, employeeId, guichetierId } = req.body;

    // Validate the status
    const validStatuses = ["brouillant", "envoyer", "en attente", "rejetée", "traitée"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status provided" });
    }

    // Find the reclamation and populate user details with email
    const reclamation = await Reclamation.findById(id)
      .populate({
        path: 'userId',
        select: 'firstName lastName email'
      });
    
    if (!reclamation) {
      return res.status(404).json({ msg: "Reclamation not found" });
    }

    // Check if status is changing to "en attente", "traitée" or "rejetée" and has feedback
    const isStatusChangeRequiringEmail = 
      (status === "en attente" || status === "traitée" || status === "rejetée") &&
      feedback &&
      reclamation.userId?.email;

    // Update the reclamation
    reclamation.status = status;
    reclamation.feedback = feedback || reclamation.feedback;
    reclamation.guichetierId = status === "en attente" ? guichetierId : reclamation.guichetierId;
    reclamation.employeeId = status === "en attente" ? employeeId : reclamation.employeeId;

    const updatedReclamation = await reclamation.save();

    // Send email for status changes with feedback
    if (isStatusChangeRequiringEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Customize email template based on status
        const statusColor = {
          'en attente': '#ffa500',  // Orange for in progress
          'traitée': '#28a745',     // Green for treated
          'rejetée': '#dc3545'      // Red for rejected
        };

        const statusMessage = {
          'en attente': 'Votre réclamation a été prise en charge',
          'traitée': 'Votre réclamation a été traitée',
          'rejetée': 'Votre réclamation a été rejetée'
        };

        const emailTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .status { 
                display: inline-block; 
                padding: 5px 10px; 
                border-radius: 4px; 
                color: white;
                background-color: ${statusColor[status]};
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>CNI - Mise à jour de votre réclamation</h2>
              </div>
              <div class="content">
                <p>Bonjour ${reclamation.userId.firstName} ${reclamation.userId.lastName},</p>
                <p>${statusMessage[status]}</p>
                <p><strong>Référence:</strong> ${reclamation._id}</p>
                <p><strong>Titre:</strong> ${reclamation.title}</p>
                <p><strong>Nouveau statut:</strong> <span class="status">${status.toUpperCase()}</span></p>
                <h3>Message:</h3>
                <p>${feedback}</p>
                <p>Cordialement,<br>L'équipe CNI</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: {
            name: 'CNI Service Réclamations',
            address: process.env.SMTP_USER
          },
          to: reclamation.userId.email,
          subject: `[CNI] ${statusMessage[status]}`,
          html: emailTemplate
        });

        console.log('Email sent successfully to:', reclamation.userId.email);
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
      }
    }

    res.status(200).json({ 
      msg: "Reclamation status updated successfully", 
      data: updatedReclamation,
      emailSent: isStatusChangeRequiringEmail
    });
  } catch (err) {
    console.error('Error in updateStatus:', err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
// Get filtered reclamations by user ID, type, and status
exports.getFilteredReclamations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, status } = req.query;

    // Build the filter object
    const filter = { userId, status: { $ne: "brouillant" } }; // Exclude "brouillant"

    if (type) filter.type = type;
    if (status && status !== "brouillant") filter.status = status; // Allow filtering, but ignore "brouillant"

    const reclamations = await Reclamation.find(filter);
    const formattedReclamations = reclamations.map((rec) => ({
      ...rec._doc,
      files: constructFileUrls(rec.files), // Construct full URLs for files
    }));

    if (formattedReclamations.length === 0) {
      return res.status(200).json({ msg: "No reclamations found", data: [] });
    }

    res.status(200).json({ msg: "Filtered reclamations retrieved successfully", data: formattedReclamations });
  } catch (err) {
    console.error("Error fetching filtered reclamations:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get a single reclamation by ID
exports.getReclamationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Special case for "all" - return all reclamations
    if (id === "all") {
      const reclamations = await Reclamation.find()
        .populate('userId', 'firstName lastName email')
        .populate('employeeId', 'firstName lastName')
        .populate('guichetierId', 'firstName lastName')
        .sort({ createdAt: -1 });

      const formattedReclamations = reclamations.map(rec => ({
        ...rec._doc,
        files: constructFileUrls(rec.files),
      }));

      return res.status(200).json({
        msg: "All reclamations retrieved successfully",
        data: formattedReclamations
      });
    }

    // Regular case - find by ID
    const reclamation = await Reclamation.findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('employeeId', 'firstName lastName')
      .populate('guichetierId', 'firstName lastName');

    if (!reclamation) {
      return res.status(404).json({ msg: "Reclamation not found" });
    }

    const formattedReclamation = {
      ...reclamation._doc,
      files: constructFileUrls(reclamation.files),
    };

    res.status(200).json({ msg: "Reclamation retrieved successfully", data: formattedReclamation });
  } catch (err) {
    console.error("Error fetching reclamation:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
// Get all reclamations with populated user details
exports.getAllReclamations = async (req, res) => {
  try {
    const reclamations = await Reclamation.find()
      .populate('userId', 'firstName lastName email')
      .populate('employeeId', 'firstName lastName')
      .populate('guichetierId', 'firstName lastName')
      .sort({ createdAt: -1 });

    const formattedReclamations = reclamations.map(rec => ({
      ...rec._doc,
      files: constructFileUrls(rec.files),
    }));

    res.status(200).json({
      msg: "All reclamations retrieved successfully",
      data: formattedReclamations
    });
  } catch (err) {
    console.error("Error fetching reclamations:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
// In your reclamation controller
exports.deleteReclamation = async (req, res) => {
  try {
    const reclamation = await Reclamation.findByIdAndDelete(req.params.id);
    if (!reclamation) {
      return res.status(404).json({ message: "Reclamation not found" });
    }
    res.status(200).json({ message: "Reclamation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};// Get reclamations by employee ID
exports.getReclamationsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Find all reclamations assigned to this employee
    const reclamations = await Reclamation.find({ 
      employeeId: employeeId,
      status: { $ne: "brouillant" } // Exclude drafts
    }).sort({ createdAt: -1 }); // Sort by newest first

    // Format the reclamations with proper file URLs
    const formattedReclamations = reclamations.map((rec) => ({
      ...rec._doc,
      files: constructFileUrls(rec.files),
    }));

    res.status(200).json({ 
      msg: "Reclamations retrieved successfully", 
      data: formattedReclamations 
    });
  } catch (err) {
    console.error("Error fetching reclamations by employee ID:", err);
    res.status(500).json({ 
      msg: "Server error", 
      error: err.message 
    });
  }
};