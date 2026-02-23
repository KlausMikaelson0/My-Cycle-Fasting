import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { FastingDay } from "../models/FastingDay";
import { User } from "../models/User";
import { buildFastingSummary, inferRamadanDay } from "../services/fastingService";
import { getPrayerTimes } from "../services/prayerTimesService";
import { AuthenticatedRequest } from "../types/auth";
import { normalizeDateOnly, yearBoundaries } from "../utils/date";

const router = Router();

const baseFastingSchema = {
  date: z.coerce.date(),
  isRamadanDay: z.boolean().optional(),
  isFasted: z.boolean().default(false),
  isQada: z.boolean().default(false),
  periodStartDateTime: z.coerce.date().nullable().optional(),
};

const createOrUpdateSchema = z.object(baseFastingSchema);
const updateSchema = z.object({
  date: baseFastingSchema.date.optional(),
  isRamadanDay: baseFastingSchema.isRamadanDay,
  isFasted: baseFastingSchema.isFasted.optional(),
  isQada: baseFastingSchema.isQada.optional(),
  periodStartDateTime: baseFastingSchema.periodStartDateTime,
});

const rangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const summarySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2200).optional(),
});

async function resolvePrayerTimesIfPossible(req: AuthenticatedRequest, date: Date) {
  const user = await User.findById(req.userId);
  if (!user) {
    return {};
  }

  const hasGps = user.locationType === "gps" && user.latitude !== undefined && user.longitude !== undefined;
  const hasCity = user.locationType === "manual" && !!user.cityName;

  if (!hasGps && !hasCity) {
    return {};
  }

  const prayerTimes = await getPrayerTimes({
    date,
    latitude: user.latitude,
    longitude: user.longitude,
    cityName: user.cityName,
  });

  return prayerTimes;
}

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const query = rangeSchema.parse(req.query);
    const mongoQuery: Record<string, unknown> = { userId: req.userId };

    if (query.startDate || query.endDate) {
      const dateQuery: Record<string, Date> = {};
      if (query.startDate) dateQuery.$gte = normalizeDateOnly(query.startDate);
      if (query.endDate) dateQuery.$lte = normalizeDateOnly(query.endDate);
      mongoQuery.date = dateQuery;
    }

    const records = await FastingDay.find(mongoQuery).sort({ date: 1 });
    res.status(200).json(records);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to fetch fasting records" });
  }
});

router.get("/summary", async (req: AuthenticatedRequest, res) => {
  try {
    const { year = new Date().getUTCFullYear() } = summarySchema.parse(req.query);
    const boundaries = yearBoundaries(year);

    const days = await FastingDay.find({
      userId: req.userId,
      date: {
        $gte: boundaries.start,
        $lt: boundaries.end,
      },
    });

    const summary = buildFastingSummary(days);
    res.status(200).json({ year, ...summary });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to build fasting summary" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const input = createOrUpdateSchema.parse(req.body);
    const normalizedDate = normalizeDateOnly(input.date);
    const prayerTimes = await resolvePrayerTimesIfPossible(req, normalizedDate);

    const updated = await FastingDay.findOneAndUpdate(
      { userId: req.userId, date: normalizedDate },
      {
        userId: new Types.ObjectId(req.userId),
        date: normalizedDate,
        isRamadanDay: input.isRamadanDay ?? inferRamadanDay(normalizedDate),
        isFasted: input.isFasted,
        isQada: input.isQada,
        periodStartDateTime: input.periodStartDateTime ?? undefined,
        ...prayerTimes,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(201).json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to upsert fasting day" });
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const input = updateSchema.parse(req.body);
    const fastingDay = await FastingDay.findOne({ _id: req.params.id, userId: req.userId });
    if (!fastingDay) {
      res.status(404).json({ message: "Fasting day not found" });
      return;
    }

    if (input.date !== undefined) {
      fastingDay.date = normalizeDateOnly(input.date);
    }
    if (input.isRamadanDay !== undefined) fastingDay.isRamadanDay = input.isRamadanDay;
    if (input.isFasted !== undefined) fastingDay.isFasted = input.isFasted;
    if (input.isQada !== undefined) fastingDay.isQada = input.isQada;
    if (input.periodStartDateTime !== undefined) {
      fastingDay.periodStartDateTime = input.periodStartDateTime ?? undefined;
    }

    const prayerTimes = await resolvePrayerTimesIfPossible(req, fastingDay.date);
    if ("fajrTime" in prayerTimes && prayerTimes.fajrTime) {
      fastingDay.fajrTime = prayerTimes.fajrTime;
      fastingDay.maghribTime = prayerTimes.maghribTime;
    }

    await fastingDay.save();
    res.status(200).json(fastingDay);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Validation error", errors: error.flatten() });
      return;
    }
    res.status(500).json({ message: "Failed to update fasting day" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const result = await FastingDay.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!result) {
    res.status(404).json({ message: "Fasting day not found" });
    return;
  }
  res.status(204).send();
});

export default router;
