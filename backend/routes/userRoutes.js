const express = require("express");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getEmployeesByDepartment,
  getEmployeesWithSchedule ,
  exportUsers
} = require("../controllers/userController");
const router = express.Router();
router.post('/login', loginUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/employees/by-department", getEmployeesByDepartment);

router.get("/employees/schedule", getEmployeesWithSchedule);
router.get('/users/export', exportUsers);
module.exports = router;
