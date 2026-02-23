import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { JwtPayload, AuthenticatedRequest } from "../types/auth";

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
