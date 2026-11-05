import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Layout } from '../components/layout/Layout';
import { Login } from '../pages/Login';
import { Overview } from '../pages/Overview';
import { LiveMonitoring } from '../pages/LiveMonitoring';
import { ParcelMonitoring } from '../pages/ParcelMonitoring';
import { SecurityCenter } from '../pages/SecurityCenter';
import { ActivityHistory } from '../pages/ActivityHistory';
import { Analytics } from '../pages/Analytics';
import { DeviceManagement } from '../pages/DeviceManagement';
import { Settings } from '../pages/Settings';
import { Profile } from '../pages/Profile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="live" element={<LiveMonitoring />} />
        <Route path="parcels" element={<ParcelMonitoring />} />
        <Route path="security" element={<SecurityCenter />} />
        <Route path="history" element={<ActivityHistory />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="devices" element={<DeviceManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

