const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  guichetierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  department: { type: String, enum: ["Madaniya", "Insaf", "Rached"], required: true },
  type: { type: String, enum: ["Reclamation", "Service Request"], required: true },
  status: { type: String, enum: ["Pending", "Accepted", "In Progress", "Resolved", "Rejected"], default: "Pending" },
  description: String,
  feedback: String,
}, { timestamps: true });

module.exports = mongoose.model("Reclamation", ReclamationSchema);
