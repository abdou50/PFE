const express = require("express");
const multer = require("multer");
const path = require("path");
const reclamationController = require("../controllers/reclamationController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/reclamations/"); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"), false);
    }
  },
});
router.use("/uploads/reclamations", express.static(path.join(__dirname, "../uploads/reclamations")));
router.post("/", upload.array("files", 10), reclamationController.createReclamation);
router.put("/:id", upload.array("files", 10), reclamationController.updateReclamation);
router.get("/user/:userId", reclamationController.getReclamationsByUserId);
router.get("/department/:department", reclamationController.getReclamationsByDepartment);
router.put("/:id/status", reclamationController.updateStatus);
router.get("/user/:userId/filter", reclamationController.getFilteredReclamations);
router.get("/:id", reclamationController.getReclamationById);
router.delete('/:id', reclamationController.deleteReclamation);
router.get('/employee/:employeeId', reclamationController.getReclamationsByEmployeeId);
router.get('/all', reclamationController.getAllReclamations);
module.exports = router;