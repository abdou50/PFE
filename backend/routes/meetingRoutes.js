const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingcontroller');

router.post('/', meetingController.createMeeting);
router.get('/user/:userId', meetingController.getMeetingsByUserId);
router.get('/department', meetingController.getDepartmentMeetings);
router.put('/:meetingId/reschedule', meetingController.rescheduleMeeting);
router.put('/:meetingId/status', meetingController.updateMeetingStatus);
router.get('/availability', meetingController.getEmployeeAvailability);
router.get('/employees', meetingController.getAllEmployees);
router.get('/employee/:employeeId', meetingController.getEmployeeMeetings);
router.post('/:meetingId/generate-link', meetingController.generateAndSaveMeetingLink);
router.get('/:meetingId/link', meetingController.getMeetingLinkForUser);
router.put('/:meetingId/link', meetingController.updateMeetingLink);
router.get('/check-conflict', meetingController.checkMeetingConflict);

module.exports = router;