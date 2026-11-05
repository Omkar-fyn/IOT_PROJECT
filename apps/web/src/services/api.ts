import { ApiResponse, UserProfile, DeviceInfo, DeviceSettings, StoredSecurityEvent } from '@smart-parcel-box/shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_PREFIX = '/api/v1';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('spb_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async getMe(): Promise<ApiResponse<UserProfile>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return res.json();
  },

  // Devices
  async getDevices(): Promise<ApiResponse<DeviceInfo[]>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/devices`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getDevice(deviceId: string): Promise<ApiResponse<DeviceInfo>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/devices/${deviceId}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getDeviceHealth(deviceId: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/devices/${deviceId}/health`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getDeviceSettings(deviceId: string): Promise<ApiResponse<{ settings: DeviceSettings; capabilities: any }>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/devices/${deviceId}/settings`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async updateDeviceSettings(deviceId: string, settings: Partial<DeviceSettings>): Promise<ApiResponse<DeviceSettings>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/devices/${deviceId}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  // Telemetry
  async getLatestTelemetry(deviceId: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/telemetry/${deviceId}/latest`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getTelemetryHistory(deviceId: string, limit = 100): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/telemetry/${deviceId}?limit=${limit}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Parcels
  async getCurrentParcel(deviceId: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/parcels/${deviceId}/current`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getParcelEvents(deviceId: string, limit = 50): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/parcels/${deviceId}/events?limit=${limit}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Security
  async getSecurityEvents(deviceId: string, params?: { page?: number; limit?: number; severity?: string; eventType?: string }): Promise<ApiResponse<StoredSecurityEvent[]>> {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', params.page.toString());
    if (params?.limit) q.set('limit', params.limit.toString());
    if (params?.severity) q.set('severity', params.severity);
    if (params?.eventType) q.set('eventType', params.eventType);

    const res = await fetch(`${API_BASE}${API_PREFIX}/security/${deviceId}/events?${q.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async acknowledgeSecurityEvent(deviceId: string, eventId: string): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/security/${deviceId}/events/${eventId}/acknowledge`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Commands
  async sendCommand(deviceId: string, commandType: string, payload = {}): Promise<ApiResponse<any>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/commands/${deviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ commandType, payload })
    });
    return res.json();
  },

  async getCommandHistory(deviceId: string): Promise<ApiResponse<any[]>> {
    const res = await fetch(`${API_BASE}${API_PREFIX}/commands/${deviceId}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Health
  async getSystemHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
  }
};

