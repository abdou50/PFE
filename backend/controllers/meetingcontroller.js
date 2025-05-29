const Meeting = require("../models/Meeting");
const User = require("../models/User");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');

exports.createMeeting = async (req, res) => {
  try {
    const { userId, date, department, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Add validation for past dates
    const now = new Date();
    if (parsedDate < now) {
      return res.status(400).json({ error: "Cannot schedule meetings in the past" });
    }

    // Add validation for business hours and weekends
    if (parsedDate.getDay() === 0 || parsedDate.getDay() === 6) {
      return res.status(400).json({ error: "Cannot schedule meetings on weekends" });
    }
    if (parsedDate.getHours() < 8 || parsedDate.getHours() >= 17) {
      return res.status(400).json({ error: "Outside business hours (8h-17h)" });
    }

    const validDepartments = ["Madaniya", "Insaf", "Rached"];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({ error: "Invalid department" });
    }

    // Check for overlapping meetings
    const overlappingMeeting = await Meeting.findOne({
      date: { $gte: new Date(parsedDate.getTime() - 30 * 60 * 1000), $lt: new Date(parsedDate.getTime() + 30 * 60 * 1000) },
      status: { $in: ["Demandé", "Planifié"] }
    });

    if (overlappingMeeting) {
      return res.status(400).json({ error: "Time slot already booked" });
    }

    const newMeeting = new Meeting({
      userId,
      department,
      date: parsedDate,
      description: description || "",
      status: "Demandé"
    });

    await newMeeting.save();
    
    const populatedMeeting = await Meeting.findById(newMeeting._id)
      .populate('userId', 'firstName lastName email phone')
      .populate('employeeId', 'firstName lastName email');

    res.status(201).json(populatedMeeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getDepartmentMeetings = async (req, res) => {
  try {
    const { department, status, employeeId, startDate, endDate } = req.query;
    
    if (!department) {
      return res.status(400).json({ error: "Department is required" });
    }

    const query = { department };
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const meetings = await Meeting.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('employeeId', 'firstName lastName email')
      .sort({ date: 1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching department meetings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Add this to your meetingcontroller.js
exports.checkMeetingConflict = async (req, res) => {
  try {
    const { employeeId, date, meetingId } = req.query;
    
    const meetingDate = new Date(date);
    const startTime = new Date(meetingDate.getTime() - 30 * 60 * 1000);
    const endTime = new Date(meetingDate.getTime() + 30 * 60 * 1000);

    const query = {
      date: { $gte: startTime, $lt: endTime },
      status: { $in: ["Demandé", "Planifié"] }
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (meetingId) {
      query._id = { $ne: meetingId };
    }

    const conflictingMeeting = await Meeting.findOne(query);

    res.status(200).json({ 
      hasConflict: !!conflictingMeeting,
      conflictingMeeting: conflictingMeeting || null
    });
  } catch (error) {
    console.error("Error checking meeting conflict:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Enhanced rescheduleMeeting
exports.rescheduleMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { date, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }
    
    // Validate business rules
    const now = new Date();
    if (parsedDate < now) {
      return res.status(400).json({ error: "Cannot schedule in the past" });
    }
    if (parsedDate.getDay() === 0 || parsedDate.getDay() === 6) {
      return res.status(400).json({ error: "Cannot schedule on weekends" });
    }
    const hours = parsedDate.getHours();
    if (hours < 8 || hours >= 17) {
      return res.status(400).json({ error: "Outside business hours (8h-17h)" });
    }

    // Check for conflicts
    const conflictCheck = await Meeting.findOne({
      date: { 
        $gte: new Date(parsedDate.getTime() - 30 * 60 * 1000), 
        $lt: new Date(parsedDate.getTime() + 30 * 60 * 1000) 
      },
      status: { $in: ["Demandé", "Planifié"] },
      _id: { $ne: meetingId }
    });

    if (conflictCheck) {
      return res.status(400).json({ 
        error: "Time slot already booked",
        conflictingMeeting: conflictCheck
      });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        date: parsedDate,
        status: status || "Planifié"
      },
      { new: true }
    )
    .populate('userId', 'firstName lastName email phone')
    .populate('employeeId', 'firstName lastName email');

    if (!updatedMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.status(200).json(updatedMeeting);
  } catch (error) {
    console.error("Error rescheduling meeting:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMeetingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const meetings = await Meeting.find({ userId })
      .populate('employeeId', 'firstName lastName email')
      .sort({ date: 1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching user meetings:", error);
    res.status(500).json({ error: "Server error" });
  }
};
exports.getEmployeeAvailability = async (req, res) => {
  try {
    const { employeeId, date } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId) || !date) {
      return res.status(400).json({ error: "Employee ID and date are required" });
    }

    // Parse the date and set it to local timezone
    const selectedDate = new Date(date);
    selectedDate.setHours(selectedDate.getHours() + 1); // Adjust for timezone if needed

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all meetings for this employee on the selected date
    const employeeMeetings = await Meeting.find({
      employeeId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "Planifié"
    }).sort({ date: 1 });

    // Generate all time slots with availability status
    const allSlots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Check if this slot overlaps with any meeting
        const isBooked = employeeMeetings.some(meeting => {
          const meetingTime = new Date(meeting.date);
          const meetingHour = meetingTime.getHours();
          const meetingMinute = meetingTime.getMinutes();
          return meetingHour === hour && meetingMinute === minute;
        });

        allSlots.push({
          time: slotTime.toISOString(),
          formattedTime: slotTime.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Tunis'
          }),
          isAvailable: !isBooked
        });
      }
    }

    res.status(200).json({
      employeeId,
      date: selectedDate.toISOString(),
      timeSlots: allSlots,
      existingMeetings: employeeMeetings
    });
  } catch (error) {
    console.error("Error checking employee availability:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const { department } = req.query;
    
    if (!department) {
      return res.status(400).json({ error: "Department is required" });
    }

    const employees = await User.find({ 
      department,
      role: 'employee'
    }).select('firstName lastName email _id');

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Generate meeting link
// Generate and save meeting link
exports.generateAndSaveMeetingLink = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }

    // Generate a secure Jitsi Meet link with meeting ID
    const meetingLink = `https://meet.jit.si/CNI-${meetingId}-${Math.random().toString(36).substring(2, 8)}`;
    
    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { 
        meetingLink,
        status: "Planifié" // Automatically set status to Planifié
      },
      { new: true }
    )
    .populate('userId', 'firstName lastName email phone')
    .populate('employeeId', 'firstName lastName email');

    if (!updatedMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Send email to user with the meeting link
    if (updatedMeeting.userId && updatedMeeting.userId.email) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const meetingDate = new Date(updatedMeeting.date);
        const formattedDate = meetingDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const formattedTime = meetingDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // Get user name with fallbacks
        const userFirstName = updatedMeeting.userId?.firstName || "Client";
        const userLastName = updatedMeeting.userId?.lastName || "";
        
        // Get employee info with fallbacks
        const employeeInfo = updatedMeeting.employeeId ? 
          `${updatedMeeting.employeeId.firstName || ""} ${updatedMeeting.employeeId.lastName || ""}`.trim() : 
          'À déterminer';

        const emailTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                margin-top: 20px;
              }
              .info { margin: 20px 0; padding: 15px; background-color: #f1f1f1; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>CNI - Lien de votre rendez-vous virtuel</h2>
              </div>
              <div class="content">
                <p>Bonjour ${userFirstName} ${userLastName},</p>
                <p>Votre rendez-vous virtuel a été planifié avec succès.</p>
                
                <div class="info">
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <p><strong>Heure:</strong> ${formattedTime}</p>
                  <p><strong>Département:</strong> ${updatedMeeting.department || ""}</p>
                  <p><strong>Avec:</strong> ${employeeInfo}</p>
                </div>
                
                <p>Vous pouvez rejoindre la réunion en cliquant sur le lien ci-dessous (disponible 10 minutes avant l'heure prévue):</p>
                <a href="${meetingLink}" class="button">Rejoindre la réunion</a>
                
                <p>Si vous ne pouvez pas cliquer sur le bouton, copiez et collez ce lien dans votre navigateur:</p>
                <p>${meetingLink}</p>
                
                <p>Cordialement,<br>L'équipe CNI</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: {
            name: 'CNI Service de Rendez-vous',
            address: process.env.SMTP_USER
          },
          to: updatedMeeting.userId.email,
          subject: `[CNI] Lien pour votre rendez-vous du ${formattedDate}`,
          html: emailTemplate
        });

        console.log('Meeting link email sent successfully to:', updatedMeeting.userId.email);
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
      }
    }

    res.status(200).json({
      message: "Meeting link generated and saved successfully",
      meeting: updatedMeeting
    });
  } catch (error) {
    console.error("Error generating meeting link:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get meeting link for user
exports.getMeetingLinkForUser = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }

    const meeting = await Meeting.findById(meetingId)
      .populate('userId', 'firstName lastName email');

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (!meeting.meetingLink) {
      return res.status(404).json({ error: "No meeting link generated yet" });
    }

    res.status(200).json({
      meetingLink: meeting.meetingLink,
      user: meeting.userId
    });
  } catch (error) {
    console.error("Error getting meeting link:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get employee meetings (for calendar view)
exports.getEmployeeMeetings = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const meetings = await Meeting.find({ 
      employeeId: employeeId,
      status: { $in: ["Demandé", "Planifié", "Terminé"] }
    })
    .populate('userId', 'firstName lastName email phone')
    .populate('employeeId', 'firstName lastName email')
    .sort({ date: -1 });

    if (!meetings) {
      return res.status(404).json({ error: "No meetings found" });
    }

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching employee meetings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update meeting status (modified to handle meeting links)
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status, employeeId, meetingLink, date } = req.body;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }

    const updateData = { status };
    
    // Handle employee assignment
    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return res.status(400).json({ error: "Invalid employee ID" });
      }
      updateData.employeeId = employeeId;
    }

    // Handle date update
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      updateData.date = parsedDate;
    }

    // Handle meeting link
    if (meetingLink) {
      updateData.meetingLink = meetingLink;
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updateData,
      { new: true }
    )
    .populate('userId', 'firstName lastName email phone')
    .populate('employeeId', 'firstName lastName email');

    if (!updatedMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.status(200).json(updatedMeeting);
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateMeetingLink = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { meetingLink } = req.body;

    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      { meetingLink },
      { new: true }
    )
    .populate('userId', 'firstName lastName email phone')
    .populate('employeeId', 'firstName lastName email');

    if (!updatedMeeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.status(200).json({ meeting: updatedMeeting });
  } catch (error) {
    console.error("Error updating meeting link:", error);
    res.status(500).json({ error: "Server error" });
  }
};