import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceCommand extends Document {
  commandId: string;
  deviceId: string;
  commandType: string;
  payload: Record<string, any>;
  requestedBy: string;
  status: 'PENDING' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'FAILED' | 'REJECTED';
  requestedAt: Date;
  acknowledgedAt?: Date | null;
  result?: string | null;
}

const DeviceCommandSchema = new Schema<IDeviceCommand>(
  {
    commandId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true, index: true },
    commandType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    requestedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'ACKNOWLEDGED', 'FAILED', 'REJECTED'],
      default: 'PENDING',
      index: true
    },
    requestedAt: { type: Date, default: Date.now, index: true },
    acknowledgedAt: { type: Date, default: null },
    result: { type: String, default: null }
  },
  { timestamps: false }
);

DeviceCommandSchema.index({ deviceId: 1, status: 1, requestedAt: -1 });

export const DeviceCommandModel =
  mongoose.models.DeviceCommand || mongoose.model<IDeviceCommand>('DeviceCommand', DeviceCommandSchema);

