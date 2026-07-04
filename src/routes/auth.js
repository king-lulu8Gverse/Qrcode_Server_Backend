import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../db.js";
import dotenv from "dotenv";
import { upload } from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
dotenv.config();

const router = express.Router();

// REGISTER
router.post("/register", upload.single("face"), async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    matric_number,
    department,
    faculty,
    descriptor,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO users
      (name,email,password,role,matric_number,department,faculty)
      VALUES (?,?,?,?,?,?,?)`,
      [name, email, hashedPassword, role, matric_number, department, faculty],
    );

    // Save face image if it's a student
    console.log("Body:", req.body);
    console.log("File:", req.file);
    if (role === "student" && req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "TechTendance/Faces",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      console.log(uploadResult.secure_url);

      await db.execute(
        `INSERT INTO user_faces (user_id, image_path, descriptor)
     VALUES (?, ?, ?)`,
        [result.insertId, uploadResult.secure_url, descriptor],
      );
    }

    res.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/verify-face", authMiddleware, async (req, res) => {
  try {
    const { descriptor } = req.body;

    if (!descriptor) {
      return res.status(400).json({
        success: false,
        message: "No descriptor received",
      });
    }

    const [rows] = await db.execute(
      "SELECT descriptor FROM user_faces WHERE user_id = ?",
      [req.user.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No enrolled face found",
      });
    }

    console.log("Stored descriptor:");
    console.log(rows[0].descriptor);
    const storedDescriptor = JSON.parse(rows[0].descriptor);

    const liveDescriptor =
      typeof descriptor === "string" ? JSON.parse(descriptor) : descriptor;
    let distance = 0;

    for (let i = 0; i < storedDescriptor.length; i++) {
      distance += Math.pow(storedDescriptor[i] - liveDescriptor[i], 2);
    }

    distance = Math.sqrt(distance);

    console.log("Face Distance:", distance);

    if (distance < 0.55) {
      return res.json({
        success: true,
        verified: true,
      });
    }

    return res.json({
      success: false,
      verified: false,
      message: "Face does not match",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
