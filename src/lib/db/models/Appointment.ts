import mongoose, { Schema, Model } from 'mongoose';

export interface IAppointmentSnapshot {
  barberName?: string;
  serviceName?: string;
  locationLabel?: string;
  priceCop?: number;
  clientName?: string;
}

export interface IAppointment {
  _id: string;
  clientId?: string;
  locationId: string;
  barberId: string;
  serviceId: string;
  customerName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  startMinutes?: number;
  endMinutes?: number;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  snapshot?: IAppointmentSnapshot;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    _id: { type: String, required: true },
    clientId: { type: String },
    locationId: { type: String, required: true, ref: 'Location', index: true },
    barberId: { type: String, required: true, ref: 'Barber', index: true },
    serviceId: { type: String, required: true, ref: 'Service' },
    customerName: { type: String, trim: true },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    startTime: { type: String }, // "HH:MM"
    endTime: { type: String }, // "HH:MM"
    startMinutes: { type: Number, index: true },
    endMinutes: { type: Number },
    status: {
      type: String,
      default: 'confirmed',
      index: true,
    },
    snapshot: {
      barberName: { type: String },
      serviceName: { type: String },
      locationLabel: { type: String },
      priceCop: { type: Number },
      clientName: { type: String },
    },
    createdAt: {
      type: Schema.Types.Mixed,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: Schema.Types.Mixed,
      default: () => new Date().toISOString(),
    },
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

// Compound indexes
AppointmentSchema.index({ barberId: 1, date: 1, status: 1 });
AppointmentSchema.index({ locationId: 1, date: 1 });

export const AppointmentModel: Model<IAppointment> =
  (mongoose.models.Appointment as Model<IAppointment>) ||
  mongoose.model<IAppointment>('Appointment', AppointmentSchema);
