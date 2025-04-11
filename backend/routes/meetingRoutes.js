const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingcontroller');

// Get meetings by user ID
router.get('/user/:userId', meetingController.getMeetingsByUserId);

// Create new meeting
router.post('/', meetingController.createMeeting);

// Get all meetings by department
router.get('/department', meetingController.getMeetingsByDepartment);

// Assign meeting to employee
router.put('/assign/:meetingId', meetingController.assignMeeting);

module.exports = router;
