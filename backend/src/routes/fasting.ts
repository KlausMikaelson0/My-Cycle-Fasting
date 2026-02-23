import { Response, Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { FastingDay } from "../models/FastingDay";
import { User } from "../models/User";
import { buildFastingSummary, inferRamadanDay } from "../services/fastingService";
import { getPrayerTimes, PrayerTimesResult } from "../services/prayerTimesService";
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

function requireUserId(req: AuthenticatedRequest, res: Response): string | null {
  if (!req.userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return req.userId;
}

async function resolvePrayerTimesIfPossible(
  userId: string,
  date: Date,
): Promise<Partial<PrayerTimesResult>> {
  const user = await User.findById(userId);
  if (!user) {
    return {};
  }

  const hasGps = user.locationType === "gps" && user.latitude !== undefined && user.longitude !== undefined;
  const hasCity = user.locationType === "manual" && !!user.cityName;

  if (!hasGps && !hasCity) {
    return {};
  }

  const prayerTimeParams: { date: Date; latitude?: number; longitude?: number; cityName?: string } = {
    date,
  };
  if (hasGps) {
    prayerTimeParams.latitude = user.latitude!;
    prayerTimeParams.longitude = user.longitude!;
  }
  if (hasCity) {
    prayerTimeParams.cityName = user.cityName!;
  }

  const prayerTimes = await getPrayerTimes(prayerTimeParams);

  return prayerTimes;
}

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const query = rangeSchema.parse(req.query);
    const mongoQuery: {
      userId: Types.ObjectId;
      date?: { $gte?: Date; $lte?: Date };
    } = { userId: new Types.ObjectId(userId) };

    if (query.startDate || query.endDate) {
      const dateQuery: { $gte?: Date; $lte?: Date } = {};
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
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { year = new Date().getUTCFullYear() } = summarySchema.parse(req.query);
    const boundaries = yearBoundaries(year);

    const days = await FastingDay.find({
      userId: new Types.ObjectId(userId),
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
    const userId = requireUserId(req, res);
    if (!userId) return;

    const input = createOrUpdateSchema.parse(req.body);
    const normalizedDate = normalizeDateOnly(input.date);
    const prayerTimes = await resolvePrayerTimesIfPossible(userId, normalizedDate);
    const updatePayload: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      date: normalizedDate,
      isRamadanDay: input.isRamadanDay ?? inferRamadanDay(normalizedDate),
      isFasted: input.isFasted,
      isQada: input.isQada,
      periodStartDateTime: input.periodStartDateTime ?? undefined,
    };
    if (prayerTimes.fajrTime && prayerTimes.maghribTime) {
      updatePayload.fajrTime = prayerTimes.fajrTime;
      updatePayload.maghribTime = prayerTimes.maghribTime;
    }

    const updated = await FastingDay.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date: normalizedDate },
      updatePayload,
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
    const userId = requireUserId(req, res);
    if (!userId) return;

    const fastingDayId = String(req.params.id);
    const input = updateSchema.parse(req.body);
    const fastingDay = await FastingDay.findOne({
      _id: fastingDayId,
      userId: new Types.ObjectId(userId),
    });
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
      if (input.periodStartDateTime === null) {
        fastingDay.set("periodStartDateTime", undefined);
      } else {
        fastingDay.periodStartDateTime = input.periodStartDateTime;
      }
    }

    const prayerTimes = await resolvePrayerTimesIfPossible(userId, fastingDay.date);
    if (prayerTimes.fajrTime && prayerTimes.maghribTime) {
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
  const userId = requireUserId(req, res);
  if (!userId) return;

  const fastingDayId = String(req.params.id);
  const result = await FastingDay.findOneAndDelete({
    _id: fastingDayId,
    userId: new Types.ObjectId(userId),
  });
  if (!result) {
    res.status(404).json({ message: "Fasting day not found" });
    return;
  }
  res.status(204).send();
});

export default router;
