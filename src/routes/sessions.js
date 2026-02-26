import express from "express";
import db from "../../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

const router = express.Router();

router.post("/start/:courseId", authMiddleware, async (req, res) => {
  if (req.user.role !== "lecturer") {
    return res.status(403).json({ message: "Access denied" });
  }

  const { courseId } = req.params;
  const token = uuidv4();

  try {
    await db.execute(
      "INSERT INTO sessions (course_id, session_token, start_time, is_active) VALUES (?, ?, NOW(), TRUE)",
      [courseId, token]
    );

    const qrUrl = `http://localhost:3000/scan/${token}`;
    const qrImage = await QRCode.toDataURL(qrUrl);

    res.json({ session_token: token, qrImage });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;