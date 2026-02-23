import { HydratedDocument, Model, Schema, model } from "mongoose";

export type Language = "ar" | "en";
export type LocationType = "gps" | "manual";

export interface IUser {
  email: string;
  passwordHash: string;
  language: Language;
  locationType: LocationType;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  createdAt: Date;
  updatedAt: Date;
}

type UserModel = Model<IUser>;
export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ["ar", "en"],
      default: "ar",
    },
    locationType: {
      type: String,
      enum: ["gps", "manual"],
      default: "manual",
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    cityName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser, UserModel>("User", userSchema);
