export const SECURITY_EVENT_TYPES = [
  'PARCEL_DETECTED',
  'LID_OPENED',
  'LID_CLOSED',
  'VIBRATION_DETECTED',
  'SYSTEM_ARMED',
  'SYSTEM_DISARMED',
  'ALARM_TRIGGERED',
  'ALARM_ACKNOWLEDGED',
  'PARCEL_REMOVED',
  'SENSOR_FAULT',
  'DEVICE_ONLINE',
  'DEVICE_OFFLINE'
] as const;

export type SecurityEventType = typeof SECURITY_EVENT_TYPES[number];

export const EVENT_SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'] as const;
export type EventSeverity = typeof EVENT_SEVERITIES[number];

export const BOX_STATES = [
  'READY',
  'PARCEL_PRESENT',
  'ARMING',
  'ARMED',
  'ALARM',
  'DISARMED',
  'SENSOR_FAULT'
] as const;
export type BoxState = typeof BOX_STATES[number];

export const LID_STATES = ['OPEN', 'CLOSED', 'UNKNOWN'] as const;
export type LidState = typeof LID_STATES[number];

export const VIBRATION_STATES = ['NORMAL', 'DETECTED', 'SENSOR_FAULT'] as const;
export type VibrationState = typeof VIBRATION_STATES[number];

export const HARDWARE_PINS = {
  MAGNETIC_DO: 27,
  SW420_DO: 25,
  PUSH_BUTTON: 26,
  BUZZER: 18,
  RED_LED: 21,
  GREEN_LED: 19,
  HX711_DT: 32,
  HX711_SCK: 33
} as const;

export const MQTT_TOPICS = {
  telemetry: (deviceId: string) => `parcelbox/${deviceId}/telemetry`,
  events: (deviceId: string) => `parcelbox/${deviceId}/events`,
  status: (deviceId: string) => `parcelbox/${deviceId}/status`,
  commands: (deviceId: string) => `parcelbox/${deviceId}/commands`,
  commandAcks: (deviceId: string) => `parcelbox/${deviceId}/command-acks`,
  wildcardTelemetry: 'parcelbox/+/telemetry',
  wildcardEvents: 'parcelbox/+/events',
  wildcardStatus: 'parcelbox/+/status',
  wildcardCommandAcks: 'parcelbox/+/command-acks'
} as const;

export const DEFAULT_THRESHOLDS = {
  MIN_PARCEL_WEIGHT_GRAMS: 50,
  WEIGHT_SETTLING_DURATION_MS: 3000,
  ARMING_DELAY_SECONDS: 10,
  VIBRATION_WINDOW_MS: 500,
  DEBOUNCE_LID_MS: 80,
  STALE_DATA_TIMEOUT_MS: 15000
} as const;

