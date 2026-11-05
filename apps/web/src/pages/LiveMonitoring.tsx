import React from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import {
  Activity,
  Cpu,
  Scale,
  DoorClosed,
  DoorOpen,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Zap
} from 'lucide-react';

export const LiveMonitoring: React.FC = () => {
  const { selectedDeviceId, latest, isStale, deviceConnected } = useTelemetryStore();

  const isWeightValid = latest ? latest.weightValid : false;
  const hxReady = latest ? latest.hx711Ready : false;
  const rawReading = latest ? latest.weightRaw : -1;

  return (
    <div className="space-y-6">
      {/* Page Title & Diagnostic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>Live Hardware Diagnostics & Sensor Telemetry</span>
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Real-time GPIO levels, physical state reconciliation, and electrical bus diagnostics for {selectedDeviceId}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-muted">Edge Device:</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
            ESP32 DevKit (GPIO 18-33)
          </span>
        </div>
      </div>

      {/* Primary Sensor Diagnostic Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* BLOCK 1: LOAD CELL & HX711 */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200">
              <Scale className="w-4 h-4 text-primary" />
              <span>LOAD CELL & HX711</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-primary border border-primary/30">
              GPIO 32 (DT) / 33 (SCK)
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Calibrated Weight:</span>
              <span className="font-bold text-slate-100">
                {isWeightValid ? `${latest?.weightGrams} g` : 'INVALID'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Raw Reading:</span>
              <span className={`font-bold ${rawReading === -1 ? 'text-danger' : 'text-slate-200'}`}>
                {rawReading} {rawReading === -1 && '(ERROR -1)'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">HX711 Ready Bus:</span>
              <span className={`font-bold ${hxReady ? 'text-success' : 'text-danger'}`}>
                {hxReady ? 'READY (HIGH)' : 'NOT READY'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Weight Validity State:</span>
              <span className={`font-bold ${isWeightValid ? 'text-success' : 'text-amber-400'}`}>
                {isWeightValid ? 'VALID' : 'FAULT / CALIBRATION REQ.'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-muted">Tare Factor:</span>
              <span className="text-slate-400">420.0 pts/gram</span>
            </div>
          </div>
        </div>

        {/* BLOCK 2: REED SWITCH / MAGNETIC SENSOR */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200">
              <DoorClosed className="w-4 h-4 text-accent" />
              <span>MAGNETIC REED SWITCH</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-accent border border-accent/30">
              GPIO 27 (DO)
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Physical Lid State:</span>
              <span className={`font-bold ${latest?.lidClosed ? 'text-success' : 'text-amber-400'}`}>
                {latest?.lidClosed ? 'CLOSED (SECURED)' : 'OPEN'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Digital Logic Level:</span>
              <span className="text-slate-100 font-bold">
                {latest?.magneticRaw === 0 ? 'LOW (0V)' : 'HIGH (3.3V)'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Electrical Polarity:</span>
              <span className="text-slate-400">Active-LOW (Magnet present)</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Software Debounce:</span>
              <span className="text-slate-400">80 ms filter</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-muted">Tamper Trigger:</span>
              <span className="text-slate-400">{latest?.armed ? 'ARMED MONITOR' : 'UNARMED'}</span>
            </div>
          </div>
        </div>

        {/* BLOCK 3: SW-420 VIBRATION SENSOR */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-border-highlight transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-200">
              <Zap className="w-4 h-4 text-danger" />
              <span>SW-420 VIBRATION SENSOR</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-danger border border-danger/30">
              GPIO 25 (DO)
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Vibration State:</span>
              <span className={`font-bold ${latest?.vibrationDetected ? 'text-danger' : 'text-success'}`}>
                {latest?.vibrationDetected ? 'SHOCK DETECTED' : 'QUIET / NORMAL'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">DO Logic Level:</span>
              <span className="text-slate-100 font-bold">
                {latest?.vibrationRaw === 1 ? 'HIGH (PULSE)' : 'LOW (IDLE)'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Noise Filter:</span>
              <span className="text-slate-400">200ms Window (≥3 hits)</span>
            </div>

            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted">Physical Threshold:</span>
              <span className="text-slate-400">Potentiometer on module</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-muted">Tamper Severity:</span>
              <span className="text-danger font-semibold">CRITICAL (If armed)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Output Actuators & ESP32 System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OUTPUT ACTUATORS (LEDs & BUZZER) */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
              Output Actuators & Physical Annunciators
            </h2>
            <span className="text-[10px] font-mono text-muted">Edge Driven</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Red LED */}
            <div className="p-3 bg-background/50 border border-border rounded-lg space-y-2 text-center">
              <div className="text-[10px] font-mono text-muted">RED LED (GPIO 21)</div>
              <div
                className={`w-4 h-4 mx-auto rounded-full ${
                  latest?.redLedActive ? 'bg-danger animate-ping shadow-lg shadow-danger' : 'bg-slate-800'
                }`}
              />
              <div className="text-xs font-mono font-bold text-slate-200">
                {latest?.redLedActive ? 'ILLUMINATED' : 'OFF'}
              </div>
              <div className="text-[10px] text-muted">Alarm Strobe</div>
            </div>

            {/* Green LED */}
            <div className="p-3 bg-background/50 border border-border rounded-lg space-y-2 text-center">
              <div className="text-[10px] font-mono text-muted">GREEN LED (GPIO 19)</div>
              <div
                className={`w-4 h-4 mx-auto rounded-full ${
                  latest?.greenLedActive ? 'bg-success shadow-lg shadow-success' : 'bg-slate-800'
                }`}
              />
              <div className="text-xs font-mono font-bold text-slate-200">
                {latest?.greenLedActive ? 'ILLUMINATED' : 'OFF'}
              </div>
              <div className="text-[10px] text-muted">Ready / Armed</div>
            </div>

            {/* Active Buzzer */}
            <div className="p-3 bg-background/50 border border-border rounded-lg space-y-2 text-center">
              <div className="text-[10px] font-mono text-muted">BUZZER (GPIO 18)</div>
              {latest?.buzzerActive ? (
                <Volume2 className="w-5 h-5 mx-auto text-danger animate-bounce" />
              ) : (
                <VolumeX className="w-5 h-5 mx-auto text-slate-600" />
              )}
              <div className="text-xs font-mono font-bold text-slate-200">
                {latest?.buzzerActive ? 'SOUNDING' : 'SILENT'}
              </div>
              <div className="text-[10px] text-muted">Audible Siren</div>
            </div>
          </div>
        </div>

        {/* ESP32 MICROCONTROLLER TELEMETRY */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
              ESP32 Edge Health & Network Stream
            </h2>
            <span className="text-[10px] font-mono text-muted">WiFi STA</span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-2.5 bg-background/50 border border-border rounded-lg">
              <div className="text-muted text-[10px]">Wi-Fi RSSI Strength</div>
              <div className="text-base font-bold text-slate-100 mt-1">
                {latest?.wifiRssi ? `${latest.wifiRssi} dBm` : '-58 dBm'}
              </div>
              <div className="text-[10px] text-success mt-0.5">Optimal Connection</div>
            </div>

            <div className="p-2.5 bg-background/50 border border-border rounded-lg">
              <div className="text-muted text-[10px]">System Uptime</div>
              <div className="text-base font-bold text-slate-100 mt-1">
                {latest ? `${latest.uptimeSeconds}s` : '0s'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Continuous Operation</div>
            </div>

            <div className="p-2.5 bg-background/50 border border-border rounded-lg">
              <div className="text-muted text-[10px]">Firmware Revision</div>
              <div className="text-base font-bold text-slate-100 mt-1">
                {latest?.firmwareVersion || '1.0.0'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Local FSM Active</div>
            </div>

            <div className="p-2.5 bg-background/50 border border-border rounded-lg">
              <div className="text-muted text-[10px]">Sequence ID</div>
              <div className="text-base font-bold text-slate-100 mt-1">
                #{latest?.sequence || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Packet Monotonic</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
