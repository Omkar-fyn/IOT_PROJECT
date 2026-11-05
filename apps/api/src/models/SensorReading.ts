import mongoose, { Schema, Document } from 'mongoose';

export interface ISensorReading extends Document {
  deviceId: string;
  weightRaw: number;
  weightGrams: number;
  weightValid: boolean;
  hx711Ready: boolean;
  lidClosed: boolean;
  magneticRaw: number;
  vibrationDetected: boolean;
  vibrationRaw: number;
  parcelPresent: boolean;
  armed: boolean;
  alarmActive: boolean;
  redLedActive: boolean;
  greenLedActive: boolean;
  buzzerActive: boolean;
  wifiRssi?: number | null;
  uptimeSeconds: number;
  firmwareVersion: string;
  deviceTimestamp: string;
  receivedAt: Date;
  isSimulated: boolean;
}

const SensorReadingSchema = new Schema<ISensorReading>(
  {
    deviceId: { type: String, required: true, index: true },
    weightRaw: { type: Number, required: true },
    weightGrams: { type: Number, required: true },
    weightValid: { type: Boolean, required: true },
    hx711Ready: { type: Boolean, required: true },
    lidClosed: { type: Boolean, required: true },
    magneticRaw: { type: Number, required: true },
    vibrationDetected: { type: Boolean, required: true },
    vibrationRaw: { type: Number, required: true },
    parcelPresent: { type: Boolean, required: true },
    armed: { type: Boolean, required: true },
    alarmActive: { type: Boolean, required: true },
    redLedActive: { type: Boolean, default: false },
    greenLedActive: { type: Boolean, default: true },
    buzzerActive: { type: Boolean, default: false },
    wifiRssi: { type: Number, default: null },
    uptimeSeconds: { type: Number, default: 0 },
    firmwareVersion: { type: String, default: '1.0.0' },
    deviceTimestamp: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now, index: true },
    isSimulated: { type: Boolean, default: false }
  },
  { timestamps: false }
);

SensorReadingSchema.index({ deviceId: 1, receivedAt: -1 });

export const SensorReadingModel =
  mongoose.models.SensorReading || mongoose.model<ISensorReading>('SensorReading', SensorReadingSchema);

