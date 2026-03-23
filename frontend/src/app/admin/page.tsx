// src/app/admin/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Users, Calendar, Activity, Shield, LogOut, RefreshCw, UserPlus, ClipboardList, BarChart2 } from 'lucide-react';
import { StatsGrid } from './components/StatsGrid';
import { UserManager } from './components/UserManager';
import TurnosPanel from './components/TurnosPanel';
import { AppointmentMonitor } from './components/AppointmentMonitor';
import { OperationalMonitor } from './components/OperationalMonitor';
import { ProductividadPanel } from './components/ProductividadPanel';
import { PacientesPanel } from './components/PacientesPanel';
import { RegistroPaciente } from './components/RegistroPaciente';
import { CerrarDiaButton } from './components/CerrarDiaButton';
import { AgendamientoCita } from './components/AgendamientoCita';
import { ReportesPanel } from './components/ReportesPanel';
import { TendenciaCitas } from './components/TendenciaCitas';
import { HeatmapAgenda } from './components/HeatmapAgenda';
import { PacientesNuevosVsRecurrentes } from './components/PacientesNuevosVsRecurrentes';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

type Panel = 'dashboard' | 'registro' | 'pacientes' | 'usuarios' | 'citas' | 'sistema' | 'reportes';

const PANELS: { key: Panel; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Panel principal',  icon: LayoutDashboard },
  { key: 'registro',  label: 'Registro',   icon: UserPlus },
  { key: 'pacientes', label: 'Pacientes',  icon: ClipboardList },
  { key: 'usuarios',  label: 'Usuarios',   icon: Users },
  { key: 'citas',     label: 'Citas',      icon: Calendar },
  { key: 'sistema',   label: 'Sistema',    icon: Activity },
  { key: 'reportes',  label: 'Reportes',   icon: BarChart2 },
];

function useAdminSession() {
  const [session, setSession] = useState({ nombre: 'Admin', role: 'ADMIN', email: '' });
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user_data') ?? '{}');
      setSession({ nombre: u.nombre ? `${u.nombre} ${u.apellido ?? ''}`.trim() : 'Admin', role: u.role ?? 'ADMIN', email: u.email ?? '' });
    } catch {}
  }, []);
  return session;
}

export default function AdminDashboard() {
  const session = useAdminSession();
  const [activePanel, setActivePanel] = useState<Panel>('dashboard');
  const [dashTab, setDashTab] = useState<'citas'|'sistema'>('citas');
  const [userStats, setUserStats] = useState({ totalUsers: 0, totalDoctors: 0, totalPatients: 0, activeUsers: 0 });
  const [apptStats, setApptStats] = useState({ totalHoy: 0, completadasHoy: 0, pendientesHoy: 0, enCursoHoy: 0, canceladasHoy: 0, totalHistorico: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Estado del flujo registro -> agendamiento
  const [patientReady, setPatientReady] = useState<any>(null);
  const [registroStep, setRegistroStep] = useState<'registro' | 'agendamiento'>('registro');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uStats, aStats, allUsers, allAppts] = await Promise.all([
        authFetch('/api/users/stats').then(r => r.json()).catch(() => ({})),
        authFetch('/api/appointments/stats/dashboard').then(r => r.json()).catch(() => ({})),
        authFetch('/api/users').then(r => r.json()).catch(() => []),
        authFetch('/api/appointments').then(r => r.json()).catch(() => []),
      ]);
      setUserStats(uStats);
      setApptStats(aStats);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setAppointments(Array.isArray(allAppts) ? allAppts : []);
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  function handlePatientReady(patient: any) {
    setPatientReady(patient);
    setRegistroStep('agendamiento');
  }

  function handleRegistroDone() {
    setPatientReady(null);
    setRegistroStep('registro');
    loadAll();
  }

  const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrativo', SUPERADMIN: 'Super Admin', MEDICO: 'Medico', ENFERMERIA: 'Enfermeria', PACIENTE: 'Paciente' };

  return (
    <div className='flex flex-col h-screen bg-gray-50 overflow-hidden'>
      {/* Top bar */}
      <div className='flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='M9 12l2 2 4-4'/></svg>
          </div>
          <div>
            <p className='text-sm font-semibold text-gray-800'>Hospital Boliviano Japones</p>
            <p className='text-xs text-gray-500'>Control de Atencion Medica</p>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          {lastUpdated && <p className='text-xs text-gray-400' suppressHydrationWarning>Actualizado: {lastUpdated.toLocaleTimeString('es-ES')}</p>}
          <button onClick={loadAll} disabled={loading}
            className='flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 disabled:opacity-50 transition'>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
          <button onClick={handleLogout} className='flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition border border-red-100'>
            <LogOut size={13} /> Cerrar sesion
          </button>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <aside className='w-52 bg-gray-900 border-r border-gray-800 flex flex-col py-4 px-3 flex-shrink-0'>
          <p className='text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-3'>Menu</p>
          {PANELS.map(({ key, label, icon: Icon }, idx) => {
            const colors = [
              { active: 'text-blue-400',   bg: 'bg-blue-500/20'   },
              { active: 'text-emerald-400',bg: 'bg-emerald-500/20'},
              { active: 'text-purple-400', bg: 'bg-purple-500/20' },
              { active: 'text-amber-400',  bg: 'bg-amber-500/20'  },
              { active: 'text-pink-400',   bg: 'bg-pink-500/20'   },
              { active: 'text-cyan-400',   bg: 'bg-cyan-500/20'   },
              { active: 'text-orange-400', bg: 'bg-orange-500/20' },
            ][idx] ?? { active: 'text-blue-400', bg: 'bg-blue-500/20' };
            return (
              <button key={key} onClick={() => setActivePanel(key)}
                className={'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 transition-all w-full text-left ' + (activePanel === key ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800/50')}>
                <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + (activePanel === key ? colors.bg : 'bg-gray-800')}>
                  <Icon size={16} className={activePanel === key ? colors.active : 'text-gray-500'} />
                </div>
                <div>
                  <p className={'text-xs font-medium ' + (activePanel === key ? 'text-white' : 'text-gray-400')}>{label}</p>
                </div>
              </button>
            );
          })}
          <div className='mt-auto pt-4 border-t border-gray-800 px-2 space-y-3'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-gray-600'>Citas hoy</p>
              <p className='text-sm font-bold text-blue-400'>{apptStats.totalHoy}</p>
            </div>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-gray-600'>Total historico</p>
              <p className='text-sm font-bold text-gray-400'>{apptStats.totalHistorico}</p>
            </div>
            <CerrarDiaButton onSuccess={loadAll} />
          </div>
        </aside>

        {/* Main */}
        <main className='flex-1 overflow-hidden flex flex-col'>

          {/* DASHBOARD */}
          {activePanel === 'dashboard' && (
            <div className='flex-1 overflow-auto p-6'><div className='space-y-5'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>Panel de control hospitalario</h2>
                  <p className='text-xs text-gray-400 mt-0.5' suppressHydrationWarning>
                    {new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                  </p>
                </div>
              </div>
              <StatsGrid userStats={userStats} apptStats={apptStats} />
              <TendenciaCitas />
              {/* Tabs */}
              <div className='flex gap-1 bg-gray-100 p-1 rounded-xl'>
                <button onClick={() => setDashTab('citas')}
                  className={'flex-1 py-2.5 rounded-lg text-xs font-semibold transition ' + (dashTab === 'citas' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
                  Monitor de citas
                </button>
                <button onClick={() => setDashTab('sistema')}
                  className={'flex-1 py-2.5 rounded-lg text-xs font-semibold transition ' + (dashTab === 'sistema' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
                  Estado del sistema
                </button>
              </div>
              {dashTab === 'citas' && (
                <div className='bg-white border border-gray-200 rounded-xl p-5'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-4'>Monitor de citas — hoy</h3>
                  <AppointmentMonitor appointments={appointments} onRefresh={loadAll} />
                </div>
              )}
              {dashTab === 'sistema' && (
                <div className='bg-white border border-gray-200 rounded-xl p-5'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-4'>Estado del sistema</h3>
                  <OperationalMonitor />
                </div>
              )}
            </div>
            </div>
          )}

          {/* REGISTRO */}
          {activePanel === 'registro' && (
            <div className='space-y-5'>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>
                  {registroStep === 'registro' ? 'Registro de paciente' : 'Agendamiento de cita'}
                </h2>
                <div className='flex items-center gap-2 mt-3'>
                  {[{ step: 'registro', num: 1, label: 'Registrar paciente' },{ step: 'agendamiento', num: 2, label: 'Agendar cita' }].map(({ step, num, label }) => (
                    <div key={step} className='flex items-center gap-2'>
                      <div className={'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ' + (registroStep === step ? 'bg-blue-600 text-white' : registroStep === 'agendamiento' && step === 'registro' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500')}>
                        {registroStep === 'agendamiento' && step === 'registro' ? '✓' : num}
                      </div>
                      <span className={'text-xs ' + (registroStep === step ? 'text-blue-600 font-medium' : 'text-gray-400')}>{label}</span>
                      {step === 'registro' && <div className='w-8 h-px bg-gray-300 mx-1' />}
                    </div>
                  ))}
                </div>
              </div>
              <div className='max-w-2xl'>
                {registroStep === 'registro' ? (
                  <RegistroPaciente onPatientReady={handlePatientReady} />
                ) : (
                  <AgendamientoCita patient={patientReady} onBack={() => setRegistroStep('registro')} onDone={handleRegistroDone} />
                )}
              </div>
            </div>
          )}

          {activePanel === 'pacientes' && <div className='flex-1 overflow-hidden flex flex-col p-6'><PacientesPanel /></div>}

          {activePanel === 'usuarios' && (
            <div className='space-y-4'>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>Resumen de turnos</h2>
                <p className='text-sm text-gray-500'>Estado en tiempo real de los turnos del dia</p>
              </div>
              <TurnosPanel appointments={appointments} />
            </div>
          )}

          {activePanel === 'citas' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h2 className='text-xl font-bold text-gray-800'>Monitor de citas</h2>
                  <p className='text-sm text-gray-500'>{appointments.length} citas en total</p>
                </div>
              </div>
              <div className='bg-white border border-gray-200 rounded-xl p-5'>
                <AppointmentMonitor appointments={appointments} onRefresh={loadAll} />
              </div>
            </div>
          )}

          {activePanel === 'reportes' && (
            <div className='flex-1 overflow-auto p-6'><div className='space-y-4'>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>Reportes y estadisticas</h2>
                <p className='text-sm text-gray-500'>Analisis de especialidades, medicamentos y citas</p>
              </div>
              <HeatmapAgenda />
              <PacientesNuevosVsRecurrentes />
              <ReportesPanel />
            </div></div>
          )}

          {activePanel === 'sistema' && (
            <div className='space-y-4'>
              <div>
                <h2 className='text-xl font-bold text-gray-800'>Productividad y rendimiento</h2>
                <p className='text-sm text-gray-500'>Panel de control operativo del dia</p>
              </div>
              <div className='grid grid-cols-2 gap-5'>
                <div className='bg-white border border-gray-200 rounded-xl p-5'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-4'>Servicios</h3>
                  <OperationalMonitor />
                </div>
                <div className='bg-white border border-gray-200 rounded-xl p-5'>
                  <h3 className='text-sm font-semibold text-gray-700 mb-4'>Productividad</h3>
                  <ProductividadPanel />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
