const express = require("express");
const {
  getReclamations,
  getReclamationById,
  createReclamation,
  updateReclamation,
  deleteReclamation,
} = require("../controllers/reclamationController");

const router = express.Router();

router.get("/", getReclamations);
router.get("/:id", getReclamationById);
router.post("/", createReclamation);
router.put("/:id", updateReclamation);
router.delete("/:id", deleteReclamation);

module.exports = router;
