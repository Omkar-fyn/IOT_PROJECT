import { z } from 'zod';

export const CommandTypeSchema = z.enum([
  'ARM_SYSTEM',
  'DISARM_SYSTEM',
  'ACKNOWLEDGE_ALARM',
  'TARE_SCALE',
  'REBOOT_DEVICE',
  'UPDATE_SETTINGS'
]);

export type CommandType = z.infer<typeof CommandTypeSchema>;

export const CommandPayloadSchema = z.object({
  commandId: z.string().min(1),
  deviceId: z.string().min(1),
  commandType: CommandTypeSchema,
  payload: z.record(z.any()).optional().default({}),
  requestedBy: z.string().min(1),
  timestamp: z.string().datetime().or(z.string())
});

export type CommandPayload = z.infer<typeof CommandPayloadSchema>;

export const CommandAckPayloadSchema = z.object({
  schemaVersion: z.number().int().default(1),
  commandId: z.string().min(1),
  deviceId: z.string().min(1),
  commandType: CommandTypeSchema,
  status: z.enum(['SUCCESS', 'FAILED', 'REJECTED_UNSUPPORTED']),
  message: z.string(),
  timestamp: z.string().datetime().or(z.string())
});

export type CommandAckPayload = z.infer<typeof CommandAckPayloadSchema>;

