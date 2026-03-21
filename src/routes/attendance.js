import express from "express";
import db from "../../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// routes/attendance.js
router.get("/lecturer", authMiddleware, async (req, res) => {
  try {
    const [sessions] = await db.execute(
      `SELECT 
        s.id, 
        s.course_id, 
        s.date, 
        c.course_name
      FROM sessions s
      JOIN courses c ON s.course_id = c.id
      WHERE s.lecturer_id = ?`,
      [req.user.id],
    );

    const result = await Promise.all(
      sessions.map(async (session) => {
        const [attendees] = await db.execute(
          `SELECT 
            u.name, 
            u.matric_number, 
            u.department, 
            u.faculty
           FROM attendance a
           JOIN users u ON a.student_id = u.id
           WHERE a.session_id = ?`,
          [session.id],
        );

        return {
          _id: session.id,
          course: {
            id: session.course_id,
            name: session.course_name, // ✅ now correct
          },
          date: session.date,
          attendees,
        };
      }),
    );

    res.json(result);
  } catch (err) {
    console.error("Lecturer attendance error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/student", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        a.id,
        c.name AS course_name,
        s.date,
        s.start_time
       FROM attendance a
       JOIN sessions s ON a.session_id = s.id
       JOIN courses c ON s.course_id = c.id
       WHERE a.student_id = ?`,
      [req.user.id],
    );

    res.json(rows);
  } catch (err) {
    console.error("Student attendance error:", err);
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
      [req.params.sessionId],
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Attendance
router.post("/:token", authMiddleware, async (req, res) => {
  try {
    const [sessions] = await db.execute(
      "SELECT * FROM sessions WHERE session_token = ? AND is_active = TRUE",
      [req.params.token],
    );

    if (sessions.length === 0) {
      return res.status(400).json({ message: "Invalid or expired session" });
    }

    const session = sessions[0];

    await db.execute(
      "INSERT INTO attendance (session_id, student_id) VALUES (?, ?)",
      [session.id, req.user.id],
    );

    const [student] = await db.execute(
      "SELECT name, matric_number, department, faculty FROM users WHERE id = ?",
      [req.user.id],
    );

    res.json({ message: "Attendance marked", student: student[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
