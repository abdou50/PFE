const Reclamation = require("../models/Reclamation");

// Create a new reclamation
exports.createReclamation = async (req, res) => {
  try {
    const { firstName, department, type, ministre, description, userId } = req.body;
    const pdf = req.file ? req.file.path : null; // Save file path if uploaded

    console.log("Received data:", { firstName, department, type, ministre, description, pdf, userId }); // Debugging

    if (!userId) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    const newReclamation = new Reclamation({
      firstName,
      department,
      type,
      ministre,
      description,
      pdf,
      userId,
      status: "pending",
    });

    await newReclamation.save();
    console.log("Reclamation saved successfully:", newReclamation); // Debugging
    res.status(201).json({
      msg: "Reclamation created successfully",
      data: newReclamation,
    });
  } catch (err) {
    console.error("Error creating reclamation:", err); // Debugging
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Get reclamations by user ID
exports.getReclamationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching reclamations for user ID:", userId); // Debugging

    const reclamations = await Reclamation.find({ userId });
    if (reclamations.length === 0) {
      console.log("No reclamations found for user ID:", userId); // Debugging
      return res.status(404).json({ msg: "No reclamations found for this user" });
    }

    console.log("Reclamations fetched successfully:", reclamations); // Debugging
    res.status(200).json({ msg: "Reclamations retrieved successfully", data: reclamations });
  } catch (err) {
    console.error("Error fetching reclamations:", err); // Debugging
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};