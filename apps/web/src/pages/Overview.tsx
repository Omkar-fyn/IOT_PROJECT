import React, { useMemo } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { StoredSecurityEvent } from '@smart-parcel-box/shared';
import {
  Wifi,
  WifiOff,
  Scale,
  Package,
  DoorOpen,
  DoorClosed,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Cpu
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const Overview: React.FC = () => {
  const {
    selectedDeviceId,
    deviceConnected,
    isStale,
    latest,
    history,
    recentEvents,
    computeBoxState,
    computeLidState,
    computeVibrationState,
    alarmActive,
    armed
  } = useTelemetryStore();

  const boxState = computeBoxState();
  const lidState = computeLidState();
  const vibeState = computeVibrationState();

  const weightGrams = latest && latest.weightValid ? latest.weightGrams : 0;
  const weightKg = (weightGrams / 1000).toFixed(2);
  const isWeightFault = latest ? !latest.weightValid || !latest.hx711Ready : false;

  const lastEvent = recentEvents[0];

  const chartData = useMemo(() => {
    if (history.length > 0) return history;
    return [
      { timestamp: '10:00:00', weightGrams: 0, raw: 10420 },
      { timestamp: '10:01:00', weightGrams: 0, raw: 10420 },
      { timestamp: '10:02:00', weightGrams: 0, raw: 10420 }
    ];
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Stale Data Warning Banner */}
      {isStale && (
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase font-mono">CONNECTION LOST / DATA STALE</div>
              <div className="text-xs text-amber-300/80">
                No telemetry heartbeat received from {selectedDeviceId} within 15 seconds. Displaying last cached states.
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-amber-500/20 text-amber-300">
            OFFLINE
          </span>
        </div>
      )}

      {/* 8 Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: DEVICE STATUS */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 1: DEVICE STATUS</span>
            {deviceConnected && !isStale ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-danger" />
            )}
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                deviceConnected && !isStale ? 'bg-success animate-pulse' : 'bg-danger'
              }`}
            />
            <span>{deviceConnected && !isStale ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>RSSI: {latest?.wifiRssi ? `${latest.wifiRssi} dBm` : 'N/A'}</span>
            <span>Uptime: {latest ? `${Math.floor(latest.uptimeSeconds / 60)}m` : '0m'}</span>
          </div>
        </div>

        {/* CARD 2: BOX STATUS */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 2: BOX STATUS</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-slate-100">
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                boxState === 'ALARM'
                  ? 'bg-danger/20 text-danger border border-danger/40 animate-pulse'
                  : boxState === 'ARMED'
                  ? 'bg-success/20 text-success border border-success/40'
                  : boxState === 'PARCEL_PRESENT'
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : boxState === 'SENSOR_FAULT'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {boxState}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Security State: {armed ? 'ARMED' : 'DISARMED'}
          </div>
        </div>

        {/* CARD 3: CURRENT WEIGHT */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 3: CURRENT WEIGHT</span>
            <Scale className="w-4 h-4 text-primary" />
          </div>
          {isWeightFault ? (
            <div className="text-danger font-mono text-sm font-bold flex items-center gap-1.5 py-1">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>SENSOR FAULT (-1)</span>
            </div>
          ) : (
            <div className="text-2xl font-bold font-mono text-slate-100 flex items-baseline gap-2">
              <span>{weightGrams}</span>
              <span className="text-xs text-muted font-normal">grams ({weightKg} kg)</span>
            </div>
          )}
          <div className="text-[11px] font-mono text-slate-400">
            Status: {isWeightFault ? 'Calibration / Reading Invalid' : 'Calibrated (±5g)'}
          </div>
        </div>

        {/* CARD 4: PARCEL STATUS */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 4: PARCEL STATUS</span>
            <Package className="w-4 h-4 text-accent" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
            {latest?.parcelPresent ? (
              <span className="text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                PARCEL PRESENT
              </span>
            ) : (
              <span className="text-slate-400">NO PARCEL</span>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-400 truncate">
            {latest?.parcelPresent ? `Weight: ${weightGrams}g detected` : 'Empty chamber ready'}
          </div>
        </div>

        {/* CARD 5: LID STATUS */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 5: LID STATUS</span>
            {lidState === 'CLOSED' ? (
              <DoorClosed className="w-4 h-4 text-success" />
            ) : (
              <DoorOpen className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <span
              className={lidState === 'CLOSED' ? 'text-success' : 'text-amber-400 animate-pulse'}
            >
              {lidState}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Magnetic DO: {latest?.magneticRaw ?? 0} (GPIO 27)
          </div>
        </div>

        {/* CARD 6: VIBRATION STATUS */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 6: VIBRATION STATUS</span>
            <Activity className="w-4 h-4 text-danger" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <span
              className={vibeState === 'DETECTED' ? 'text-danger animate-bounce' : 'text-slate-300'}
            >
              {vibeState}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            SW-420 DO: {latest?.vibrationRaw ?? 0} (GPIO 25)
          </div>
        </div>

        {/* CARD 7: SECURITY STATUS */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 7: SECURITY STATUS</span>
            {alarmActive ? (
              <ShieldAlert className="w-4 h-4 text-danger animate-bounce" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-success" />
            )}
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {alarmActive ? (
              <span className="text-danger">ALARM ACTIVE</span>
            ) : armed ? (
              <span className="text-success">ARMED & SECURE</span>
            ) : (
              <span className="text-slate-400">DISARMED</span>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Buzzer: {latest?.buzzerActive ? 'SOUNDING' : 'OFF'}
          </div>
        </div>

        {/* CARD 8: LAST ACTIVITY */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between text-muted text-xs font-mono">
            <span>CARD 8: LAST ACTIVITY</span>
            <Clock className="w-4 h-4 text-muted" />
          </div>
          <div className="text-sm font-semibold text-slate-200 truncate">
            {lastEvent ? lastEvent.eventType : 'No Recent Events'}
          </div>
          <div className="text-[11px] font-mono text-slate-400 truncate">
            {lastEvent ? new Date(lastEvent.timestamp).toLocaleTimeString() : 'Awaiting activity'}
          </div>
        </div>
      </div>

      {/* Real-time Weight Chart & Recent Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Weight Timeline */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Load Cell Telemetry (Weight Over Time)
              </h2>
              <p className="text-xs text-muted font-mono">
                Real-time weight streaming from HX711 on GPIO 32/33 (grams)
              </p>
            </div>
            <div className="text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
              Live Stream
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="weightGrams"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#weightGrad)"
                  name="Weight (g)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Recent Security Events */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Recent Security Events
              </h2>
              <span className="text-[10px] font-mono text-muted">Audited Trail</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <div className="text-center py-10 text-muted font-mono text-xs">
                  No security events recorded yet
                </div>
              ) : (
                recentEvents.slice(0, 5).map((evt: StoredSecurityEvent) => (
                  <div
                    key={evt.eventId}
                    className="p-2.5 rounded-lg bg-background/50 border border-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-danger/20 text-danger border border-danger/30'
                            : evt.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {evt.eventType}
                      </span>
                      <span className="text-[10px] font-mono text-muted">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px] truncate">{evt.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span>Hardware Model</span>
            <span className="text-slate-300">ESP32-WROOM-32</span>
          </div>
        </div>
      </div>
    </div>
  );
};
