import mongoose, { Schema, Document } from 'mongoose';
import { DeviceSettings, DeviceCapabilities } from '@smart-parcel-box/shared';

export interface IDevice extends Document {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  firmwareVersion: string;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  lastSeenAt: Date;
  wifiRssi?: number | null;
  uptimeSeconds: number;
  capabilities: DeviceCapabilities;
  settings: DeviceSettings;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    deviceName: { type: String, required: true, default: 'Smart Parcel Box #1' },
    deviceType: { type: String, default: 'ESP32-SPB' },
    firmwareVersion: { type: String, default: '1.0.0' },
    connectionStatus: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'OFFLINE' },
    lastSeenAt: { type: Date, default: Date.now },
    wifiRssi: { type: Number, default: null },
    uptimeSeconds: { type: Number, default: 0 },
    capabilities: {
      supportsRemoteArm: { type: Boolean, default: true },
      supportsRemoteDisarm: { type: Boolean, default: false },
      supportsRemoteTare: { type: Boolean, default: true },
      supportsOtaUpdate: { type: Boolean, default: false }
    },
    settings: {
      minParcelWeightGrams: { type: Number, default: 50 },
      weightSettlingDurationMs: { type: Number, default: 3000 },
      armingDelaySeconds: { type: Number, default: 10 },
      vibrationWindowMs: { type: Number, default: 500 },
      debounceLidMs: { type: Number, default: 80 },
      magneticSensorInverted: { type: Boolean, default: false },
      buzzerActiveHigh: { type: Boolean, default: true },
      calibratedScaleFactor: { type: Number, default: 420.0 },
      tareOffset: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const DeviceModel = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);

