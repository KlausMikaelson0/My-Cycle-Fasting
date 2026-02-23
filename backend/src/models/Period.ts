import { HydratedDocument, Model, Schema, Types, model } from "mongoose";

export interface IPeriod {
  userId: Types.ObjectId;
  startDateTime: Date;
  endDateTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type PeriodModel = Model<IPeriod>;
export type PeriodDocument = HydratedDocument<IPeriod>;

const periodSchema = new Schema<IPeriod, PeriodModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const Period = model<IPeriod, PeriodModel>("Period", periodSchema);
