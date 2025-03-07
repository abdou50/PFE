const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    department: { type: String, required: true },
    type: { type: String, required: true, enum: ["Reclamation", "Data Request"] },
    ministre: { type: String, required: true },
    description: { type: String, required: true },
    pdf: { type: String }, // Path to the uploaded PDF file
    status: { type: String, default: "pending", enum: ["pending", "accepted", "rejected", "resolved"] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference to the user
    guichetierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the guichetier
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the employee
    feedback: { type: String }, // Feedback from the guichetier or employee
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reclamation", ReclamationSchema);