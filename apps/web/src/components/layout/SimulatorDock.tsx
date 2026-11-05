import React, { useState } from 'react';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import {
  SlidersHorizontal,
  PackagePlus,
  PackageMinus,
  DoorOpen,
  DoorClosed,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { TelemetryPayload, StoredSecurityEvent } from '@smart-parcel-box/shared';

export const SimulatorDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { selectedDeviceId, latest, updateTelemetry, addSecurityEvent } = useTelemetryStore();

  const triggerSimAction = async (action: string) => {
    setBusy(true);
    const now = new Date().toISOString();
    const current: TelemetryPayload = latest || {
      schemaVersion: 1,
      deviceId: selectedDeviceId,
      messageId: `msg_${Date.now()}`,
      sequence: 1,
      timestamp: now,
      weightRaw: 10420,
      weightGrams: 0,
      weightValid: true,
      hx711Ready: true,
      parcelPresent: false,
      magneticRaw: 0,
      lidClosed: true,
      vibrationRaw: 0,
      vibrationDetected: false,
      armed: true,
      alarmActive: false,
      redLedActive: false,
      greenLedActive: true,
      buzzerActive: false,
      wifiRssi: -58,
      uptimeSeconds: 100,
      firmwareVersion: '1.0.0-sim',
      isSimulated: true
    };

    switch (action) {
      case 'DEPOSIT_PARCEL': {
        const weight = 1450;
        const updated: TelemetryPayload = {
          ...current,
          weightGrams: weight,
          weightRaw: weight * 420 + 10420,
          weightValid: true,
          parcelPresent: true,
          lidClosed: true,
          isSimulated: true
        };
        updateTelemetry(updated);
        addSecurityEvent({
          schemaVersion: 1,
          eventId: `sim_${Date.now()}`,
          deviceId: selectedDeviceId,
          eventType: 'PARCEL_DETECTED',
          severity: 'INFO',
          sourceSensor: 'HX711',
          description: `Simulated parcel of ${weight}g placed in box`,
          timestamp: now,
          receivedAt: now,
          weightGrams: weight,
          acknowledged: false,
          isSimulated: true
        });
        break;
      }

      case 'OPEN_LID': {
        const isTamper = current.armed;
        const updated: TelemetryPayload = {
          ...current,
          lidClosed: false,
          magneticRaw: 1,
          alarmActive: isTamper ? true : current.alarmActive,
          redLedActive: isTamper,
          buzzerActive: isTamper,
          isSimulated: true
        };
        updateTelemetry(updated);
        addSecurityEvent({
          schemaVersion: 1,
          eventId: `sim_${Date.now()}`,
          deviceId: selectedDeviceId,
          eventType: isTamper ? 'ALARM_TRIGGERED' : 'LID_OPENED',
          severity: isTamper ? 'CRITICAL' : 'INFO',
          sourceSensor: 'REED_SWITCH',
          description: isTamper ? 'ALARM: Lid opened while box was ARMED!' : 'Box lid opened',
          timestamp: now,
          receivedAt: now,
          acknowledged: false,
          isSimulated: true
        });
        break;
      }

      case 'CLOSE_LID': {
        const updated: TelemetryPayload = {
          ...current,
          lidClosed: true,
          magneticRaw: 0,
          isSimulated: true
        };
        updateTelemetry(updated);
        addSecurityEvent({
          schemaVersion: 1,
          eventId: `sim_${Date.now()}`,
          deviceId: selectedDeviceId,
          eventType: 'LID_CLOSED',
          severity: 'INFO',
          sourceSensor: 'REED_SWITCH',
          description: 'Box lid securely closed',
          timestamp: now,
          receivedAt: now,
          acknowledged: false,
          isSimulated: true
        });
        break;
      }

      case 'TAMPER_VIBRATION': {
        const updated: TelemetryPayload = {
          ...current,
          vibrationDetected: true,
          vibrationRaw: 1,
          alarmActive: true,
          buzzerActive: true,
          redLedActive: true,
          isSimulated: true
        };
        updateTelemetry(updated);
        addSecurityEvent({
          schemaVersion: 1,
          eventId: `sim_${Date.now()}`,
          deviceId: selectedDeviceId,
          eventType: 'ALARM_TRIGGERED',
          severity: 'CRITICAL',
          sourceSensor: 'SW-420',
          description: 'TAMPER ALARM: Physical impact & shock detected on box frame!',
          timestamp: now,
          receivedAt: now,
          acknowledged: false,
          isSimulated: true
        });
        break;
      }

      case 'PRESS_BUTTON': {
        const updated: TelemetryPayload = {
          ...current,
          alarmActive: false,
          buzzerActive: false,
          redLedActive: false,
          vibrationDetected: false,
          greenLedActive: true,
          isSimulated: true
        };
        updateTelemetry(updated);
        addSecurityEvent({
          schemaVersion: 1,
          eventId: `sim_${Date.now()}`,
          deviceId: selectedDeviceId,
          eventType: 'ALARM_ACKNOWLEDGED',
          severity: 'INFO',
          sourceSensor: 'PUSH_BUTTON',
          description: 'Physical push button on GPIO 26 pressed: Alarm silenced',
          timestamp: now,
          receivedAt: now,
          acknowledged: true,
          isSimulated: true
        });
        break;
      }

      case 'REMOVE_PARCEL': {
        const updated: TelemetryPayload = {
          ...current,
          weightGrams: 0,
          weightRaw: 10420,
          parcelPresent: false,
          isSimulated: true
        };
        updateTelemetry(updated);
        addSecurityEvent({
          schemaVersion: 1,
          eventId: `sim_${Date.now()}`,
          deviceId: selectedDeviceId,
          eventType: 'PARCEL_REMOVED',
          severity: 'INFO',
          sourceSensor: 'HX711',
          description: 'Parcel removed from box (weight returned to 0g)',
          timestamp: now,
          receivedAt: now,
          weightGrams: 0,
          acknowledged: false,
          isSimulated: true
        });
        break;
      }

      case 'SENSOR_FAULT': {
        const updated: TelemetryPayload = {
          ...current,
          hx711Ready: false,
          weightValid: false,
          weightRaw: -1,
          weightGrams: 0,
          isSimulated: true
        };
        updateTelemetry(updated);
        addSecurityEvent({
          schemaVersion: 1,
          eventId: `sim_${Date.now()}`,
          deviceId: selectedDeviceId,
          eventType: 'SENSOR_FAULT',
          severity: 'WARNING',
          sourceSensor: 'HX711',
          description: 'HX711 diagnostic fault: Raw reading -1 received. Weight marked INVALID.',
          timestamp: now,
          receivedAt: now,
          acknowledged: false,
          isSimulated: true
        });
        break;
      }

      case 'RESET_NORMAL': {
        const updated: TelemetryPayload = {
          ...current,
          weightGrams: 0,
          weightRaw: 10420,
          weightValid: true,
          hx711Ready: true,
          lidClosed: true,
          magneticRaw: 0,
          vibrationDetected: false,
          vibrationRaw: 0,
          parcelPresent: false,
          armed: true,
          alarmActive: false,
          buzzerActive: false,
          redLedActive: false,
          greenLedActive: true,
          isSimulated: true
        };
        updateTelemetry(updated);
        break;
      }
    }

    setTimeout(() => setBusy(false), 300);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 border border-purple-500/40 text-purple-300 shadow-2xl hover:bg-slate-800 hover:border-purple-400 text-xs font-mono font-semibold transition-all"
        >
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <span>SIMULATOR CONTROLS</span>
        </button>
      ) : (
        <div className="bg-slate-900/95 border border-purple-500/40 rounded-xl shadow-2xl p-4 w-80 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-purple-200">HARDWARE SIMULATOR</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-100 text-xs px-2 py-0.5 rounded hover:bg-slate-800"
            >
              Close
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            Trigger simulated physical ESP32 actions and sensor anomalies to verify real-time dashboard response:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => triggerSimAction('DEPOSIT_PARCEL')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left font-mono text-[11px]"
            >
              <PackagePlus className="w-3.5 h-3.5 text-primary" />
              <span>Deposit (1450g)</span>
            </button>

            <button
              onClick={() => triggerSimAction('REMOVE_PARCEL')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left font-mono text-[11px]"
            >
              <PackageMinus className="w-3.5 h-3.5 text-muted" />
              <span>Remove Parcel</span>
            </button>

            <button
              onClick={() => triggerSimAction('OPEN_LID')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left font-mono text-[11px]"
            >
              <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Lid</span>
            </button>

            <button
              onClick={() => triggerSimAction('CLOSE_LID')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left font-mono text-[11px]"
            >
              <DoorClosed className="w-3.5 h-3.5 text-success" />
              <span>Close Lid</span>
            </button>

            <button
              onClick={() => triggerSimAction('TAMPER_VIBRATION')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-danger/20 hover:bg-danger/30 text-danger rounded border border-danger/40 text-left font-mono text-[11px]"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Tamper Shock</span>
            </button>

            <button
              onClick={() => triggerSimAction('PRESS_BUTTON')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-success/20 hover:bg-success/30 text-success rounded border border-success/40 text-left font-mono text-[11px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Push Button (Ack)</span>
            </button>

            <button
              onClick={() => triggerSimAction('SENSOR_FAULT')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 text-left font-mono text-[11px]"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>HX711 Raw -1</span>
            </button>

            <button
              onClick={() => triggerSimAction('RESET_NORMAL')}
              disabled={busy}
              className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-left font-mono text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
