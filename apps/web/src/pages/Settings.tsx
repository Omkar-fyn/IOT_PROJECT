import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  AlertTriangle,
  Scale,
  DoorClosed,
  Clock,
  Radio,
  Bell,
  Sliders
} from 'lucide-react';
import { DeviceSettings } from '@smart-parcel-box/shared';

export const Settings: React.FC = () => {
  const { selectedDeviceId } = useTelemetryStore();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [settings, setSettings] = useState<DeviceSettings>({
    minParcelWeightGrams: 50,
    weightSettlingDurationMs: 3000,
    armingDelaySeconds: 10,
    vibrationWindowMs: 500,
    debounceLidMs: 80,
    magneticSensorInverted: false,
    buzzerActiveHigh: true,
    calibratedScaleFactor: 420.0,
    tareOffset: 0
  });

  useEffect(() => {
    api.getDeviceSettings(selectedDeviceId).then((res: any) => {
      if (res.success && res.data) {
        setSettings(res.data.settings);
      }
    });
  }, [selectedDeviceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await api.updateDeviceSettings(selectedDeviceId, settings);
      if (res.success) {
        setSuccessMsg('Settings saved to backend and UPDATE_SETTINGS command dispatched to ESP32.');
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span>System & Hardware Sensor Calibration Settings</span>
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          Configure sensor debounce thresholds, arming delays, and MQTT parameters for {selectedDeviceId}
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-success text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: LOAD CELL & WEIGHT CALIBRATION */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-mono font-bold text-slate-200 uppercase">
            <Scale className="w-4 h-4 text-primary" />
            <span>Load Cell & Weight Settling Calibration</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-slate-300">Minimum Parcel Trigger (grams)</label>
              <input
                type="number"
                value={settings.minParcelWeightGrams}
                onChange={(e) => setSettings({ ...settings, minParcelWeightGrams: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
                min={1}
              />
              <span className="text-[10px] text-muted">Weight required to transition from Empty to Parcel Present</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300">Weight Settling Window (ms)</label>
              <input
                type="number"
                value={settings.weightSettlingDurationMs}
                onChange={(e) => setSettings({ ...settings, weightSettlingDurationMs: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
                min={500}
                step={100}
              />
              <span className="text-[10px] text-muted">Averaging duration before locking weight reading</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300">Scale Calibration Factor (pts/gram)</label>
              <input
                type="number"
                value={settings.calibratedScaleFactor}
                onChange={(e) => setSettings({ ...settings, calibratedScaleFactor: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
                step={0.1}
              />
              <span className="text-[10px] text-muted">HX711 raw count multiplier for 1 gram</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: TAMPER & SENSOR TIMINGS */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-mono font-bold text-slate-200 uppercase">
            <Clock className="w-4 h-4 text-accent" />
            <span>Tamper Detection Timings & Debounce</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-slate-300">Auto-Arming Delay (seconds)</label>
              <input
                type="number"
                value={settings.armingDelaySeconds}
                onChange={(e) => setSettings({ ...settings, armingDelaySeconds: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
                min={0}
              />
              <span className="text-[10px] text-muted">Delay after parcel placed & lid closed before arming sirens</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300">Magnetic Switch Debounce (ms)</label>
              <input
                type="number"
                value={settings.debounceLidMs}
                onChange={(e) => setSettings({ ...settings, debounceLidMs: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
                min={20}
              />
              <span className="text-[10px] text-muted">Filters mechanical contact chatter on lid closure</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300">SW-420 Vibration Window (ms)</label>
              <input
                type="number"
                value={settings.vibrationWindowMs}
                onChange={(e) => setSettings({ ...settings, vibrationWindowMs: Number(e.target.value) })}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
                min={100}
              />
              <span className="text-[10px] text-muted">Multi-pulse integration period to prevent false alarms</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: HARDWARE POLARITY CHECKS */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border text-xs font-mono font-bold text-slate-200 uppercase">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Electrical Logic & Polarity Overrides</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.magneticSensorInverted}
                onChange={(e) => setSettings({ ...settings, magneticSensorInverted: e.target.checked })}
                className="rounded bg-background border-border text-primary focus:ring-0"
              />
              <div>
                <span className="text-slate-200 font-bold block">Invert Magnetic Sensor Logic Level</span>
                <span className="text-[10px] text-muted">Default: LOW = Magnet present (Lid closed)</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.buzzerActiveHigh}
                onChange={(e) => setSettings({ ...settings, buzzerActiveHigh: e.target.checked })}
                className="rounded bg-background border-border text-primary focus:ring-0"
              />
              <div>
                <span className="text-slate-200 font-bold block">Buzzer Active HIGH Gate</span>
                <span className="text-[10px] text-muted">Default: HIGH asserts audible alarm</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-cyan-400 text-background font-semibold text-xs font-mono rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving & Dispatching...' : 'Save & Dispatch to ESP32'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
