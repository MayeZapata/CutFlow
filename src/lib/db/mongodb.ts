import mongoose from 'mongoose';
import { LocationModel, BarberModel, ServiceModel, AppointmentModel, UserModel } from './models';
import { SEED_LOCATIONS, SEED_BARBERS, SEED_SERVICES, SEED_APPOINTMENTS, SEED_USERS } from './seed';
import { hashPassword } from '../auth/password';

// trim(): protects against stray whitespace/newlines pasted into hosting env vars
const MONGODB_URI = process.env.MONGODB_URI?.trim() || 'mongodb://localhost:27017/barber_db';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  seeded: boolean;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  seeded: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Initializes default records if collections are empty.
 */
async function autoSeed() {
  try {
    const locCount = await LocationModel.countDocuments();
    if (locCount === 0) {
      await LocationModel.insertMany(
        SEED_LOCATIONS.map((l) => ({ ...l, _id: l.id }))
      );
    }

    const barberCount = await BarberModel.countDocuments();
    if (barberCount === 0) {
      await BarberModel.insertMany(
        SEED_BARBERS.map((b) => ({ ...b, _id: b.id }))
      );
    }

    const serviceCount = await ServiceModel.countDocuments();
    if (serviceCount === 0) {
      await ServiceModel.insertMany(
        SEED_SERVICES.map((s) => ({ ...s, _id: s.id }))
      );
    }

    const apptCount = await AppointmentModel.countDocuments();
    if (apptCount === 0) {
      await AppointmentModel.insertMany(
        SEED_APPOINTMENTS.map((a) => ({ ...a, _id: a.id }))
      );
    }

    for (const u of SEED_USERS) {
      const exists = await UserModel.findOne({ email: u.email });
      if (!exists) {
        await UserModel.create({
          _id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          passwordHash: await hashPassword(u.passwordPlain),
        });
      }
    }
  } catch (error) {
    console.error('Error during database auto-seed:', error);
  }
}

/**
 * Connects to MongoDB with connection caching to support Next.js fast-refresh and edge/serverless routes.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    if (!cached.seeded) {
      await autoSeed();
      cached.seeded = true;
    }
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    if (!cached.seeded) {
      await autoSeed();
      cached.seeded = true;
    }
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
