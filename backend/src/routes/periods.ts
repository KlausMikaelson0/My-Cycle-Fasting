import { Response, Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { Period } from "../models/Period";
import { buildPeriodSummary } from "../services/periodService";
import { AuthenticatedRequest } from "../types/auth";

const router = Router();

const createPeriodSchema = z.object({
  startDateTime: z.coerce.date(),
});

const updatePeriodSchema = z.object({
  startDateTime: z.coerce.date().optional(),
  endDateTime: z.coerce.date().nullable().optional(),
});

function requireUserId(req: AuthenticatedRequest, res: Response): string | null {
  if (!req.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return req.userId;
}

router.get("/", async (req: AuthenticatedRequest, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const periods = await Period.find({ userId: new Types.ObjectId(userId) }).sort({ startDateTime: -1 });
  res.status(200).json(periods);
});

router.get("/summary", async (req: AuthenticatedRequest, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const periods = await Period.find({ userId: new Types.ObjectId(userId) }).sort({ startDateTime: 1 });
  const summary = buildPeriodSummary(periods);
  res.status(200).json(summary);
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const input = createPeriodSchema.parse(req.body);
    const period = await Period.create({
      userId: new Types.ObjectId(userId),
      startDateTime: input.startDateTime,
    });
    res.status(201).json(period);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to create period" });
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const periodId = String(req.params.id);
    const input = updatePeriodSchema.parse(req.body);
    const period = await Period.findOne({
      _id: periodId,
      userId: new Types.ObjectId(userId),
    });
    if (!period) {
      res.status(404).json({ message: "Period not found" });
      return;
    }

    if (input.startDateTime !== undefined) period.startDateTime = input.startDateTime;
    if (input.endDateTime !== undefined) {
      if (input.endDateTime === null) {
        period.set("endDateTime", undefined);
      } else {
        period.endDateTime = input.endDateTime;
      }
    }

    await period.save();
    res.status(200).json(period);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to update period" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const periodId = String(req.params.id);
  const result = await Period.findOneAndDelete({
    _id: periodId,
    userId: new Types.ObjectId(userId),
  });
  if (!result) {
    res.status(404).json({ message: "Period not found" });
    return;
  }
  res.status(204).send();
});

export default router;
