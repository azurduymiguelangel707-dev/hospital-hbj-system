// src/app/superadmin/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Users, Shield, Activity, BarChart2, LogOut, RefreshCw, Terminal } from 'lucide-react';
import { GlobalUserManager } from './components/GlobalUserManager';
import { BlockchainViewer } from './components/BlockchainViewer';
import { SystemMonitor } from './components/SystemMonitor';
import { BackupPanel } from './components/BackupPanel';
import { ReportesPanel } from './components/ReportesPanel';
import { CerrarDiaButton } from '../admin/components/CerrarDiaButton';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

type Panel = 'dashboard' | 'usuarios' | 'blockchain' | 'reportes' | 'sistema' | 'backup';

const PANELS: { key: Panel; label: string; icon: any; desc: string }[] = [
  { key: 'dashboard',  label: 'Resumen ejecutivo',   icon: LayoutDashboard, desc: 'Vision general del sistema' },
  { key: 'usuarios',   label: 'Usuarios',    icon: Users,           desc: 'Gestion global' },
  { key: 'blockchain', label: 'Blockchain',  icon: Shield,          desc: 'Audit log' },
  { key: 'reportes',   label: 'Reportes',    icon: BarChart2,       desc: 'Estadisticas' },
  { key: 'sistema',    label: 'Sistema',     icon: Activity,        desc: 'Monitor' },
  { key: 'backup',     label: 'Backup',      icon: Terminal,        desc: 'Respaldo y recuperacion' },
];

function useSession() {
  const [session, setSession] = useState({ nombre: 'Administrador Superior', role: 'SUPERADMIN', email: '' });
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user_data') ?? '{}');
      setSession({ nombre: u.nombre ? `${u.nombre} ${u.apellido ?? ''}`.trim() : 'Super Admin', role: u.role ?? 'SUPERADMIN', email: u.email ?? '' });
    } catch {}
  }, []);
  return session;
}

export default function SuperAdminPage() {
  const session = useSession();
  const [activePanel, setActivePanel] = useState<Panel>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalDoctors: 0, totalPatients: 0, activeUsers: 0 });
  const [apptStats, setApptStats] = useState({ totalHoy: 0, completadasHoy: 0, pendientesHoy: 0, canceladasHoy: 0, totalHistorico: 0 });
  const [dbStats, setDbStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, uStats, aStats, db] = await Promise.all([
        authFetch('/api/superadmin/users').then(r => r.json()).catch(() => []),
        authFetch('/api/users/stats').then(r => r.json()).catch(() => ({})),
        authFetch('/api/appointments/stats/dashboard').then(r => r.json()).catch(() => ({})),
        authFetch('/api/superadmin/db-stats').then(r => r.json()).catch(() => []),
      ]);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setStats(uStats);
      setApptStats(aStats);
      setDbStats(Array.isArray(db) ? db : []);
      setLastUpdated(new Date());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Redirect si no es superadmin
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const u = JSON.parse(userData);
        if (u.role !== 'SUPERADMIN') window.location.href = '/login';
      } catch { window.location.href = '/login'; }
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  const blockchainCount = dbStats.find(d => d.table === 'blockchain_audit')?.count ?? 0;
  const patientsCount = dbStats.find(d => d.table === 'patients')?.count ?? 0;

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Top bar Ã¢â‚¬â€ dark theme para distinguir del admin */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Terminal size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Hospital Boliviano Japones</p>
            <p className="text-xs text-red-400 font-medium">Centro de Gobierno del Sistema - SUPERADMIN</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <p className="text-xs text-gray-500">Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}</p>}
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 text-xs text-gray-300 rounded-lg hover:bg-gray-800 transition disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
            <div className="text-right">
              <p className="text-xs font-semibold text-white">{session.nombre}</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-900 text-red-300">Gobierno TI</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 border border-red-800 rounded-lg hover:bg-red-900 transition">
              <LogOut size={14} />
              Cerrar sesion
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar dark */}
        <aside className="w-52 bg-gray-900 border-r border-gray-800 flex flex-col py-4 px-3 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-3">Modulos</p>
          {PANELS.map(({ key, label, icon: Icon, desc }) => (
            <button key={key} onClick={() => setActivePanel(key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all text-left w-full ${activePanel === key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
              <Icon size={15} className={activePanel === key ? 'text-red-400' : ''} />
              <div>
                <p className="text-xs font-medium leading-tight">{label}</p>
                <p className="text-xs text-gray-600 leading-tight">{desc}</p>
              </div>
            </button>
          ))}
          <div className="mt-auto pt-4 border-t border-gray-800 px-2 space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">Bloques blockchain</p>
              <p className="text-xl font-semibold text-red-400">{blockchainCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Pacientes registrados</p>
              <p className="text-xl font-semibold text-gray-300">{patientsCount}</p>
            </div>
          </div>
        </aside>

        {/* Main content Ã¢â‚¬â€ light */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">

          {/* DASHBOARD */}
          {activePanel === 'dashboard' && (
            <div>
              <div className="mb-5">
                <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-gray-800">Centro de Gobierno del Sistema</h2><CerrarDiaButton onSuccess={loadAll} /></div>
                <p className="text-sm text-gray-500" suppressHydrationWarning>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Usuarios totales', value: stats.totalUsers, color: 'blue', sub: `${stats.activeUsers} activos` },
                  { label: 'Pacientes', value: patientsCount, color: 'green', sub: 'registrados' },
                  { label: 'Citas hoy', value: apptStats.totalHoy, color: 'purple', sub: `${apptStats.totalHistorico} historico` },
                  { label: 'Bloques audit', value: blockchainCount, color: 'red', sub: 'SHA-256' },
                ].map(c => (
                  <div key={c.label} className={`bg-${c.color}-50 border border-${c.color}-100 rounded-xl p-4`}>
                    <p className="text-xs text-gray-500">{c.label}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{c.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Ultimos eventos blockchain</h3>
                  <BlockchainViewer />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Monitor del sistema</h3>
                  <SystemMonitor />
                </div>
              </div>
            </div>
          )}

          {/* USUARIOS */}
          {activePanel === 'usuarios' && (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Gestion global de usuarios</h2>
                <p className="text-sm text-gray-500">{users.length} usuarios en el sistema Ã¢â‚¬â€ acceso completo</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <GlobalUserManager users={users} onRefresh={loadAll} />
              </div>
            </div>
          )}

          {/* BLOCKCHAIN */}
          {activePanel === 'blockchain' && (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Blockchain Audit Log</h2>
                <p className="text-sm text-gray-500">{blockchainCount} bloques registrados Ã¢â‚¬â€ SHA-256 CryptoJS</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <BlockchainViewer />
              </div>
            </div>
          )}

          {/* REPORTES */}
          {activePanel === 'reportes' && (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Reportes y estadisticas</h2>
                <p className="text-sm text-gray-500">Reportes exportables en PDF</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <ReportesPanel />
              </div>
            </div>
          )}

          {/* SISTEMA */}
          {activePanel === 'backup' && (
            <BackupPanel />
          )}
          {activePanel === 'sistema' && (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-800">Monitor del sistema</h2>
                <p className="text-sm text-gray-500">Estado en tiempo real de todos los servicios</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <SystemMonitor />
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
