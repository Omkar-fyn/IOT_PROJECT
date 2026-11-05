import React, { useEffect, useState } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { api } from '../services/api';
import { Package, Clock, ShieldCheck, Scale, History, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ParcelMonitoring: React.FC = () => {
  const { selectedDeviceId, latest, history } = useTelemetryStore();
  const [parcelEvents, setParcelEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getParcelEvents(selectedDeviceId, 20).then((res: any) => {
      if (res.success && res.data) {
        setParcelEvents(res.data);
      }
      setLoading(false);
    });
  }, [selectedDeviceId]);

  const hasParcel = latest?.parcelPresent ?? false;
  const parcelWeight = latest && latest.weightValid ? latest.weightGrams : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          <span>Parcel Chamber & Delivery Monitoring</span>
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          Chamber weight tracking, delivery timestamps, and package presence verification for {selectedDeviceId}
        </p>
      </div>

      {/* Primary Parcel Status Banner */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                hasParcel
                  ? 'bg-primary/20 text-primary border border-primary/40 shadow-lg shadow-primary/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Package className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-mono text-muted uppercase">Chamber Status</div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {hasParcel ? 'PARCEL PRESENCE DETECTED' : 'CHAMBER EMPTY / READY'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Notice: Physical detection is based on calibrated load cell displacement.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs">
            <div className="p-3 bg-background/60 border border-border rounded-lg text-center min-w-[120px]">
              <div className="text-muted text-[10px]">CURRENT WEIGHT</div>
              <div className="text-xl font-bold text-slate-100">{parcelWeight} g</div>
              <div className="text-[10px] text-muted">({(parcelWeight / 1000).toFixed(2)} kg)</div>
            </div>

            <div className="p-3 bg-background/60 border border-border rounded-lg text-center min-w-[120px]">
              <div className="text-muted text-[10px]">WEIGHT THRESHOLD</div>
              <div className="text-xl font-bold text-slate-100">≥ 50 g</div>
              <div className="text-[10px] text-success">Trigger Ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weight History Trend */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Parcel Weight Settling & Retention Trend
          </h2>
          <span className="text-[10px] font-mono text-muted">Sampling: 2s Interval</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '11px' }}
              />
              <Line
                type="stepAfter"
                dataKey="weightGrams"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Weight (g)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parcel Activity Log */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Recorded Parcel Deposit & Removal Trail
            </h2>
          </div>
          <span className="text-[10px] font-mono text-muted">Total: {parcelEvents.length}</span>
        </div>

        {parcelEvents.length === 0 ? (
          <div className="text-center py-8 text-muted font-mono text-xs">
            No parcel deposit records stored yet for {selectedDeviceId}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/40 text-muted border-b border-border">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Weight</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {parcelEvents.map((e: any) => (
                  <tr key={e.eventId || e._id} className="hover:bg-slate-800/20">
                    <td className="p-3 text-slate-300">
                      {new Date(e.receivedAt || e.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.eventType === 'PARCEL_DETECTED'
                            ? 'bg-success/20 text-success border border-success/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {e.eventType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-200">{e.weightGrams} g</td>
                    <td className="p-3 text-slate-400">{e.description}</td>
                    <td className="p-3 text-muted">Audited</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
