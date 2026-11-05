import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { api } from '../services/api';
import { User, Lock, Key, ShieldCheck, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setMessage({ type: 'success', text: 'Password successfully updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: res.error?.message || 'Failed to update password' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Title */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <span>Owner Profile & Access Credentials</span>
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          Manage your account profile, authentication keys, and security sessions
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-800 border border-border flex items-center justify-center text-primary font-bold text-lg">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">{user?.name || 'Owner'}</h2>
            <div className="text-xs text-muted font-mono">{user?.email || 'admin@parcelbox.local'}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="w-3 h-3" />
              <span>ROLE: {user?.role ? user.role.toUpperCase() : 'ADMIN'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-border text-xs font-mono font-bold text-slate-200 uppercase">
          <Lock className="w-4 h-4 text-primary" />
          <span>Update Access Password</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-slate-300">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300">New Password (min 8 chars)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-background border border-border rounded-lg p-2.5 text-slate-100 outline-none focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary hover:bg-cyan-400 text-background font-semibold text-xs rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            <span>{loading ? 'Updating Credentials...' : 'Save New Password'}</span>
          </button>
        </form>
      </div>

      {/* Session Management */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-200">Session Controls</div>
          <div className="text-[11px] text-muted font-mono">Terminate current active JWT session</div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 rounded-lg text-xs font-mono transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
