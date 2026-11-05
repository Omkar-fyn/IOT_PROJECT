import { z } from 'zod';

export const TelemetryPayloadSchema = z.object({
  schemaVersion: z.number().int().default(1),
  deviceId: z.string().min(1, 'Device ID is required'),
  messageId: z.string().default(() => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  sequence: z.number().int().nonnegative(),
  timestamp: z.string().datetime().or(z.string()),
  weightRaw: z.number(),
  weightGrams: z.number(),
  weightValid: z.boolean(),
  hx711Ready: z.boolean(),
  parcelPresent: z.boolean(),
  magneticRaw: z.number().int(),
  lidClosed: z.boolean(),
  vibrationRaw: z.number().int(),
  vibrationDetected: z.boolean(),
  armed: z.boolean(),
  alarmActive: z.boolean(),
  redLedActive: z.boolean().optional().default(false),
  greenLedActive: z.boolean().optional().default(true),
  buzzerActive: z.boolean().optional().default(false),
  wifiRssi: z.number().int().nullable().optional(),
  uptimeSeconds: z.number().int().nonnegative(),
  firmwareVersion: z.string().default('1.0.0'),
  isSimulated: z.boolean().optional().default(false)
});

export type TelemetryPayload = z.infer<typeof TelemetryPayloadSchema>;

