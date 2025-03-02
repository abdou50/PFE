const Reclamation = require("../models/Reclamation");


exports.getReclamations = async (req, res) => {
  try {
    const reclamations = await Reclamation.find().populate("userId", "firstName lastName email");
    res.json(reclamations);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getReclamationById = async (req, res) => {
  try {
    const reclamation = await Reclamation.findById(req.params.id).populate("userId", "firstName lastName email");
    if (!reclamation) return res.status(404).json({ msg: "Reclamation not found" });
    res.json(reclamation);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


exports.createReclamation = async (req, res) => {
  try {
    const reclamation = new Reclamation(req.body);
    await reclamation.save();
    res.status(201).json({ msg: "Reclamation created successfully", reclamation });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


exports.updateReclamation = async (req, res) => {
  try {
    const { status, feedback, guichetierId, employeeId } = req.body;
    const reclamation = await Reclamation.findByIdAndUpdate(
      req.params.id,
      { status, feedback, guichetierId, employeeId },
      { new: true }
    );
    if (!reclamation) return res.status(404).json({ msg: "Reclamation not found" });
    res.json({ msg: "Reclamation updated successfully", reclamation });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


exports.deleteReclamation = async (req, res) => {
  try {
    const reclamation = await Reclamation.findByIdAndDelete(req.params.id);
    if (!reclamation) return res.status(404).json({ msg: "Reclamation not found" });
    res.json({ msg: "Reclamation deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
