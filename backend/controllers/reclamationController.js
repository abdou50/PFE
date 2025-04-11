
const Reclamation = require("../models/Reclamation");
const fs = require("fs");
const path = require("path");

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

    // Find the existing reclamation
    const existingReclamation = await Reclamation.findById(id);
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
    existingReclamation.status = status || existingReclamation.status; // Update status if provided
    existingReclamation.guichetierId = guichetierId || existingReclamation.guichetierId; // Update guichetierId if provided
    existingReclamation.feedback = feedback || existingReclamation.feedback; // Update feedback if provided
    existingReclamation.employeeId = employeeId || existingReclamation.employeeId; // Update employeeId if provided

    // Save updated reclamation
    const updatedReclamation = await existingReclamation.save();

    // Return updated data to frontend
    res.status(200).json({
      msg: "Reclamation updated successfully",
      data: updatedReclamation,
    });
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
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback, employeeId, guichetierId } = req.body;

    // Validate the status
    const validStatuses = ["brouillant", "envoyer", "en attente", "rejetée", "traitée"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status provided" });
    }

    // Find the reclamation by ID and update its status
    const updatedReclamation = await Reclamation.findByIdAndUpdate(
      id,
      {
        status,
        feedback: status === "rejetée" || status === "traitée" ? feedback : undefined,
        guichetierId: status === "en attente" ? guichetierId : undefined,
        employeeId: status === "en attente" ? employeeId : undefined,
      },
      { new: true }
    );

    if (!updatedReclamation) {
      return res.status(404).json({ msg: "Reclamation not found" });
    }

    res.status(200).json({ msg: "Reclamation status updated successfully", data: updatedReclamation });
  } catch (err) {
    console.error("Error updating reclamation status:", err);
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
    const reclamation = await Reclamation.findById(id);

    if (!reclamation) {
      return res.status(404).json({ msg: "Reclamation not found" });
    }

    const formattedReclamation = {
      ...reclamation._doc,
      files: constructFileUrls(reclamation.files), // Construct full URLs for files
    };

    res.status(200).json({ msg: "Reclamation retrieved successfully", data: formattedReclamation });
  } catch (err) {
    console.error("Error fetching reclamation:", err);
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