import express from "express";
import db from "../../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  if (req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { course_name, course_code } = req.body;

  try {
    await db.execute(
      "INSERT INTO courses (course_name, course_code, lecturer_id) VALUES (?, ?, ?)",
      [course_name, course_code, req.user.id]
    );

    res.json({ message: "Course created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const [courses] = await db.execute(
      "SELECT * FROM courses WHERE lecturer_id = ?",
      [req.user.id]
    );

    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;