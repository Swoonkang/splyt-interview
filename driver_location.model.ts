import { Schema, model, Document } from 'mongoose';

export interface DriverLocationDocument extends Document {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  requestId: string;
}

const DriverLocationSchema = new Schema<DriverLocationDocument>({
  driverId: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  requestId: { type: String, required: true, unique: true } // ensure uniqueness
});

// Explicitly define the unique index (optional if already covered above)
DriverLocationSchema.index({ requestId: 1 }, { unique: true });

export const DriverLocationModel = model<DriverLocationDocument>(
  'DriverLocation',
  DriverLocationSchema
);
