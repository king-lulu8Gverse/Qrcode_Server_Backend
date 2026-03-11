import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

import authRoutes from "./src/routes/auth.js";
import courseRoutes from "./src/routes/courses.js";
import sessionRoutes from "./src/routes/sessions.js";
import attendanceRoutes from "./src/routes/attendance.js";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Attendance System API Running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});