const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "guichetier", "employee", "director", "admin"], required: true },
  department: { type: String, enum: ["Madaniya", "Insaf", "Rached"], required: true },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
