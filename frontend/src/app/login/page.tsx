'use client';
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
  const [focusUser, setFocusUser] = useState(false);
  const [focusPass, setFocusPass] = useState(false);

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
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
    }}>
      <style suppressHydrationWarning>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,200,255,0.3); }
          50% { box-shadow: 0 0 40px rgba(0,200,255,0.6); }
        }
        .login-card {
          animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) both;
        }
        .field-line {
          width: 100%;
          background: none;
          border: none;
          border-bottom: 1.5px solid #3a4a6b;
          outline: none;
          padding: 10px 36px 10px 36px;
          font-size: 15px;
          color: #fff;
          transition: border-color 0.3s;
          box-sizing: border-box;
        }
        .field-line::placeholder { color: #5a6a8a; }
        .field-line:focus { border-bottom-color: #00c8ff; }
        .field-line:disabled { opacity: 0.5; }
        .field-focused { border-bottom-color: #00c8ff !important; }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(90deg, #00c8ff 0%, #00e676 100%);
          color: #0f1923;
          border: none;
          border-radius: 50px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          letter-spacing: 0.05em;
          animation: glow 3s ease-in-out infinite;
        }
        .login-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }
        .icon-left {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: #3a4a6b; pointer-events: none; transition: color 0.3s;
        }
        .icon-left-focused { color: #00c8ff; }
        .eye-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #3a4a6b; padding: 0;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #00c8ff; }
        .label-field {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.3s;
          margin-bottom: 6px;
          display: block;
        }
      `}</style>

      <div className="login-card" style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(0,200,255,0.15)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        width: '100%',
        maxWidth: '400px',
        padding: '48px 36px 40px',
        opacity: mounted ? 1 : 0,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '70px', height: '70px',
            background: 'linear-gradient(135deg, #00c8ff 0%, #0060ff 100%)',
            borderRadius: '20px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(0,200,255,0.3)',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#5a7a9a', textTransform: 'uppercase', marginBottom: '8px' }}>
            Hospital Boliviano Japones
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Sistema de Gestion
          </h1>
          <p style={{ fontSize: '12px', color: '#5a7a9a', margin: 0 }}>
            Acceso restringido al personal autorizado
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)',
            border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Usuario */}
          <div>
            <span className="label-field" style={{ color: focusUser ? '#00c8ff' : '#5a7a9a' }}>
              Codigo de acceso
            </span>
            <div style={{ position: 'relative' }}>
              <span className={`icon-left ${focusUser ? 'icon-left-focused' : ''}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                className="field-line"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                onFocus={() => setFocusUser(true)}
                onBlur={() => setFocusUser(false)}
                placeholder="Ej: ADM-000001"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <span className="label-field" style={{ color: focusPass ? '#00c8ff' : '#5a7a9a' }}>
              Contrasena
            </span>
            <div style={{ position: 'relative' }}>
              <span className={`icon-left ${focusPass ? 'icon-left-focused' : ''}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                className="field-line"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusPass(true)}
                onBlur={() => setFocusPass(false)}
                placeholder="Contrasena"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                {showPass ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Boton */}
          <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f1923" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Verificando...
              </span>
            ) : 'Iniciar Sesion'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00c8ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#00c8ff', fontWeight: '600', letterSpacing: '0.05em' }}>
              Conexion segura - SSL/TLS
            </span>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#3a4a6b', marginTop: '8px' }}>
            Hospital Boliviano Japones &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

