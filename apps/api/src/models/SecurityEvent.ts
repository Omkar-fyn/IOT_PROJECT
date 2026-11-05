import mongoose, { Schema, Document } from 'mongoose';
import { SecurityEventType, EventSeverity } from '@smart-parcel-box/shared';

export interface ISecurityEvent extends Document {
  eventId: string;
  deviceId: string;
  eventType: SecurityEventType;
  severity: EventSeverity;
  sourceSensor: string;
  description: string;
  weightGrams?: number;
  acknowledged: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: Date | null;
  deviceTimestamp: string;
  receivedAt: Date;
  isSimulated: boolean;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], required: true, index: true },
    sourceSensor: { type: String, required: true },
    description: { type: String, required: true },
    weightGrams: { type: Number },
    acknowledged: { type: Boolean, default: false, index: true },
    acknowledgedBy: { type: String, default: null },
    acknowledgedAt: { type: Date, default: null },
    deviceTimestamp: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now, index: true },
    isSimulated: { type: Boolean, default: false }
  },
  { timestamps: false }
);

SecurityEventSchema.index({ deviceId: 1, severity: 1, receivedAt: -1 });

export const SecurityEventModel =
  mongoose.models.SecurityEvent || mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);

