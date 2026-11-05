import React, { useState } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Activity,
  AlertTriangle,
  DoorOpen,
  Package,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { history, recentEvents } = useTelemetryStore();

  // Synthetic distribution for time-series analytics charts
  const hourlyActivity = [
    { time: '00:00', lidOpens: 0, vibrations: 0, alarms: 0 },
    { time: '04:00', lidOpens: 0, vibrations: 0, alarms: 0 },
    { time: '08:00', lidOpens: 1, vibrations: 0, alarms: 0 },
    { time: '12:00', lidOpens: 3, vibrations: 1, alarms: 0 },
    { time: '14:00', lidOpens: 2, vibrations: 0, alarms: 0 },
    { time: '16:00', lidOpens: 1, vibrations: 2, alarms: 1 },
    { time: '18:00', lidOpens: 0, vibrations: 0, alarms: 0 },
    { time: '22:00', lidOpens: 0, vibrations: 0, alarms: 0 }
  ];

  const weeklyDeliveries = [
    { day: 'Mon', parcels: 2, avgWeight: 650 },
    { day: 'Tue', parcels: 1, avgWeight: 1450 },
    { day: 'Wed', parcels: 3, avgWeight: 890 },
    { day: 'Thu', parcels: 0, avgWeight: 0 },
    { day: 'Fri', parcels: 4, avgWeight: 1200 },
    { day: 'Sat', parcels: 2, avgWeight: 540 },
    { day: 'Sun', parcels: 1, avgWeight: 980 }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Telemetry & Incident Security Analytics</span>
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Aggregated trends for parcel deposits, vibration frequencies, tamper sirens, and uptime
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/60 border border-border p-1 rounded-lg text-xs font-mono">
          <Calendar className="w-3.5 h-3.5 text-muted ml-1" />
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded transition-colors ${
                timeRange === r
                  ? 'bg-primary text-background font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <div className="text-muted text-xs font-mono flex items-center justify-between">
            <span>PARCEL DEPOSITS</span>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">13</div>
          <div className="text-[11px] text-success font-mono">↑ 18% vs previous window</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <div className="text-muted text-xs font-mono flex items-center justify-between">
            <span>VIBRATION EVENTS</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">4</div>
          <div className="text-[11px] text-muted font-mono">3 filtered, 1 elevated</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <div className="text-muted text-xs font-mono flex items-center justify-between">
            <span>TAMPER ALARMS</span>
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <div className="text-2xl font-bold font-mono text-danger">1</div>
          <div className="text-[11px] text-slate-400 font-mono">Acknowledged by owner</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <div className="text-muted text-xs font-mono flex items-center justify-between">
            <span>SYSTEM UPTIME</span>
            <Clock className="w-4 h-4 text-success" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">99.8%</div>
          <div className="text-[11px] text-success font-mono">Edge FSM continuous</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Security Trigger Frequency */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Trigger Distribution (Lid Opens vs Tamper Vibrations)
            </h2>
            <span className="text-[10px] font-mono text-muted">{timeRange} View</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="lidOpens" fill="#3b82f6" name="Lid Opened" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vibrations" fill="#f59e0b" name="Vibrations" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alarms" fill="#ef4444" name="Alarm Siren" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Delivery & Weight History */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Weekly Deposit Frequency & Mean Weight
            </h2>
            <span className="text-[10px] font-mono text-muted">7-Day Aggregation</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyDeliveries}>
                <defs>
                  <linearGradient id="weightAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="avgWeight"
                  stroke="#10b981"
                  fill="url(#weightAnalytics)"
                  name="Avg Weight (g)"
                />
                <Bar dataKey="parcels" fill="#06b6d4" name="Parcels Count" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
