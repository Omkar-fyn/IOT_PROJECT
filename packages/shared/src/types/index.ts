import {
  BoxState,
  LidState,
  VibrationState,
  SecurityEventType,
  EventSeverity
} from '../constants';
import { TelemetryPayload } from '../schemas/telemetry.schema';
import { SecurityEventPayload, ParcelEventPayload } from '../schemas/event.schema';
import { DeviceSettings, DeviceCapabilities } from '../schemas/device.schema';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  firmwareVersion: string;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string;
  wifiRssi?: number | null;
  uptimeSeconds: number;
  capabilities: DeviceCapabilities;
  settings: DeviceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSensorReading extends TelemetryPayload {
  _id?: string;
  receivedAt: string;
}

export interface StoredSecurityEvent extends SecurityEventPayload {
  _id?: string;
  receivedAt: string;
}

export interface StoredParcelEvent extends ParcelEventPayload {
  _id?: string;
  receivedAt: string;
}

export interface DeviceCommandRecord {
  commandId: string;
  deviceId: string;
  commandType: string;
  payload: Record<string, any>;
  requestedBy: string;
  status: 'PENDING' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'FAILED' | 'REJECTED';
  requestedAt: string;
  acknowledgedAt?: string | null;
  result?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface DashboardSummary {
  deviceId: string;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  boxState: BoxState;
  lidState: LidState;
  vibrationState: VibrationState;
  currentWeightGrams: number;
  weightValid: boolean;
  parcelPresent: boolean;
  armed: boolean;
  alarmActive: boolean;
  lastEvent?: StoredSecurityEvent | null;
  lastTelemetryAt?: string | null;
  isStale: boolean;
  isSimulated: boolean;
}

