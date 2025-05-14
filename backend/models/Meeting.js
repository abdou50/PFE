const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  department: { 
    type: String, 
    enum: ["Madaniya", "Insaf", "Rached"], 
    required: true 
  },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Demandé", "Planifié", "Terminé", "Annulé"],
    default: "Demandé"
  },
  meetingLink: {
    type: String,
    default: ""
  },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}); { timestamps: true };

module.exports = mongoose.model("Meeting", MeetingSchema);