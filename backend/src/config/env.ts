import dotenv from "dotenv";

dotenv.config();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: requiredEnv("MONGODB_URI"),
  jwtSecret: requiredEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  prayerApiUrl: process.env.PRAYER_API_URL ?? "",
};
