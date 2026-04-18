// src/app/superadmin/page.tsx
'use client';
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, UserCog, ShieldCheck, HeartPulse, BarChart2, LogOut, RefreshCw, Terminal } from 'lucide-react';
import { IconDashboard, IconDoctor, IconShieldCheck, IconDatabase, IconReportes, IconSistema } from '@/components/icons/MedicalIcons';
import { GlobalUserManager } from './components/GlobalUserManager';
import { BlockchainViewer } from './components/BlockchainViewer';
import { SystemMonitor } from './components/SystemMonitor';
import { BackupPanel } from './components/BackupPanel';
import { SNISPanel } from './components/SNISPanel';
import { ReportesPanel } from './components/ReportesPanel';
import { CerrarDiaButton } from '../admin/components/CerrarDiaButton';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

type Panel = 'dashboard' | 'usuarios' | 'blockchain' | 'reportes' | 'sistema' | 'backup' | 'snis';

const PANELS: { key: Panel; label: string; icon: any; desc: string }[] = [
  { key: 'dashboard',  label: 'Resumen ejecutivo', icon: IconDashboard,   desc: 'Vision general del sistema' },
  { key: 'usuarios',   label: 'Usuarios',          icon: IconDoctor,      desc: 'Gestion global' },
  { key: 'blockchain', label: 'Blockchain',        icon: IconShieldCheck, desc: 'Audit log' },
  { key: 'reportes',   label: 'Reportes',          icon: IconReportes,    desc: 'Estadisticas' },
  { key: 'sistema',    label: 'Sistema',           icon: IconSistema,     desc: 'Monitor' },
  { key: 'backup',     label: 'Backup',            icon: IconDatabase,    desc: 'Respaldo y recuperacion' },
  { key: 'snis',      label: 'SNIS',              icon: IconDatabase,    desc: 'Consulta Externa' },
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

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await authFetch('/api/superadmin/users').then(r => r.json()).catch(() => []);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch {}
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

  const [dashTab, setDashTab] = useState<'resumen'|'servicios'>('resumen');
  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Top bar â€”Â dark theme para distinguir del admin */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <Terminal size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Hospital Boliviano Japones</p>
            <p className="text-xs text-red-400 font-medium">Centro de Gobierno del Sistema - Direccion Central de Tecnologia y Gestion</p>
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
          {PANELS.map(({ key, label, icon: Icon, desc }, idx) => {
  const iconColors = [
    { active: 'text-blue-400',   bg: 'bg-blue-500/20',   dot: '#60a5fa' },
    { active: 'text-purple-400', bg: 'bg-purple-500/20', dot: '#c084fc' },
    { active: 'text-emerald-400',bg: 'bg-emerald-500/20',dot: '#34d399' },
    { active: 'text-amber-400',  bg: 'bg-amber-500/20',  dot: '#fbbf24' },
    { active: 'text-pink-400',   bg: 'bg-pink-500/20',   dot: '#f472b6' },
    { active: 'text-cyan-400',   bg: 'bg-cyan-500/20',   dot: '#22d3ee' },
  ][idx] ?? { active: 'text-red-400', bg: 'bg-red-500/20', dot: '#f87171' };
  return (
            <button key={key} onClick={() => setActivePanel(key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all text-left w-full ${activePanel === key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
              <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ' + (activePanel === key ? iconColors.bg : 'bg-gray-800')}><Icon size={18} className={activePanel === key ? iconColors.active : 'text-gray-500'} /></div>
              <div>
                <p className="text-xs font-medium leading-tight">{label}</p>
                <p className="text-xs text-gray-600 leading-tight">{desc}</p>
              </div>
            </button>
        );})}

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

        {/* Main content â€”Â light */}
        <main className="flex-1 overflow-hidden bg-gray-50 p-6 flex flex-col">

          {/* DASHBOARD */}
          {activePanel === 'dashboard' && (() => {
            const dbChartData = dbStats.map((d: any) => ({
              name: ({ patients:'Pacientes', appointments:'Citas', doctors:'Medicos', users:'Usuarios', medical_records:'Historiales', vital_signs:'Vitales', documents:'Documentos', blockchain_audit:'Audit' } as any)[d.table] ?? d.table,
              Registros: d.count,
            })).sort((a: any,b: any) => b.Registros - a.Registros).slice(0,6);

            const donaData = [
              { name: 'Pacientes',   value: dbStats.find((d: any)=>d.table==='patients')?.count ?? 0,        color: '#3b82f6' },
              { name: 'Citas',       value: dbStats.find((d: any)=>d.table==='appointments')?.count ?? 0,    color: '#10b981' },
              { name: 'Historiales', value: dbStats.find((d: any)=>d.table==='medical_records')?.count ?? 0, color: '#8b5cf6' },
              { name: 'Vitales',     value: dbStats.find((d: any)=>d.table==='vital_signs')?.count ?? 0,     color: '#f59e0b' },
              { name: 'Documentos',  value: dbStats.find((d: any)=>d.table==='documents')?.count ?? 0,       color: '#ec4899' },
              { name: 'Audit',       value: dbStats.find((d: any)=>d.table==='blockchain_audit')?.count ?? 0,color: '#ef4444' },
            ].filter((d: any) => d.value > 0);

            const totalRegistros = dbStats.reduce((acc: number, d: any) => acc + d.count, 0);

            const KpiIcons = {
              usuarios:   <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#3b82f6' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><circle cx='9' cy='7' r='4'/><path d='M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2'/><circle cx='19' cy='7' r='2'/><path d='M22 21v-1a2 2 0 0 0-2-2h-1'/></svg>,
              medicos:    <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#10b981' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><path d='M8 2h8v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4V2z'/><rect x='3' y='10' width='18' height='12' rx='2'/><path d='M9 15h6M12 12v6'/></svg>,
              pacientes:  <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#8b5cf6' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>,
              citas:      <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#f59e0b' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M16 2v4M8 2v4M3 10h18'/><path d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01'/></svg>,
              blockchain: <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='M9 12l2 2 4-4'/></svg>,
              database:   <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#6b7280' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><ellipse cx='12' cy='5' rx='9' ry='3'/><path d='M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5'/><path d='M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9'/><path d='M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4'/></svg>,
            };

            const kpis = [
              { label: 'Usuarios totales',   val: stats.totalUsers ?? 0,      color: '#3b82f6', bg: '#eff6ff', icono: KpiIcons.usuarios,   sub: (stats.activeUsers ?? 0) + ' activos' },
              { label: 'Medicos',            val: stats.totalDoctors ?? 0,     color: '#10b981', bg: '#f0fdf4', icono: KpiIcons.medicos,    sub: 'en el sistema' },
              { label: 'Pacientes',          val: patientsCount,               color: '#8b5cf6', bg: '#f5f3ff', icono: KpiIcons.pacientes,  sub: 'registrados' },
              { label: 'Citas hoy',          val: apptStats.totalHoy ?? 0,     color: '#f59e0b', bg: '#fffbeb', icono: KpiIcons.citas,      sub: (apptStats.completadasHoy ?? 0) + ' completadas' },
              { label: 'Bloques audit',      val: blockchainCount,             color: '#ef4444', bg: '#fef2f2', icono: KpiIcons.blockchain, sub: 'SHA-256' },
              { label: 'Total registros BD', val: totalRegistros,              color: '#6b7280', bg: '#f9fafb', icono: KpiIcons.database,   sub: 'en PostgreSQL' },
            ];

            return (
              <div className='space-y-4'>
                {/* Header */}
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-xl font-bold text-gray-800'>Resumen ejecutivo</h2>
                    <p className='text-xs text-gray-400 mt-0.5' suppressHydrationWarning>
                      {new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                    </p>
                  </div>
                  <button onClick={loadAll} disabled={loading}
                    className='flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition'>
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualizar datos
                  </button>
                </div>

                {/* KPIs siempre visibles */}
                <div className='grid grid-cols-6 gap-3'>
                  {kpis.map((k, i) => (
                    <div key={i} className='rounded-xl p-3 text-center border' style={{ backgroundColor: k.bg, borderColor: k.color + '30' }}>
                      <div className='mb-2 flex justify-center'>{k.icono}</div>
                      <div className='text-2xl font-bold' style={{ color: k.color }}>{k.val}</div>
                      <div className='text-xs font-medium mt-0.5' style={{ color: k.color }}>{k.label}</div>
                      <div className='text-xs text-gray-400 mt-0.5'>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className='flex gap-1 bg-gray-100 p-1 rounded-xl'>
                  <button onClick={() => setDashTab('resumen')}
                    className={'flex-1 py-2.5 rounded-lg text-xs font-semibold transition ' + (dashTab === 'resumen' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
                    Base de datos
                  </button>
                  <button onClick={() => setDashTab('servicios')}
                    className={'flex-1 py-2.5 rounded-lg text-xs font-semibold transition ' + (dashTab === 'servicios' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700')}>
                    Servicios y Blockchain
                  </button>
                </div>

                {/* Tab Base de datos */}
                {dashTab === 'resumen' && (
                  <div className='grid grid-cols-2 gap-5'>
                    <div className='bg-white rounded-xl border border-gray-200 p-4'>
                      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Registros por tabla</p>
                      <p className='text-xs text-gray-400 mb-3'>Volumen de datos en PostgreSQL</p>
                      {dbChartData.length === 0 ? (
                        <div className='text-center py-8 text-gray-300 text-xs'>Sin datos</div>
                      ) : (
                        <ResponsiveContainer width='100%' height={200}>
                          <BarChart data={dbChartData} barSize={28} layout='vertical'>
                            <XAxis type='number' allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis type='category' dataKey='name' tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                            <Bar dataKey='Registros' radius={[0,6,6,0]}>
                              {dbChartData.map((_: any, i: number) => (
                                <Cell key={i} fill={['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ec4899','#ef4444'][i % 6]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className='bg-white rounded-xl border border-gray-200 p-4'>
                      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Distribucion de datos</p>
                      <p className='text-xs text-gray-400 mb-3'>Proporcion de registros por categoria</p>
                      {donaData.length === 0 ? (
                        <div className='text-center py-8 text-gray-300 text-xs'>Sin datos</div>
                      ) : (
                        <div className='flex items-center gap-4'>
                          <ResponsiveContainer width='55%' height={200}>
                            <PieChart>
                              <Pie data={donaData} cx='50%' cy='50%' innerRadius={50} outerRadius={80} paddingAngle={2} dataKey='value'>
                                {donaData.map((_: any, i: number) => <Cell key={i} fill={donaData[i].color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className='flex-1 space-y-1.5'>
                            {donaData.map((d: any, i: number) => (
                              <div key={i} className='flex items-center justify-between'>
                                <div className='flex items-center gap-1.5'>
                                  <div className='w-2.5 h-2.5 rounded-full flex-shrink-0' style={{ backgroundColor: d.color }} />
                                  <span className='text-xs text-gray-600'>{d.name}</span>
                                </div>
                                <span className='text-xs font-bold' style={{ color: d.color }}>{d.value}</span>
                              </div>
                            ))}
                            <div className='pt-1 border-t border-gray-100 flex items-center justify-between'>
                              <span className='text-xs text-gray-400'>Total</span>
                              <span className='text-xs font-bold text-gray-700'>{totalRegistros}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Servicios */}
                {dashTab === 'servicios' && (
                  <div className='grid grid-cols-2 gap-5'>
                    <div className='bg-white rounded-xl border border-gray-200 p-4'>
                      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Estado de servicios</p>
                      <SystemMonitor />
                    </div>
                    <div className='bg-white rounded-xl border border-gray-200 p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Ultimos bloques</p>
                        <span className='text-xs text-gray-400'>{blockchainCount} total</span>
                      </div>
                      <div className='space-y-1.5'>
                        {blockchainCount === 0 ? (
                          <p className='text-xs text-gray-400 text-center py-4'>Sin bloques</p>
                        ) : (
                          [...Array(Math.min(8, blockchainCount))].map((_: any, i: number) => (
                            <div key={i} className='flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg'>
                              <div className='flex items-center gap-2'>
                                <div className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
                                <span className='text-xs font-mono text-gray-700'>Bloque #{blockchainCount - i}</span>
                              </div>
                              <span className='text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded'>SHA-256</span>
                            </div>
                          ))
                        )}
                      </div>
                      <button onClick={() => setActivePanel('blockchain')}
                        className='mt-3 w-full py-2 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-100'>
                        Ver todos los bloques ->
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* USUARIOS */}
          {activePanel === 'usuarios' && (
          <div className="flex-1 overflow-auto">
          <div className="mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800">Gestion global de usuarios</h2>
                <p className="text-sm text-gray-500">{users.length} usuarios en el sistema - acceso completo</p>
              </div>
          <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl p-5">
                <GlobalUserManager users={users} onRefresh={loadUsers} />
              </div>
            </div>
          )}

          {/* BLOCKCHAIN */}
          {activePanel === 'blockchain' && (
          <div className="flex-1 overflow-auto">
          <div className="mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800">Blockchain Audit Log</h2>
                <p className="text-sm text-gray-500">{blockchainCount} bloques registrados - SHA-256 CryptoJS</p>
              </div>
          <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl p-5">
                <BlockchainViewer />
              </div>
            </div>
          )}

          {/* REPORTES */}
          {activePanel === 'reportes' && (
          <div className="flex-1 overflow-auto">
          <div className="mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800">Reportes y estadisticas</h2>
                <p className="text-sm text-gray-500">Reportes exportables en PDF</p>
              </div>
          <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl p-5">
                <ReportesPanel />
              </div>
            </div>
          )}

          {/* SISTEMA */}
          {activePanel === 'snis' && (
          <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800">SNIS - Registro Diario de Consulta Externa</h2>
                <p className="text-sm text-gray-500">Medicina, Control Prenatal y Puerperio</p>
              </div>
          <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl p-5">
                <SNISPanel />
              </div>
            </div>
          )}

          {activePanel === 'backup' && (
            <BackupPanel />
          )}
          {activePanel === 'sistema' && (
          <div className="flex-1 overflow-hidden flex flex-col">
          <div className="mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800">Monitor del sistema</h2>
                <p className="text-sm text-gray-500">Estado en tiempo real de todos los servicios</p>
              </div>
          <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-xl p-5">
                <SystemMonitor />
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}


