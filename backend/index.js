const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const reclamationRoutes = require("./routes/reclamationRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const statsRoutes = require('./routes/statsRoutes');



const path = require("path");

dotenv.config();
connectDB();

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.options("*", cors());
app.use("/api/users", userRoutes);
app.use("/api/reclamations", reclamationRoutes);
app.use("/api/meetings", meetingRoutes);
app.use('/api/stats', statsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));