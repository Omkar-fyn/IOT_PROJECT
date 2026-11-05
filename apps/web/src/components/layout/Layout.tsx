import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SimulatorDock } from './SimulatorDock';
import { getSocket } from '../../services/socket';
import { useTelemetryStore } from '../../stores/useTelemetryStore';
import { api } from '../../services/api';

export const Layout: React.FC = () => {
  const {
    selectedDeviceId,
    updateTelemetry,
    addSecurityEvent,
    setSocketConnected,
    setDeviceConnected,
    checkStaleStatus
  } = useTelemetryStore();

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join:device', selectedDeviceId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('telemetry:update', (data: any) => {
      if (data.deviceId === selectedDeviceId) {
        updateTelemetry(data);
      }
    });

    socket.on('security:event', (event: any) => {
      if (event.deviceId === selectedDeviceId) {
        addSecurityEvent(event);
      }
    });

    socket.on('device:status', (statusData: any) => {
      if (statusData.deviceId === selectedDeviceId) {
        setDeviceConnected(statusData.status === 'ONLINE');
      }
    });

    // Initial fetch of latest telemetry
    api.getLatestTelemetry(selectedDeviceId).then((res: any) => {
      if (res.success && res.data) {
        updateTelemetry(res.data);
      }
    });

    // Check data staleness every 3 seconds
    const staleInterval = setInterval(checkStaleStatus, 3000);

    return () => {
      clearInterval(staleInterval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry:update');
      socket.off('security:event');
      socket.off('device:status');
    };
  }, [selectedDeviceId, updateTelemetry, addSecurityEvent, setSocketConnected, setDeviceConnected, checkStaleStatus]);

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <Outlet />
        </main>
      </div>
      <SimulatorDock />
    </div>
  );
};
