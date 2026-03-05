// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password too short" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ name, email: email.toLowerCase(), passwordHash });
    await user.save();

    // attach to session if using session middleware (optional)
    // req.session.userId = user._id;

    return res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Register error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).json({ error: "Invalid email or password" });

    // req.session.userId = user._id; // optional session

    return res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  // If using session middleware
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout err", err);
        return res.status(500).json({ error: "Unable to logout" });
      }
      res.clearCookie("connect.sid", { path: "/" });
      return res.json({ ok: true });
    });
  } else {
    return res.json({ ok: true });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    // if using session
    if (!req.session?.userId) return res.json({ user: null });
    const user = await User.findById(req.session.userId).select("name email");
    if (!user) return res.json({ user: null });
    return res.json({ user });
  } catch (err) {
    console.error("Me error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
