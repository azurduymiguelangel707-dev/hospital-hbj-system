'use client';
import dynamic from 'next/dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.login(formData.username, formData.password);
      const user = authService.getCurrentUser();
      if (user?.roles?.includes('SUPERADMIN') || user?.role === 'SUPERADMIN') router.push('/superadmin');
      else if (user?.roles?.includes('ADMIN') || user?.role === 'ADMIN') router.push('/admin');
      else if (user?.roles?.includes('MEDICO') || user?.role === 'MEDICO') router.push('/doctor');
      else if (user?.roles?.includes('ENFERMERIA') || user?.role === 'ENFERMERIA') router.push('/enfermeria');
      else if (user?.roles?.includes('PACIENTE') || user?.role === 'PACIENTE') router.push('/dashboard/patient');
      else router.push('/dashboard/admin');
    } catch (err: any) {
      setError('Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Georgia', serif",
      padding: '24px',
    }}>
      <style suppressHydrationWarning>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(15,98,154,0.18); }
          70%  { box-shadow: 0 0 0 12px rgba(15,98,154,0); }
          100% { box-shadow: 0 0 0 0 rgba(15,98,154,0); }
        }
        .login-card { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
        .login-input {
          width: 100%; box-sizing: border-box;
          padding: 13px 44px 13px 44px;
          border: 1.5px solid #dde3ea;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'Georgia', serif;
          color: #1a2233;
          background: #fafdff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: #0f629a;
          box-shadow: 0 0 0 3px rgba(15,98,154,0.10);
          background: #fff;
        }
        .login-btn {
          width: 100%; padding: 14px;
          background: #0f629a;
          color: #fff;
          border: none; border-radius: 10px;
          font-size: 15px; font-weight: 600;
          font-family: 'Georgia', serif;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .login-btn:hover:not(:disabled) { background: #0a4d7a; transform: translateY(-1px); }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .icon-wrap {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #8fa3b8; pointer-events: none;
        }
        .eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #8fa3b8; padding: 0;
          transition: color 0.15s;
        }
        .eye-btn:hover { color: #0f629a; }
        .cross-line {
          display: flex; align-items: center; gap: 12px;
          color: #b0bec5; font-size: 12px; margin: 4px 0;
        }
        .cross-line::before, .cross-line::after {
          content: ''; flex: 1; height: 1px; background: #e2e8f0;
        }
      `}</style>

      <div className="login-card" style={{
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 8px 48px rgba(15,40,80,0.10), 0 1.5px 4px rgba(15,40,80,0.06)',
        width: '100%',
        maxWidth: '420px',
        padding: '48px 40px 40px',
        opacity: mounted ? 1 : 0,
      }}>
        {/* Logo y título */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #0f629a 0%, #1a8fd1 100%)',
            borderRadius: '18px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            animation: 'pulse-ring 2.5s ease-in-out infinite',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.18em', color: '#8fa3b8', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Georgia, serif' }}>
            Hospital Boliviano Japones
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2233', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Sistema de Gestion
          </h1>
          <p style={{ fontSize: '13px', color: '#8fa3b8', margin: 0 }}>
            Acceso restringido al personal autorizado
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff5f5', border: '1.5px solid #fecaca',
            borderRadius: '10px', padding: '12px 16px',
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4a5568', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Codigo de acceso
            </label>
            <div style={{ position: 'relative' }}>
              <span className="icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                className="login-input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Ej: ADM-000001"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4a5568', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Contrasena
            </label>
            <div style={{ position: 'relative' }}>
              <span className="icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                className="login-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Contrasena"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Verificando...
              </span>
            ) : 'Iniciar Sesion'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #f0f4f8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', letterSpacing: '0.05em' }}>
              Conexion segura — SSL/TLS
            </span>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#b0bec5', marginTop: '8px' }}>
            Hospital Boliviano Japones &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}