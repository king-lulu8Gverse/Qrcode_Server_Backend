import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../../db.js";
import dotenv from "dotenv";
import {upload} from "../middleware/upload.js";

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
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO users
      (name,email,password,role,matric_number,department,faculty)
      VALUES (?,?,?,?,?,?,?)`,
      [
        name,
        email,
        hashedPassword,
        role,
        matric_number,
        department,
        faculty,
      ]
    );

    // Save face image if it's a student
    console.log("Body:", req.body);
console.log("File:", req.file);
    if (role === "student") {
      console.log(req.file);
      await db.execute(
        `INSERT INTO user_faces (user_id, image_path, descriptor)
         VALUES (?, ?, ?)`,
        [result.insertId, req.file.path, req.file.descriptor]
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

export default router;
