const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingcontroller');

// Meeting creation and basic access
router.post('/', meetingController.createMeeting);
router.get('/user/:userId', meetingController.getMeetingsByUserId);

// Department meetings with filtering
router.get('/department', meetingController.getDepartmentMeetings);

// Meeting management
router.put('/:meetingId/reschedule', meetingController.rescheduleMeeting);
router.put('/:meetingId/status', meetingController.updateMeetingStatus);

// Employee availability and listing
router.get('/availability', meetingController.getEmployeeAvailability);
router.get('/employees', meetingController.getAllEmployees);
// Meeting link management
// Employee-specific routes (place these before generic routes)
router.get('/employee/:employeeId', meetingController.getEmployeeMeetings);

// Meeting link routes
router.post('/:meetingId/generate-link', meetingController.generateAndSaveMeetingLink);
router.get('/:meetingId/link', meetingController.getMeetingLinkForUser);
router.put('/:meetingId/link', meetingController.updateMeetingLink);
router.get('/check-conflict', meetingController.checkMeetingConflict);

module.exports = router;