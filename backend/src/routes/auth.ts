import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";

import { User } from "../models/User";
import { signAuthToken, toSafeUser } from "../services/authService";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  language: z.enum(["ar", "en"]).default("ar"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ message: "Email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      email: input.email.toLowerCase(),
      passwordHash,
      language: input.language,
    });

    const token = signAuthToken(String(user._id));
    res.status(201).json({ token, user: toSafeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to register" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email.toLowerCase() });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = signAuthToken(String(user._id));
    res.status(200).json({ token, user: toSafeUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to login" });
  }
});

export default router;
