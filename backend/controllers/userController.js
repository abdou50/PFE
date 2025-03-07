const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      user: {
        userId: user._id, // Use user._id instead of User._id
        role: user.role,
        department: user.department,
        firstName: user.firstName,
      },
    };

    // Generate JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Log response data for debugging
    console.log("🚀 Backend Response Data:", {
      userId: user._id, // Corrected: Use user._id
      role: user.role,
      department: user.department,
      firstName: user.firstName,
    });

    // Send response to frontend
    res.json({
      token,
      userId: user._id, // Include userId in the response
      role: user.role,
      department: user.department,
      firstName: user.firstName,
    });
  } catch (err) {
    console.error("Error in loginUser:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get All Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error in getUsers:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error in getUserById:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Create User
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      department,
    });

    // Save user to database
    await user.save();
    res.status(201).json({ msg: "User registered successfully", user });
  } catch (err) {
    console.error("Error in createUser:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, role, department } = req.body;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, role, department },
      { new: true }
    );

    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User updated successfully", user });
  } catch (err) {
    console.error("Error in updateUser:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Error in deleteUser:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};