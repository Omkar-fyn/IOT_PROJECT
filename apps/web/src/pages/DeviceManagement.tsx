import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { api } from '../services/api';
import {
  Cpu,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Plus,
  RefreshCw,
  Sliders,
  Settings
} from 'lucide-react';
import { DeviceInfo } from '@smart-parcel-box/shared';

export const DeviceManagement: React.FC = () => {
  const { selectedDeviceId, setSelectedDeviceId, latest } = useTelemetryStore();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.getDevices();
      if (res.success && res.data) {
        setDevices(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <span>Smart Parcel Box Device Fleet Management</span>
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Registered ESP32 hardware units, firmware versions, health diagnostics, and peripheral capabilities
          </p>
        </div>

        <button
          onClick={fetchDevices}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-border transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map((dev) => {
          const isSelected = dev.deviceId === selectedDeviceId;
          const isOnline = dev.connectionStatus === 'ONLINE';

          return (
            <div
              key={dev.deviceId}
              className={`bg-card border rounded-xl p-6 space-y-5 transition-all ${
                isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-primary">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 font-mono">{dev.deviceName}</h2>
                    <div className="text-[11px] font-mono text-muted">{dev.deviceId} • {dev.deviceType}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      isOnline
                        ? 'bg-success/15 text-success border border-success/30'
                        : 'bg-danger/15 text-danger border border-danger/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success animate-ping' : 'bg-danger'}`} />
                    <span>{dev.connectionStatus}</span>
                  </span>
                </div>
              </div>

              {/* Hardware Specs & Diagnostics */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-background/50 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-muted block text-[10px]">FIRMWARE</span>
                  <span className="text-slate-200 font-bold">v{dev.firmwareVersion}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">WI-FI RSSI</span>
                  <span className="text-slate-200 font-bold">{dev.wifiRssi ? `${dev.wifiRssi} dBm` : '-58 dBm'}</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">UPTIME</span>
                  <span className="text-slate-200 font-bold">{dev.uptimeSeconds}s</span>
                </div>
                <div>
                  <span className="text-muted block text-[10px]">LAST HEARTBEAT</span>
                  <span className="text-slate-200 font-bold">
                    {new Date(dev.lastSeenAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Device Capabilities */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-muted uppercase">Verified Firmware Capabilities:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Remote Arm: {dev.capabilities?.supportsRemoteArm ? 'Supported' : 'Disabled'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Remote Disarm: {dev.capabilities?.supportsRemoteDisarm ? 'Enabled' : 'Physical Only'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    <span>Remote Tare: {dev.capabilities?.supportsRemoteTare ? 'Supported' : 'Disabled'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                    <span>OTA Flashing: {dev.capabilities?.supportsOtaUpdate ? 'Active' : 'Unverified'}</span>
                  </div>
                </div>
              </div>

              {/* Selection Button */}
              <div className="pt-2 flex justify-end">
                {isSelected ? (
                  <span className="text-xs font-mono text-primary font-bold px-3 py-1.5 rounded bg-primary/10 border border-primary/20">
                    Active Monitored Box
                  </span>
                ) : (
                  <button
                    onClick={() => setSelectedDeviceId(dev.deviceId)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono transition-colors"
                  >
                    Select Box
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
