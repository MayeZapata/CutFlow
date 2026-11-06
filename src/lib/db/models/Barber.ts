import mongoose, { Schema, Model } from 'mongoose';

export interface IBarberScheduleItem {
  weekday: number;
  start: string;
  end: string;
}

export interface IBarber {
  _id: string;
  name: string;
  specialty: string;
  rating: number;
  locationId: string;
  weeklySchedule?: IBarberScheduleItem[];
  active: boolean;
}

const BarberSchema = new Schema<IBarber>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    locationId: { type: String, required: true, ref: 'Location', index: true },
    weeklySchedule: [
      {
        weekday: { type: Number },
        start: { type: String },
        end: { type: String },
      },
    ],
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    _id: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const BarberModel: Model<IBarber> =
  (mongoose.models.Barber as Model<IBarber>) ||
  mongoose.model<IBarber>('Barber', BarberSchema);
