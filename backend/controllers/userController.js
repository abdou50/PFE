const User = require("../models/User");
const bcrypt = require("bcryptjs");

const jwt = require('jsonwebtoken');

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        department: user.department,
        firstName: user.firstName, // ✅ Use the correct field name
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("🚀 Backend Response Data:", {
      token,
      role: user.role,
      department: user.department,
      firstName: user.firstName, // ✅ Debugging
    });

    return res.json({
      token,
      role: user.role,
      department: user.department,
      firstName: user.firstName, // ✅ Send correct field name to frontend
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ firstName, lastName, email, password: hashedPassword, role, department });

    await user.save();
    res.status(201).json({ msg: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, role, department } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { firstName, lastName, role, department }, { new: true });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};
