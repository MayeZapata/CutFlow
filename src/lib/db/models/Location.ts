import mongoose, { Schema, Model } from 'mongoose';

export interface ILocation {
  _id: string;
  name: string;
  city: string;
  address: string;
  openingTime: string;
  closingTime: string;
  active: boolean;
}

const LocationSchema = new Schema<ILocation>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '20:00' },
    active: { type: Boolean, default: true },
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

export const LocationModel: Model<ILocation> =
  (mongoose.models.Location as Model<ILocation>) ||
  mongoose.model<ILocation>('Location', LocationSchema);
