const Meeting = require("../models/Meeting");
const mongoose = require("mongoose");

// Get meetings by user ID
exports.getMeetingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const meetings = await Meeting.find({ userId })
      .sort({ date: -1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Create meeting
exports.createMeeting = async (req, res) => {
  try {
    const { userId, department, date } = req.body;

    if (!userId || !department || !date) {
      return res.status(400).json({ error: "Tous les champs sont obligatoires" });
    }

    const meetingDate = new Date(date);
    if (meetingDate.getHours() < 9 || meetingDate.getHours() >= 17) {
      return res.status(400).json({ error: "Les rendez-vous sont disponibles entre 9h et 17h" });
    }

    const meeting = new Meeting({
      userId,
      department,
      date: meetingDate,
      status: "Demandé"
    });

    await meeting.save();
    res.status(201).json(meeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
// Get all meetings by department
exports.getMeetingsByDepartment = async (req, res) => {
  try {
    const { department } = req.query;

    if (!department) {
      return res.status(400).json({ error: "Department is required" });
    }

    const meetings = await Meeting.find({ department })
      .populate('userId', 'firstName lastName')
      .sort({ date: 1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching meetings by department:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Assign meeting to employee
exports.assignMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { employeeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(meetingId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        userId: employeeId,
        status: "Planifié"
      },
      { new: true }
    ).populate('userId', 'firstName lastName');

    if (!updatedMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.status(200).json(updatedMeeting);
  } catch (error) {
    console.error("Error assigning meeting:", error);
    res.status(500).json({ error: "Server error" });
  }
};