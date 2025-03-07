const express = require("express");
const multer = require("multer");
const path = require("path");
const reclamationController = require("../controllers/reclamationController");

const router = express.Router();

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/reclamations/"); // Save PDFs to "uploads/reclamations" folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Routes
router.post("/", upload.single("pdf"), reclamationController.createReclamation);
router.get("/user/:userId", reclamationController.getReclamationsByUserId);

module.exports = router;