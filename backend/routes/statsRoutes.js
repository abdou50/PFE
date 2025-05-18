const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/dashboard', statsController.getDashboardStats);
router.get('/report', statsController.generateReport);

module.exports = router;
