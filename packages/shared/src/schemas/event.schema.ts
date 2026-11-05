import { z } from 'zod';
import { SECURITY_EVENT_TYPES, EVENT_SEVERITIES } from '../constants';

export const SecurityEventPayloadSchema = z.object({
  schemaVersion: z.number().int().default(1),
  eventId: z.string().min(1, 'Event ID is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  eventType: z.enum(SECURITY_EVENT_TYPES),
  severity: z.enum(EVENT_SEVERITIES),
  sourceSensor: z.string(),
  description: z.string(),
  timestamp: z.string().datetime().or(z.string()),
  weightGrams: z.number().optional(),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().nullable().optional(),
  acknowledgedAt: z.string().nullable().optional(),
  isSimulated: z.boolean().optional().default(false)
});

export type SecurityEventPayload = z.infer<typeof SecurityEventPayloadSchema>;

export const ParcelEventPayloadSchema = z.object({
  schemaVersion: z.number().int().default(1),
  eventId: z.string().min(1),
  deviceId: z.string().min(1),
  eventType: z.enum(['PARCEL_DETECTED', 'PARCEL_REMOVED']),
  weightGrams: z.number(),
  description: z.string(),
  timestamp: z.string().datetime().or(z.string()),
  isSimulated: z.boolean().optional().default(false)
});

export type ParcelEventPayload = z.infer<typeof ParcelEventPayloadSchema>;

