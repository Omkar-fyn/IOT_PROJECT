import { UserModel, IUser } from '../../models/User';
import { DeviceModel, IDevice } from '../../models/Device';
import { SensorReadingModel, ISensorReading } from '../../models/SensorReading';
import { ParcelEventModel, IParcelEvent } from '../../models/ParcelEvent';
import { SecurityEventModel, ISecurityEvent } from '../../models/SecurityEvent';
import { DeviceCommandModel, IDeviceCommand } from '../../models/DeviceCommand';
import { getDbStatus } from '../../config/database';
import { TelemetryPayload, SecurityEventPayload, ParcelEventPayload, DeviceSettings } from '@smart-parcel-box/shared';

// In-Memory fallback store
const memUsers: any[] = [];
const memDevices: Map<string, any> = new Map();
const memReadings: any[] = [];
const memParcelEvents: any[] = [];
const memSecurityEvents: any[] = [];
const memCommands: any[] = [];

export const repo = {
  // USERS
  users: {
    findByEmail: async (email: string): Promise<any> => {
      if (getDbStatus().connected) {
        return UserModel.findOne({ email: email.toLowerCase() });
      }
      return memUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    findById: async (id: string): Promise<any> => {
      if (getDbStatus().connected) {
        return UserModel.findById(id);
      }
      return memUsers.find((u) => u._id === id || u.id === id) || null;
    },
    create: async (data: { name: string; email: string; passwordHash: string; role?: string }): Promise<any> => {
      if (getDbStatus().connected) {
        return UserModel.create(data);
      }
      const user = {
        _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role || 'viewer',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      memUsers.push(user);
      return user;
    },
    updatePassword: async (userId: string, newPasswordHash: string): Promise<boolean> => {
      if (getDbStatus().connected) {
        const res = await UserModel.updateOne({ _id: userId }, { passwordHash: newPasswordHash });
        return res.modifiedCount > 0;
      }
      const user = memUsers.find((u) => u._id === userId || u.id === userId);
      if (user) {
        user.passwordHash = newPasswordHash;
        user.updatedAt = new Date();
        return true;
      }
      return false;
    }
  },

  // DEVICES
  devices: {
    getOrCreate: async (deviceId: string, defaults?: Partial<IDevice>): Promise<any> => {
      if (getDbStatus().connected) {
        let dev = await DeviceModel.findOne({ deviceId });
        if (!dev) {
          dev = await DeviceModel.create({
            deviceId,
            deviceName: defaults?.deviceName || `Smart Parcel Box (${deviceId})`,
            ...defaults
          });
        }
        return dev;
      }
      if (!memDevices.has(deviceId)) {
        const newDev = {
          deviceId,
          deviceName: defaults?.deviceName || `Smart Parcel Box (${deviceId})`,
          deviceType: defaults?.deviceType || 'ESP32-SPB',
          firmwareVersion: defaults?.firmwareVersion || '1.0.0',
          connectionStatus: 'OFFLINE',
          lastSeenAt: new Date(),
          wifiRssi: null,
          uptimeSeconds: 0,
          capabilities: {
            supportsRemoteArm: true,
            supportsRemoteDisarm: false,
            supportsRemoteTare: true,
            supportsOtaUpdate: false
          },
          settings: {
            minParcelWeightGrams: 50,
            weightSettlingDurationMs: 3000,
            armingDelaySeconds: 10,
            vibrationWindowMs: 500,
            debounceLidMs: 80,
            magneticSensorInverted: false,
            buzzerActiveHigh: true,
            calibratedScaleFactor: 420.0,
            tareOffset: 0
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        memDevices.set(deviceId, newDev);
      }
      return memDevices.get(deviceId);
    },
    findByDeviceId: async (deviceId: string): Promise<any> => {
      if (getDbStatus().connected) {
        return DeviceModel.findOne({ deviceId });
      }
      return memDevices.get(deviceId) || null;
    },
    findAll: async (): Promise<any[]> => {
      if (getDbStatus().connected) {
        return DeviceModel.find().sort({ updatedAt: -1 });
      }
      return Array.from(memDevices.values());
    },
    updateStatus: async (deviceId: string, status: 'ONLINE' | 'OFFLINE', extra?: { wifiRssi?: number | null; firmwareVersion?: string; uptimeSeconds?: number }) => {
      if (getDbStatus().connected) {
        return DeviceModel.findOneAndUpdate(
          { deviceId },
          {
            $set: {
              connectionStatus: status,
              lastSeenAt: new Date(),
              ...(extra?.wifiRssi !== undefined ? { wifiRssi: extra.wifiRssi } : {}),
              ...(extra?.firmwareVersion ? { firmwareVersion: extra.firmwareVersion } : {}),
              ...(extra?.uptimeSeconds ? { uptimeSeconds: extra.uptimeSeconds } : {})
            }
          },
          { new: true, upsert: true }
        );
      }
      const dev = await repo.devices.getOrCreate(deviceId);
      dev.connectionStatus = status;
      dev.lastSeenAt = new Date();
      if (extra?.wifiRssi !== undefined) dev.wifiRssi = extra.wifiRssi;
      if (extra?.firmwareVersion) dev.firmwareVersion = extra.firmwareVersion;
      if (extra?.uptimeSeconds) dev.uptimeSeconds = extra.uptimeSeconds;
      dev.updatedAt = new Date();
      return dev;
    },
    updateSettings: async (deviceId: string, settings: Partial<DeviceSettings>): Promise<any> => {
      if (getDbStatus().connected) {
        return DeviceModel.findOneAndUpdate(
          { deviceId },
          { $set: { settings } },
          { new: true }
        );
      }
      const dev = await repo.devices.getOrCreate(deviceId);
      dev.settings = { ...dev.settings, ...settings };
      dev.updatedAt = new Date();
      return dev;
    }
  },

  // SENSOR READINGS (TELEMETRY)
  readings: {
    insert: async (telemetry: TelemetryPayload): Promise<any> => {
      const record = {
        deviceId: telemetry.deviceId,
        weightRaw: telemetry.weightRaw,
        weightGrams: telemetry.weightGrams,
        weightValid: telemetry.weightValid,
        hx711Ready: telemetry.hx711Ready,
        lidClosed: telemetry.lidClosed,
        magneticRaw: telemetry.magneticRaw,
        vibrationDetected: telemetry.vibrationDetected,
        vibrationRaw: telemetry.vibrationRaw,
        parcelPresent: telemetry.parcelPresent,
        armed: telemetry.armed,
        alarmActive: telemetry.alarmActive,
        redLedActive: telemetry.redLedActive ?? false,
        greenLedActive: telemetry.greenLedActive ?? true,
        buzzerActive: telemetry.buzzerActive ?? false,
        wifiRssi: telemetry.wifiRssi ?? null,
        uptimeSeconds: telemetry.uptimeSeconds,
        firmwareVersion: telemetry.firmwareVersion || '1.0.0',
        deviceTimestamp: telemetry.timestamp,
        receivedAt: new Date(),
        isSimulated: telemetry.isSimulated ?? false
      };

      if (getDbStatus().connected) {
        return SensorReadingModel.create(record);
      }
      memReadings.unshift(record);
      if (memReadings.length > 5000) memReadings.pop();
      return record;
    },
    getLatest: async (deviceId: string): Promise<any> => {
      if (getDbStatus().connected) {
        return SensorReadingModel.findOne({ deviceId }).sort({ receivedAt: -1 });
      }
      return memReadings.find((r) => r.deviceId === deviceId) || null;
    },
    findHistory: async (deviceId: string, limit = 100, startTime?: Date, endTime?: Date): Promise<any[]> => {
      if (getDbStatus().connected) {
        const query: any = { deviceId };
        if (startTime || endTime) {
          query.receivedAt = {};
          if (startTime) query.receivedAt.$gte = startTime;
          if (endTime) query.receivedAt.$lte = endTime;
        }
        return SensorReadingModel.find(query).sort({ receivedAt: -1 }).limit(limit);
      }
      return memReadings
        .filter((r) => {
          if (r.deviceId !== deviceId) return false;
          if (startTime && new Date(r.receivedAt) < startTime) return false;
          if (endTime && new Date(r.receivedAt) > endTime) return false;
          return true;
        })
        .slice(0, limit);
    }
  },

  // PARCEL EVENTS
  parcels: {
    insert: async (event: ParcelEventPayload): Promise<any> => {
      const record = {
        eventId: event.eventId,
        deviceId: event.deviceId,
        eventType: event.eventType,
        weightGrams: event.weightGrams,
        description: event.description,
        deviceTimestamp: event.timestamp,
        receivedAt: new Date(),
        isSimulated: event.isSimulated ?? false
      };
      if (getDbStatus().connected) {
        return ParcelEventModel.findOneAndUpdate(
          { eventId: event.eventId },
          { $setOnInsert: record },
          { upsert: true, new: true }
        );
      }
      const existing = memParcelEvents.find((e) => e.eventId === event.eventId);
      if (!existing) {
        memParcelEvents.unshift(record);
        if (memParcelEvents.length > 2000) memParcelEvents.pop();
        return record;
      }
      return existing;
    },
    findHistory: async (deviceId: string, limit = 50): Promise<any[]> => {
      if (getDbStatus().connected) {
        return ParcelEventModel.find({ deviceId }).sort({ receivedAt: -1 }).limit(limit);
      }
      return memParcelEvents.filter((e) => e.deviceId === deviceId).slice(0, limit);
    },
    getCurrent: async (deviceId: string): Promise<any> => {
      if (getDbStatus().connected) {
        return ParcelEventModel.findOne({ deviceId, eventType: 'PARCEL_DETECTED' }).sort({ receivedAt: -1 });
      }
      return memParcelEvents.find((e) => e.deviceId === deviceId && e.eventType === 'PARCEL_DETECTED') || null;
    }
  },

  // SECURITY EVENTS
  security: {
    insert: async (event: SecurityEventPayload): Promise<any> => {
      const record = {
        eventId: event.eventId,
        deviceId: event.deviceId,
        eventType: event.eventType,
        severity: event.severity,
        sourceSensor: event.sourceSensor,
        description: event.description,
        weightGrams: event.weightGrams,
        acknowledged: event.acknowledged ?? false,
        acknowledgedBy: event.acknowledgedBy ?? null,
        acknowledgedAt: event.acknowledgedAt ? new Date(event.acknowledgedAt) : null,
        deviceTimestamp: event.timestamp,
        receivedAt: new Date(),
        isSimulated: event.isSimulated ?? false
      };
      if (getDbStatus().connected) {
        return SecurityEventModel.findOneAndUpdate(
          { eventId: event.eventId },
          { $setOnInsert: record },
          { upsert: true, new: true }
        );
      }
      const existing = memSecurityEvents.find((e) => e.eventId === event.eventId);
      if (!existing) {
        memSecurityEvents.unshift(record);
        if (memSecurityEvents.length > 2000) memSecurityEvents.pop();
        return record;
      }
      return existing;
    },
    findHistory: async (
      deviceId: string,
      options: { limit?: number; page?: number; eventType?: string; severity?: string } = {}
    ): Promise<{ events: any[]; total: number }> => {
      const limit = options.limit || 50;
      const page = options.page || 1;
      const skip = (page - 1) * limit;

      if (getDbStatus().connected) {
        const query: any = { deviceId };
        if (options.eventType) query.eventType = options.eventType;
        if (options.severity) query.severity = options.severity;

        const [events, total] = await Promise.all([
          SecurityEventModel.find(query).sort({ receivedAt: -1 }).skip(skip).limit(limit),
          SecurityEventModel.countDocuments(query)
        ]);
        return { events, total };
      }

      let filtered = memSecurityEvents.filter((e) => {
        if (e.deviceId !== deviceId) return false;
        if (options.eventType && e.eventType !== options.eventType) return false;
        if (options.severity && e.severity !== options.severity) return false;
        return true;
      });

      return {
        events: filtered.slice(skip, skip + limit),
        total: filtered.length
      };
    },
    acknowledge: async (eventId: string, acknowledgedBy: string): Promise<any> => {
      const ackDate = new Date();
      if (getDbStatus().connected) {
        return SecurityEventModel.findOneAndUpdate(
          { eventId },
          { $set: { acknowledged: true, acknowledgedBy, acknowledgedAt: ackDate } },
          { new: true }
        );
      }
      const event = memSecurityEvents.find((e) => e.eventId === eventId);
      if (event) {
        event.acknowledged = true;
        event.acknowledgedBy = acknowledgedBy;
        event.acknowledgedAt = ackDate;
        return event;
      }
      return null;
    }
  },

  // COMMANDS
  commands: {
    insert: async (data: {
      commandId: string;
      deviceId: string;
      commandType: string;
      payload?: any;
      requestedBy: string;
    }): Promise<any> => {
      const record = {
        commandId: data.commandId,
        deviceId: data.deviceId,
        commandType: data.commandType,
        payload: data.payload || {},
        requestedBy: data.requestedBy,
        status: 'PENDING',
        requestedAt: new Date(),
        acknowledgedAt: null,
        result: null
      };
      if (getDbStatus().connected) {
        return DeviceCommandModel.create(record);
      }
      memCommands.unshift(record);
      return record;
    },
    updateAck: async (
      commandId: string,
      status: 'ACKNOWLEDGED' | 'FAILED' | 'REJECTED',
      resultMessage: string
    ): Promise<any> => {
      const ackDate = new Date();
      if (getDbStatus().connected) {
        return DeviceCommandModel.findOneAndUpdate(
          { commandId },
          { $set: { status, acknowledgedAt: ackDate, result: resultMessage } },
          { new: true }
        );
      }
      const cmd = memCommands.find((c) => c.commandId === commandId);
      if (cmd) {
        cmd.status = status;
        cmd.acknowledgedAt = ackDate;
        cmd.result = resultMessage;
        return cmd;
      }
      return null;
    },
    findByDevice: async (deviceId: string, limit = 50): Promise<any[]> => {
      if (getDbStatus().connected) {
        return DeviceCommandModel.find({ deviceId }).sort({ requestedAt: -1 }).limit(limit);
      }
      return memCommands.filter((c) => c.deviceId === deviceId).slice(0, limit);
    }
  }
};

