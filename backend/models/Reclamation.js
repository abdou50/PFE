const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  department: { type: String, required: true },
  type: { type: String, required: true },
  ministre: { type: String, required: true },
  description: { type: String, required: true },
  service: { type: String, required: true }, // Add this line
  files: { type: [String], default: [] }, // Array of file paths
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  guichetierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Added
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Added
  status: { type: String, enum: ["brouillant", "envoyer", "en attente", "rejetée", "traitée"], default: "brouillant" },
  feedback: { type: String }, // Added for feedback
}, { timestamps: true });

module.exports = mongoose.model("Reclamation", ReclamationSchema);