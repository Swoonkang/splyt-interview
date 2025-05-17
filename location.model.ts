import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  driver_id: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
});

locationSchema.index({ driver_id: 1, timestamp: -1 });

export const Location = mongoose.model('Location', locationSchema);
