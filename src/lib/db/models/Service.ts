import mongoose, { Schema, Model } from 'mongoose';

export interface IServiceLocationOverride {
  locationId: string;
  priceCop?: number;
  durationMinutes?: number;
}

export interface IService {
  _id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCop: number;
  locationOverrides?: IServiceLocationOverride[];
  active: boolean;
}

const ServiceSchema = new Schema<IService>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    durationMinutes: { type: Number, required: true, min: 5 },
    priceCop: { type: Number, required: true, min: 0 },
    locationOverrides: [
      {
        locationId: { type: String },
        priceCop: { type: Number },
        durationMinutes: { type: Number },
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

export const ServiceModel: Model<IService> =
  (mongoose.models.Service as Model<IService>) ||
  mongoose.model<IService>('Service', ServiceSchema);
