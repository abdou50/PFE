const express = require("express");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getEmployeesByDepartment,
} = require("../controllers/userController");

const router = express.Router();

router.post('/login', loginUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/employees/by-department", getEmployeesByDepartment);


module.exports = router;
