import React, { useState } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { api } from '../services/api';
import { StoredSecurityEvent } from '@smart-parcel-box/shared';
import {
  ShieldAlert,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  CheckCircle,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';

export const SecurityCenter: React.FC = () => {
  const {
    selectedDeviceId,
    alarmActive,
    armed,
    recentEvents,
    addSecurityEvent,
    updateTelemetry,
    latest
  } = useTelemetryStore();
  const [loading, setLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  const handleArmSystem = async () => {
    setLoading(true);
    setStatusNotice('');
    try {
      const res = await api.sendCommand(selectedDeviceId, 'ARM_SYSTEM');
      if (res.success) {
        setStatusNotice('Command ARM_SYSTEM dispatched to device.');
        if (latest) {
          updateTelemetry({ ...latest, armed: true });
        }
      }
    } catch (err: any) {
      setStatusNotice(`Failed to arm: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlarm = async (eventId?: string) => {
    setLoading(true);
    setStatusNotice('');
    try {
      const res = await api.sendCommand(selectedDeviceId, 'ACKNOWLEDGE_ALARM');
      if (res.success) {
        setStatusNotice('Alarm acknowledged and command dispatched to silence buzzer.');
        if (latest) {
          updateTelemetry({ ...latest, alarmActive: false, buzzerActive: false, redLedActive: false });
        }
      }
      if (eventId) {
        await api.acknowledgeSecurityEvent(selectedDeviceId, eventId);
      }
    } catch (err: any) {
      setStatusNotice(`Failed to acknowledge: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-danger" />
          <span>Security & Tamper Incident Operations Center</span>
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          High-priority physical tamper detection, siren controls, and security audit log for {selectedDeviceId}
        </p>
      </div>

      {statusNotice && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-primary text-xs font-mono">
          {statusNotice}
        </div>
      )}

      {/* Main Security Alarm Banner */}
      <div
        className={`border rounded-xl p-6 transition-all ${
          alarmActive
            ? 'bg-danger/10 border-danger/50 shadow-2xl shadow-danger/20 animate-pulse'
            : armed
            ? 'bg-card border-success/40'
            : 'bg-card border-border'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                alarmActive
                  ? 'bg-danger text-background animate-bounce shadow-lg shadow-danger/40'
                  : armed
                  ? 'bg-success/20 text-success border border-success/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {alarmActive ? (
                <ShieldAlert className="w-9 h-9" />
              ) : armed ? (
                <ShieldCheck className="w-9 h-9" />
              ) : (
                <Lock className="w-9 h-9" />
              )}
            </div>

            <div>
              <div className="text-xs font-mono text-muted uppercase">SYSTEM SECURITY STATUS</div>
              <div
                className={`text-2xl font-bold font-mono tracking-tight ${
                  alarmActive ? 'text-danger' : armed ? 'text-success' : 'text-slate-300'
                }`}
              >
                {alarmActive ? 'PHYSICAL TAMPER ALARM ACTIVE!' : armed ? 'ARMED & MONITORING' : 'DISARMED'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {alarmActive
                  ? 'Active siren sounding on GPIO 18, Red strobe on GPIO 21. Physical inspection required!'
                  : armed
                  ? 'Reed switch (GPIO 27) and SW-420 (GPIO 25) actively guarding chamber.'
                  : 'Tamper sirens inactive.'}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {alarmActive && (
              <button
                onClick={() => handleAcknowledgeAlarm()}
                disabled={loading}
                className="px-4 py-2.5 bg-danger hover:bg-red-600 text-white font-semibold text-xs rounded-lg shadow-lg shadow-danger/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <VolumeX className="w-4 h-4" />
                <span>Silence / Acknowledge Alarm</span>
              </button>
            )}

            {!armed && (
              <button
                onClick={handleArmSystem}
                disabled={loading}
                className="px-4 py-2.5 bg-success hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-lg shadow-lg shadow-success/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>Arm System</span>
              </button>
            )}

            {/* Remote Disarm Disabled Notice by Capability Rules */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-400 text-xs font-mono">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Physical Button on Box (GPIO 26) Required to Disarm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Directives & Hardware Decoupling Notice */}
      <div className="p-4 bg-slate-800/30 border border-border rounded-xl text-xs space-y-2">
        <div className="font-bold font-mono text-slate-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span>AUTONOMOUS LOCAL SECURITY GUARANTEE:</span>
        </div>
        <p className="text-slate-400">
          The ESP32 firmware executes all physical alarm decisions locally. If the box is armed and a tamper event occurs (lid opening or impact vibration), the active buzzer (GPIO 18) and red alarm LED (GPIO 21) trigger instantly without requiring internet, MQTT, or backend connectivity. The dashboard is never a single point of failure.
        </p>
      </div>

      {/* Security Incident Timeline */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Security Incident Trail & Tamper History
          </h2>
          <span className="text-[10px] font-mono text-muted">Audited Security Records</span>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12 text-muted font-mono text-xs">
            No tamper or security incidents logged for {selectedDeviceId}. Chamber is secure.
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((evt: StoredSecurityEvent) => (
              <div
                key={evt.eventId}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  evt.severity === 'CRITICAL'
                    ? 'bg-danger/10 border-danger/40 text-danger'
                    : evt.severity === 'WARNING'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-800/40 border-border text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        evt.severity === 'CRITICAL'
                          ? 'bg-danger text-background'
                          : evt.severity === 'WARNING'
                          ? 'bg-amber-400 text-background'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {evt.severity}
                    </span>
                    <span className="font-bold text-xs font-mono">{evt.eventType}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      via {evt.sourceSensor}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-sans">{evt.description}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Timestamp: {new Date(evt.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {evt.acknowledged ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-success bg-success/10 px-2 py-1 rounded border border-success/20">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledgeAlarm(evt.eventId)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded border border-slate-600 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
