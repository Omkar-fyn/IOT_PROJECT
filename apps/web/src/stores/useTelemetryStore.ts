import { create } from 'zustand';
import { TelemetryPayload, StoredSecurityEvent, BoxState, LidState, VibrationState } from '@smart-parcel-box/shared';

interface TelemetryState {
  selectedDeviceId: string;
  socketConnected: boolean;
  deviceConnected: boolean;
  isStale: boolean;
  lastTelemetryTimestamp: number | null;
  latest: TelemetryPayload | null;
  history: Array<{ timestamp: string; weightGrams: number; raw: number; isSimulated?: boolean }>;
  recentEvents: StoredSecurityEvent[];
  alarmActive: boolean;
  armed: boolean;

  // Actions
  setSelectedDeviceId: (id: string) => void;
  setSocketConnected: (connected: boolean) => void;
  setDeviceConnected: (connected: boolean) => void;
  updateTelemetry: (data: TelemetryPayload) => void;
  addSecurityEvent: (event: StoredSecurityEvent) => void;
  checkStaleStatus: () => void;
  computeBoxState: () => BoxState;
  computeLidState: () => LidState;
  computeVibrationState: () => VibrationState;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  selectedDeviceId: 'BOX-001',
  socketConnected: false,
  deviceConnected: false,
  isStale: true,
  lastTelemetryTimestamp: null,
  latest: null,
  history: [],
  recentEvents: [],
  alarmActive: false,
  armed: false,

  setSelectedDeviceId: (id) => set({ selectedDeviceId: id }),
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  setDeviceConnected: (connected) => set({ deviceConnected: connected }),

  updateTelemetry: (data) => {
    const now = Date.now();
    const formattedHistoryItem = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      weightGrams: data.weightValid ? data.weightGrams : 0,
      raw: data.weightRaw,
      isSimulated: data.isSimulated
    };

    set((state) => {
      const updatedHistory = [...state.history, formattedHistoryItem];
      if (updatedHistory.length > 50) updatedHistory.shift();

      return {
        latest: data,
        deviceConnected: true,
        isStale: false,
        lastTelemetryTimestamp: now,
        alarmActive: data.alarmActive,
        armed: data.armed,
        history: updatedHistory
      };
    });
  },

  addSecurityEvent: (event) => {
    set((state) => {
      const exists = state.recentEvents.some((e) => e.eventId === event.eventId);
      if (exists) return state;

      const isAlarm = event.eventType === 'ALARM_TRIGGERED' || event.eventType === 'VIBRATION_DETECTED';
      return {
        recentEvents: [event, ...state.recentEvents].slice(0, 30),
        alarmActive: isAlarm ? true : event.eventType === 'ALARM_ACKNOWLEDGED' ? false : state.alarmActive
      };
    });
  },

  checkStaleStatus: () => {
    const last = get().lastTelemetryTimestamp;
    if (!last) {
      set({ isStale: true });
      return;
    }
    const elapsed = Date.now() - last;
    if (elapsed > 15000) {
      set({ isStale: true, deviceConnected: false });
    }
  },

  computeBoxState: (): BoxState => {
    const l = get().latest;
    const isStale = get().isStale;
    if (isStale || !l) return 'SENSOR_FAULT';
    if (!l.hx711Ready || !l.weightValid) return 'SENSOR_FAULT';
    if (l.alarmActive) return 'ALARM';
    if (l.armed) return 'ARMED';
    if (l.parcelPresent) return 'PARCEL_PRESENT';
    return 'READY';
  },

  computeLidState: (): LidState => {
    const l = get().latest;
    if (!l) return 'UNKNOWN';
    return l.lidClosed ? 'CLOSED' : 'OPEN';
  },

  computeVibrationState: (): VibrationState => {
    const l = get().latest;
    if (!l) return 'NORMAL';
    return l.vibrationDetected ? 'DETECTED' : 'NORMAL';
  }
}));

