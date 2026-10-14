import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const router = express.Router();

function getUsers() {
  try {
    const filePath = path.resolve("data/users.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {}
  return [];
}

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const pwdField = user.password || user.passwordHash;
  let isValid = false;
  if (pwdField) {
    if (pwdField.startsWith("$2a$") || pwdField.startsWith("$2b$") || pwdField.startsWith("$2y$")) {
      isValid = await bcrypt.compare(password, pwdField);
    } else {
      isValid = password === pwdField;
    }
  }

  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "1h" }
  );

  return res.status(200).json({ token });
});

export default router;