import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export interface IFastingDay {
  userId: Types.ObjectId;
  date: Date;
  isRamadanDay: boolean;
  isFasted: boolean;
  isQada: boolean;
  periodStartDateTime?: Date;
  fajrTime?: Date;
  maghribTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type FastingDayModel = Model<IFastingDay>;
export type FastingDayDocument = HydratedDocument<IFastingDay>;

const fastingDaySchema = new Schema<IFastingDay, FastingDayModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    isRamadanDay: {
      type: Boolean,
      default: false,
    },
    isFasted: {
      type: Boolean,
      default: false,
    },
    isQada: {
      type: Boolean,
      default: false,
    },
    periodStartDateTime: {
      type: Date,
    },
    fajrTime: {
      type: Date,
    },
    maghribTime: {
      type: Date,
    },
  },
  { timestamps: true },
);

fastingDaySchema.index({ userId: 1, date: 1 }, { unique: true });

export const FastingDay = model<IFastingDay, FastingDayModel>("FastingDay", fastingDaySchema);
