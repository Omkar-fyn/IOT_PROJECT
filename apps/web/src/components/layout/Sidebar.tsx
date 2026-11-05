import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Package,
  ShieldAlert,
  History,
  BarChart3,
  Cpu,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTelemetryStore } from '../../stores/useTelemetryStore';

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Live Monitoring', path: '/live', icon: Activity },
  { label: 'Parcel Monitoring', path: '/parcels', icon: Package },
  { label: 'Security Center', path: '/security', icon: ShieldAlert, badgeAlert: true },
  { label: 'Activity History', path: '/history', icon: History },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Device Management', path: '/devices', icon: Cpu },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Profile', path: '/profile', icon: User }
];

export const Sidebar: React.FC = () => {
  const { logout } = useAuthStore();
  const { alarmActive } = useTelemetryStore();

  return (
    <aside className="w-64 border-r border-border bg-card/95 flex flex-col justify-between select-none">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
          System Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const showAlert = item.badgeAlert && alarmActive;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${showAlert ? 'text-danger animate-bounce' : ''}`} />
                <span>{item.label}</span>
              </div>
              {showAlert && (
                <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="px-3 py-2 bg-background/60 rounded-md border border-border text-[11px] font-mono text-muted">
          <div>ESP32 DevKit Edge</div>
          <div className="text-slate-400">Firmware: v1.0.0</div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

