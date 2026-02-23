import { Request } from "express";

export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}
