import { Router } from "express";
import { z } from "zod";

import { User } from "../models/User";
import { toSafeUser } from "../services/authService";
import { AuthenticatedRequest } from "../types/auth";

const router = Router();

const updateSchema = z
  .object({
    language: z.enum(["ar", "en"]).optional(),
    locationType: z.enum(["gps", "manual"]).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    cityName: z.string().trim().min(1).max(120).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.locationType === "gps") {
      if (value.latitude === undefined || value.longitude === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "latitude and longitude are required when locationType is gps",
          path: ["locationType"],
        });
      }
    }

    if (value.locationType === "manual" && value.cityName === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "cityName is required when locationType is manual",
        path: ["locationType"],
      });
    }
  });

router.get("/me", async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json(toSafeUser(user));
});

router.put("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const input = updateSchema.parse(req.body);
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (input.language !== undefined) user.language = input.language;
    if (input.locationType !== undefined) user.locationType = input.locationType;
    if (input.latitude !== undefined) user.latitude = input.latitude;
    if (input.longitude !== undefined) user.longitude = input.longitude;
    if (input.cityName !== undefined) user.cityName = input.cityName;

    if (input.locationType === "manual") {
      user.latitude = undefined;
      user.longitude = undefined;
    }
    if (input.locationType === "gps") {
      user.cityName = undefined;
    }

    await user.save();
    res.status(200).json(toSafeUser(user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;
