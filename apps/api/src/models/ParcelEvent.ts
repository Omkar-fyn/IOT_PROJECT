import mongoose, { Schema, Document } from 'mongoose';

export interface IParcelEvent extends Document {
  eventId: string;
  deviceId: string;
  eventType: 'PARCEL_DETECTED' | 'PARCEL_REMOVED';
  weightGrams: number;
  description: string;
  deviceTimestamp: string;
  receivedAt: Date;
  isSimulated: boolean;
}

const ParcelEventSchema = new Schema<IParcelEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true, index: true },
    eventType: { type: String, enum: ['PARCEL_DETECTED', 'PARCEL_REMOVED'], required: true },
    weightGrams: { type: Number, required: true },
    description: { type: String, required: true },
    deviceTimestamp: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now, index: true },
    isSimulated: { type: Boolean, default: false }
  },
  { timestamps: false }
);

ParcelEventSchema.index({ deviceId: 1, receivedAt: -1 });

export const ParcelEventModel =
  mongoose.models.ParcelEvent || mongoose.model<IParcelEvent>('ParcelEvent', ParcelEventSchema);

