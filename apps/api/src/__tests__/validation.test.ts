import { describe, it, expect } from 'vitest';
import {
  TelemetryPayloadSchema,
  SecurityEventPayloadSchema,
  CommandPayloadSchema,
  DeviceSettingsSchema
} from '@smart-parcel-box/shared';

describe('Validation Schemas (Zod)', () => {
  it('should validate valid telemetry payload correctly', () => {
    const validTelemetry = {
      schemaVersion: 1,
      deviceId: 'BOX-001',
      sequence: 42,
      timestamp: new Date().toISOString(),
      weightRaw: 125000,
      weightGrams: 850,
      weightValid: true,
      hx711Ready: true,
      parcelPresent: true,
      magneticRaw: 0,
      lidClosed: true,
      vibrationRaw: 0,
      vibrationDetected: false,
      armed: true,
      alarmActive: false,
      wifiRssi: -62,
      uptimeSeconds: 3600,
      firmwareVersion: '1.0.0'
    };

    const parsed = TelemetryPayloadSchema.safeParse(validTelemetry);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.deviceId).toBe('BOX-001');
      expect(parsed.data.weightGrams).toBe(850);
    }
  });

  it('should reject telemetry missing required fields like deviceId or sequence', () => {
    const invalidTelemetry = {
      schemaVersion: 1,
      timestamp: new Date().toISOString(),
      weightGrams: 500
    };

    const parsed = TelemetryPayloadSchema.safeParse(invalidTelemetry);
    expect(parsed.success).toBe(false);
  });

  it('should validate security events and enforce eventType enum', () => {
    const validEvent = {
      schemaVersion: 1,
      eventId: 'evt_123',
      deviceId: 'BOX-001',
      eventType: 'ALARM_TRIGGERED',
      severity: 'CRITICAL',
      sourceSensor: 'REED_SWITCH',
      description: 'Lid opened while armed',
      timestamp: new Date().toISOString()
    };

    const parsed = SecurityEventPayloadSchema.safeParse(validEvent);
    expect(parsed.success).toBe(true);

    const invalidEvent = {
      ...validEvent,
      eventType: 'UNKNOWN_EVENT_TYPE'
    };
    const invalidParsed = SecurityEventPayloadSchema.safeParse(invalidEvent);
    expect(invalidParsed.success).toBe(false);
  });

  it('should validate and apply default device settings', () => {
    const emptySettings = {};
    const parsed = DeviceSettingsSchema.safeParse(emptySettings);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minParcelWeightGrams).toBe(50);
      expect(parsed.data.debounceLidMs).toBe(80);
    }
  });
});

