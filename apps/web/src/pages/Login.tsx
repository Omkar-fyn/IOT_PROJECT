import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { Box, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@parcelbox.local');
    setPassword('Admin@Secure2026');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-muted to-primary shadow-xl shadow-primary/20 mb-2">
            <Box className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Smart Parcel Box</h1>
          <p className="text-xs text-muted font-mono">
            Industrial IoT Tamper Detection & Security Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl shadow-black/50 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-sm font-semibold text-slate-200">Owner Authentication</h2>
            <span className="flex items-center gap-1 text-[11px] font-mono text-success">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS / AES-256</span>
            </span>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@parcelbox.local"
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-muted outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Access Key / Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-muted outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-primary hover:bg-cyan-400 text-background font-semibold text-xs rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill button for fast local development & testing */}
          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={handleQuickFill}
              className="w-full text-center text-[11px] text-primary/80 hover:text-primary font-mono hover:underline"
            >
              ⚡ Fill Default Admin Credentials
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-muted font-mono">
          Decoupled Hardware FSM • End-to-End MQTT Security
        </div>
      </div>
    </div>
  );
};

