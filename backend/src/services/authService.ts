import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../config/env";
import { IUser, UserDocument } from "../models/User";

export function signAuthToken(userId: string): string {
  const signOptions: SignOptions = {};
  signOptions.expiresIn = env.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>;
  return jwt.sign({ sub: userId }, env.jwtSecret, signOptions);
}

export function toSafeUser(user: Pick<UserDocument, "_id"> & Partial<IUser>) {
  return {
    id: String(user._id),
    email: user.email ?? "",
    language: user.language ?? "ar",
    locationType: user.locationType ?? "manual",
    latitude: user.latitude,
    longitude: user.longitude,
    cityName: user.cityName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
