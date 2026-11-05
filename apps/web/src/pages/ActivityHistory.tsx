import React, { useState, useEffect, useMemo } from 'react';
import { useTelemetryStore } from '../stores/useTelemetryStore';
import { api } from '../services/api';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { StoredSecurityEvent } from '@smart-parcel-box/shared';

export const ActivityHistory: React.FC = () => {
  const { selectedDeviceId } = useTelemetryStore();
  const [events, setEvents] = useState<StoredSecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<StoredSecurityEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [selectedDeviceId, severityFilter, eventTypeFilter, currentPage]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getSecurityEvents(selectedDeviceId, {
        page: currentPage,
        limit: 25,
        severity: severityFilter || undefined,
        eventType: eventTypeFilter || undefined
      });
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.sourceSensor.toLowerCase().includes(q) ||
        e.eventId.toLowerCase().includes(q)
      );
    });
  }, [events, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Event ID', 'Device ID', 'Event Type', 'Severity', 'Sensor', 'Description', 'Timestamp', 'Acknowledged'];
    const rows = filteredEvents.map((e) => [
      e.eventId,
      e.deviceId,
      e.eventType,
      e.severity,
      e.sourceSensor,
      `"${e.description.replace(/"/g, '""')}"`,
      e.timestamp,
      e.acknowledged ? 'Yes' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `parcelbox_history_${selectedDeviceId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <span>Activity History & Audit Trail</span>
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            Searchable log of all hardware triggers, tamper incidents, deliveries, and system events
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-border transition-colors"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 w-full sm:w-72">
          <Search className="w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search description, sensor, event ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-muted"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-slate-200 text-xs outline-none"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted">
            <span>Type:</span>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-slate-200 text-xs outline-none"
            >
              <option value="">All Types</option>
              <option value="ALARM_TRIGGERED">ALARM_TRIGGERED</option>
              <option value="VIBRATION_DETECTED">VIBRATION_DETECTED</option>
              <option value="LID_OPENED">LID_OPENED</option>
              <option value="PARCEL_DETECTED">PARCEL_DETECTED</option>
              <option value="SYSTEM_ARMED">SYSTEM_ARMED</option>
              <option value="ALARM_ACKNOWLEDGED">ALARM_ACKNOWLEDGED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/60 text-muted border-b border-border">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Event ID</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Sensor Source</th>
                <th className="p-3">Description</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted font-sans">
                    {loading ? 'Loading historical events...' : 'No activity records match your filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-slate-300">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-muted text-[11px]">{evt.eventId}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-200">{evt.eventType}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-danger/20 text-danger border border-danger/30'
                            : evt.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="p-3 text-primary">{evt.sourceSensor}</td>
                    <td className="p-3 text-slate-300 font-sans max-w-xs truncate">{evt.description}</td>
                    <td className="p-3">
                      {evt.acknowledged ? (
                        <span className="text-success text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Ack
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Unacknowledged</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-100"
                        title="View Event Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
          <span>Page {currentPage}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={filteredEvents.length < 25}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="font-mono text-sm font-bold text-slate-100">Event Detail Inspector</div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Event ID:</span>
                <span className="text-slate-200">{selectedEvent.eventId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Device ID:</span>
                <span className="text-slate-200">{selectedEvent.deviceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Type:</span>
                <span className="font-bold text-primary">{selectedEvent.eventType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Severity:</span>
                <span className="text-danger font-bold">{selectedEvent.severity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Sensor:</span>
                <span className="text-slate-200">{selectedEvent.sourceSensor}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted">Device Timestamp:</span>
                <span className="text-slate-200">{selectedEvent.timestamp}</span>
              </div>
              <div className="py-2">
                <span className="text-muted block mb-1">Full Description:</span>
                <div className="p-3 bg-background rounded border border-border text-slate-100 font-sans">
                  {selectedEvent.description}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
