import express from "express";
import db from "../../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Mark Attendance
router.post("/:token", authMiddleware, async (req, res) => {
  try {
    const [sessions] = await db.execute(
      "SELECT * FROM sessions WHERE session_token = ? AND is_active = TRUE",
      [req.params.token]
    );

    if (sessions.length === 0) {
      return res.status(400).json({ message: "Invalid or expired session" });
    }

    const session = sessions[0];

    await db.execute(
      "INSERT INTO attendance (session_id, student_id) VALUES (?, ?)",
      [session.id, req.user.id]
    );

    const [student] = await db.execute(
      "SELECT name, matric_number, department, faculty FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({ message: "Attendance marked", student: student[0] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View Attendance
router.get("/session/:sessionId", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT users.name, users.matric_number, users.department, users.faculty
       FROM attendance
       JOIN users ON attendance.student_id = users.id
       WHERE attendance.session_id = ?`,
      [req.params.sessionId]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;