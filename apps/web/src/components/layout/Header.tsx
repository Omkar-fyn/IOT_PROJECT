import React, { useEffect, useState } from 'react';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
  Bell,
  User,
  Radio,
  Clock,
  Box
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const {
    selectedDeviceId,
    deviceConnected,
    isStale,
    socketConnected,
    alarmActive,
    latest
  } = useTelemetryStore();
  const { user } = useAuthStore();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const isSimulated = latest?.isSimulated ?? false;

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Device Selection & Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-muted to-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Box className="w-5 h-5 text-background" />
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight text-sm">SMART PARCEL BOX</span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 ml-2">
              IoT Telemetry
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Device selector */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-background/50 border border-border px-3 py-1.5 rounded-md">
          <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="font-semibold text-slate-200">{selectedDeviceId}</span>
        </div>
      </div>

      {/* Center: System Status Alerts */}
      <div className="flex items-center gap-3">
        {alarmActive ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-danger/20 border border-danger/40 text-danger rounded-full text-xs font-semibold animate-pulse shadow-lg shadow-danger/20">
            <ShieldAlert className="w-4 h-4" />
            <span>SECURITY ALARM ACTIVE</span>
          </div>
        ) : isStale ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-mono">
            <WifiOff className="w-3.5 h-3.5" />
            <span>DATA STALE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 border border-success/30 text-success rounded-full text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SYSTEM LIVE</span>
          </div>
        )}

        {isSimulated && (
          <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full font-bold">
            DEMO / SIMULATED
          </span>
        )}
      </div>

      {/* Right: Clock & User Profile */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeStr}</span>
        </div>

        <div className="h-4 w-px bg-border hidden md:block" />

        {/* Real-time WebSocket connection state */}
        <div className="flex items-center gap-1.5 text-xs font-mono" title={socketConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}>
          <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-success animate-ping' : 'bg-danger'}`} />
          <span className="hidden lg:inline text-muted text-[11px]">{socketConnected ? 'WS LIVE' : 'WS OFF'}</span>
        </div>

        <Link
          to="/profile"
          className="flex items-center gap-2 p-1.5 rounded-lg border border-border hover:border-primary/50 hover:bg-card-hover transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-primary">
            {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4 text-slate-400" />}
          </div>
          <span className="text-xs font-medium text-slate-300 hidden sm:inline max-w-[100px] truncate">
            {user?.name || 'Owner'}
          </span>
        </Link>
      </div>
    </header>
  );
};

