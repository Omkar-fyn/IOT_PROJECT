import { z } from 'zod';

export const DeviceSettingsSchema = z.object({
  minParcelWeightGrams: z.number().min(1).default(50),
  weightSettlingDurationMs: z.number().min(500).default(3000),
  armingDelaySeconds: z.number().min(0).default(10),
  vibrationWindowMs: z.number().min(100).default(500),
  debounceLidMs: z.number().min(20).default(80),
  magneticSensorInverted: z.boolean().default(false),
  buzzerActiveHigh: z.boolean().default(true),
  calibratedScaleFactor: z.number().default(420.0),
  tareOffset: z.number().default(0)
});

export type DeviceSettings = z.infer<typeof DeviceSettingsSchema>;

export const DeviceCapabilitiesSchema = z.object({
  supportsRemoteArm: z.boolean().default(true),
  supportsRemoteDisarm: z.boolean().default(false), // Physical button required on prototype
  supportsRemoteTare: z.boolean().default(true),
  supportsOtaUpdate: z.boolean().default(false)
});

export type DeviceCapabilities = z.infer<typeof DeviceCapabilitiesSchema>;

export const DeviceStatusPayloadSchema = z.object({
  schemaVersion: z.number().int().default(1),
  deviceId: z.string().min(1),
  status: z.enum(['ONLINE', 'OFFLINE']),
  timestamp: z.string().datetime().or(z.string()),
  firmwareVersion: z.string().optional(),
  wifiRssi: z.number().optional()
});

export type DeviceStatusPayload = z.infer<typeof DeviceStatusPayloadSchema>;

