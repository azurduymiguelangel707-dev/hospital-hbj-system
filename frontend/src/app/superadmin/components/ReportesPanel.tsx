// src/app/superadmin/components/ReportesPanel.tsx
'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, Stethoscope, Users, FileText, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
function authFetch(url: string) {
  return fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

const ESPECIALIDADES = ['Traumatologia','Otorrinolaringologia','Cardiologia','Gastroenterologia','Neurologia'];
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
const today = new Date().toISOString().split('T')[0];
const monthStart = today.substring(0, 8) + '01';

type ReporteType = 'diario' | 'especialidad' | 'pacientes';

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  PENDIENTE:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  COMPLETADA:  { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  CANCELADA:   { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  EN_CONSULTA: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
};

export function ReportesPanel() {
  const [activeReport, setActiveReport] = useState<ReporteType>('diario');
  const [loading, setLoading]           = useState(false);
  const [data, setData]                 = useState<any>(null);
  const [fechaDiario, setFechaDiario]   = useState(today);
  const [especialidad, setEspecialidad] = useState('Cardiologia');
  const [fechaInicio, setFechaInicio]   = useState(monthStart);
  const [fechaFin, setFechaFin]         = useState(today);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  async function loadReport() {
    setLoading(true); setData(null);
    try {
      let url = '';
      if (activeReport === 'diario')       url = `/api/superadmin/reportes/diario?fecha=${fechaDiario}`;
      else if (activeReport === 'especialidad') url = `/api/superadmin/reportes/especialidad?especialidad=${especialidad}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      else url = `/api/superadmin/reportes/pacientes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      const res = await authFetch(url);
      setData(await res.json());
    } catch { setData(null); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadReport(); }, [activeReport]);

  function exportReportePDF() {
    if (!data) return;
    let content = '';
    if (activeReport === 'diario') {
      content = `<h2>Reporte Diario - ${data.fecha}</h2>
        <p>Total: ${data.totales?.total ?? 0} | Completadas: ${data.totales?.completadas ?? 0} | Pendientes: ${data.totales?.pendientes ?? 0}</p>
        ${(data.resumen ?? []).map((r: any) => `<h3>${r.especialidad} - ${r.turno === 'manana' ? 'Manana' : 'Tarde'}</h3>
        <table border='1' cellpadding='4' style='border-collapse:collapse;width:100%;font-size:11px'>
        <tr><th>Ficha</th><th>Paciente</th><th>Historial</th><th>Medico</th><th>Estado</th></tr>
        ${(r.citas ?? []).map((c: any) => `<tr><td>${c.numero_ficha}/${c.total_fichas_turno}</td><td>${c.patient_nombre}</td><td>${c.numero_historial}</td><td>Dr. ${c.doctor_nombre} ${c.doctor_apellido}</td><td>${c.status}</td></tr>`).join('')}
        </table>`).join('')}`;
    } else if (activeReport === 'especialidad') {
      content = `<h2>Reporte - ${data.especialidad}</h2><p>Periodo: ${data.fechaInicio} al ${data.fechaFin} | Total: ${data.total}</p>`;
    } else {
      content = `<h2>Reporte de Pacientes</h2><p>Total nuevos: ${data.stats?.total ?? 0} | Masculinos: ${data.stats?.masculinos ?? 0} | Femeninos: ${data.stats?.femeninos ?? 0}</p>`;
    }
    const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Reporte HBJ</title>
      <style>body{font-family:Arial;margin:40px;color:#1f2937}h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:8px}
      h2,h3{color:#1e40af}table{width:100%;border-collapse:collapse;margin:8px 0}
      th{background:#1e40af;color:white;padding:6px}td{padding:6px}tr:nth-child(even){background:#f9fafb}</style>
      </head><body><h1>Hospital Boliviano Japones</h1>
      <p style='font-size:12px;color:#6b7280'>Generado: ${new Date().toLocaleString('es-ES')}</p>
      ${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) setTimeout(() => win.print(), 500);
    URL.revokeObjectURL(url);
  }

  const REPORT_TABS = [
    { key: 'diario' as ReporteType,       label: 'Reporte diario',   icon: Calendar,    desc: 'Citas del dia' },
    { key: 'especialidad' as ReporteType, label: 'Por especialidad', icon: Stethoscope, desc: 'Tendencia temporal' },
    { key: 'pacientes' as ReporteType,    label: 'Pacientes',        icon: Users,       desc: 'Registro y demografia' },
  ];

  return (
    <div className='flex gap-5 h-full'>
      {/* Columna principal */}
      <div className='flex-1 min-w-0 flex flex-col overflow-hidden'>

        {/* Tabs */}
        <div className='flex gap-2 mb-4 flex-shrink-0'>
          {REPORT_TABS.map(({ key, label, icon: Icon, desc }) => (
            <button key={key} onClick={() => setActiveReport(key)}
              className={'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition border ' +
                (activeReport === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}>
              <Icon size={14} />
              <div className='text-left'>
                <div className='font-medium leading-tight'>{label}</div>
                <div className={'text-xs leading-tight ' + (activeReport === key ? 'text-blue-200' : 'text-gray-400')}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className='bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 flex-shrink-0'>
          <div className='flex items-end gap-3 flex-wrap'>
            {activeReport === 'diario' && (
              <div>
                <label className='text-xs text-gray-500 mb-1 block'>Fecha</label>
                <input type='date' value={fechaDiario} onChange={e => setFechaDiario(e.target.value)}
                  className='border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />
              </div>
            )}
            {activeReport === 'especialidad' && (
              <div>
                <label className='text-xs text-gray-500 mb-1 block'>Especialidad</label>
                <select value={especialidad} onChange={e => setEspecialidad(e.target.value)}
                  className='border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'>
                  {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            )}
            {(activeReport === 'especialidad' || activeReport === 'pacientes') && (
              <>
                <div>
                  <label className='text-xs text-gray-500 mb-1 block'>Fecha inicio</label>
                  <input type='date' value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                    className='border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />
                </div>
                <div>
                  <label className='text-xs text-gray-500 mb-1 block'>Fecha fin</label>
                  <input type='date' value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                    className='border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' />
                </div>
              </>
            )}
            <button onClick={loadReport} disabled={loading}
              className='flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition'>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Generando...' : 'Generar reporte'}
            </button>
            {data && (
              <button onClick={exportReportePDF}
                className='flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 transition'>
                <Download size={13} /> Exportar PDF
              </button>
            )}
          </div>
        </div>

        {/* Contenido con scroll interno */}
        <div className='flex-1 overflow-y-auto space-y-4'>
          {loading && (
            <div className='text-center py-16 text-gray-400'>
              <RefreshCw size={28} className='mx-auto mb-3 animate-spin opacity-30' />
              <p className='text-sm'>Generando reporte...</p>
            </div>
          )}

          {/* REPORTE DIARIO */}
          {!loading && data && activeReport === 'diario' && (
            <div className='space-y-4'>
              {/* KPIs */}
              <div className='grid grid-cols-4 gap-3'>
                {[
                  { label: 'Total citas',  val: data.totales?.total ?? 0,       color: '#3b82f6', bg: '#eff6ff', icono: '📅' },
                  { label: 'Completadas', val: data.totales?.completadas ?? 0,  color: '#10b981', bg: '#f0fdf4', icono: '✅' },
                  { label: 'Pendientes',  val: data.totales?.pendientes ?? 0,   color: '#f59e0b', bg: '#fffbeb', icono: '⏳' },
                  { label: 'Canceladas',  val: data.totales?.canceladas ?? 0,   color: '#ef4444', bg: '#fef2f2', icono: '❌' },
                ].map((s, i) => (
                  <div key={i} className='rounded-xl p-3 text-center border' style={{ backgroundColor: s.bg, borderColor: s.color + '30' }}>
                    <div className='text-xl mb-1'>{s.icono}</div>
                    <div className='text-2xl font-bold' style={{ color: s.color }}>{s.val}</div>
                    <div className='text-xs mt-0.5' style={{ color: s.color }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Secciones colapsables por especialidad/turno */}
              {(data.resumen ?? []).length === 0 ? (
                <div className='text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl'>
                  <FileText size={28} className='mx-auto mb-2 opacity-30' />
                  <p className='text-sm'>Sin citas registradas para esta fecha</p>
                </div>
              ) : (data.resumen ?? []).map((r: any) => {
                const key = `${r.especialidad}-${r.turno}`;
                const isOpen = expandedSection === key;
                const pct = r.totalFichas > 0 ? Math.round((r.fichasUsadas / r.totalFichas) * 100) : 0;
                return (
                  <div key={key} className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
                    {/* Header colapsable */}
                    <button className='w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left'
                      onClick={() => setExpandedSection(isOpen ? null : key)}>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm'>🏥</div>
                        <div>
                          <p className='text-sm font-semibold text-gray-800'>{r.especialidad}</p>
                          <p className='text-xs text-gray-400'>{r.turno === 'manana' ? '☀️ Manana (08:00-14:00)' : '🌙 Tarde (15:00-18:00)'}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p className='text-xs font-bold text-gray-700'>{r.fichasUsadas}/{r.totalFichas} fichas</p>
                          <div className='w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1'>
                            <div className='h-1.5 bg-blue-500 rounded-full' style={{ width: pct + '%' }} />
                          </div>
                        </div>
                        <span className='text-gray-400 text-xs'>{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {/* Tabla expandida */}
                    {isOpen && (
                      <div className='border-t border-gray-100'>
                        <table className='w-full'>
                          <thead className='bg-gray-50'>
                            <tr>
                              {['Ficha','Paciente','N° Historial','Medico','Estado'].map(h => (
                                <th key={h} className='px-3 py-2 text-left text-xs font-semibold text-gray-500'>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-gray-50'>
                            {(r.citas ?? []).map((c: any) => {
                              const stCfg = STATUS_CFG[c.status] ?? STATUS_CFG.PENDIENTE;
                              return (
                                <tr key={c.id} className='hover:bg-gray-50 transition'>
                                  <td className='px-3 py-2'>
                                    <span className='text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full'>{c.numero_ficha}/{c.total_fichas_turno}</span>
                                  </td>
                                  <td className='px-3 py-2 text-xs font-medium text-gray-700'>{c.patient_nombre}</td>
                                  <td className='px-3 py-2 text-xs font-mono text-gray-500'>{c.numero_historial}</td>
                                  <td className='px-3 py-2 text-xs text-gray-600'>Dr. {c.doctor_nombre} {c.doctor_apellido}</td>
                                  <td className='px-3 py-2'>
                                    <span className='px-2 py-0.5 rounded-full text-xs font-semibold' style={{ color: stCfg.color, backgroundColor: stCfg.bg, border: '1px solid ' + stCfg.border }}>
                                      {c.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* REPORTE ESPECIALIDAD */}
          {!loading && data && activeReport === 'especialidad' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-white border border-gray-200 rounded-xl p-4'>
              <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1'>Total citas — {data.especialidad}</p>
                  <p className='text-3xl font-bold text-blue-600'>{data.total}</p>
              <p className='text-xs text-gray-400 mt-1'>{new Date(data.fechaInicio).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})} al {new Date(data.fechaFin).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</p>
                </div>
                <div className='bg-white border border-gray-200 rounded-xl p-4'>
                  <p className='text-xs font-semibold text-gray-500 mb-2'>Manana vs Tarde</p>
                  <ResponsiveContainer width='100%' height={100}>
                    <BarChart data={data.porDia?.slice(-7)}>
                <XAxis dataKey='fecha' tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                      <Bar dataKey='manana' name='Manana' fill='#3b82f6' radius={[4,4,0,0]} />
                      <Bar dataKey='tarde'  name='Tarde'  fill='#10b981' radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {data.porDia?.length > 0 && (
                <div className='bg-white border border-gray-200 rounded-xl p-4'>
                  <p className='text-xs font-semibold text-gray-500 mb-3'>Tendencia de citas</p>
                  <ResponsiveContainer width='100%' height={200}>
                    <LineChart data={data.porDia}>
                      <CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6' />
              <XAxis dataKey='fecha' tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => new Date(v).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} labelFormatter={(v) => new Date(v).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})} />
                      <Legend />
                      <Line type='monotone' dataKey='total'      stroke='#3b82f6' name='Total'      strokeWidth={2} dot={false} />
                      <Line type='monotone' dataKey='completadas' stroke='#10b981' name='Completadas' strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* REPORTE PACIENTES */}
          {!loading && data && activeReport === 'pacientes' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-4 gap-3'>
                {[
                  { label: 'Nuevos pacientes', val: data.stats?.total ?? 0,                                icono: '👥' },
                  { label: 'Masculinos',        val: data.stats?.masculinos ?? 0,                          icono: '👨' },
                  { label: 'Femeninos',         val: data.stats?.femeninos ?? 0,                           icono: '👩' },
                  { label: 'Edad promedio',     val: parseFloat(data.stats?.edad_promedio ?? 0).toFixed(1) + ' anos', icono: '📊' },
                ].map((s, i) => (
                  <div key={i} className='bg-white border border-gray-200 rounded-xl p-3 text-center'>
                    <div className='text-xl mb-1'>{s.icono}</div>
                    <div className='text-xl font-bold text-gray-800'>{s.val}</div>
                    <div className='text-xs text-gray-500 mt-0.5'>{s.label}</div>
                  </div>
                ))}
              </div>
              {data.porEspecialidad?.length > 0 && (
                <div className='bg-white border border-gray-200 rounded-xl p-4'>
                  <p className='text-xs font-semibold text-gray-500 mb-3'>Pacientes por especialidad requerida</p>
                  <div className='flex items-center gap-4'>
                    <ResponsiveContainer width='50%' height={200}>
                      <PieChart>
                        <Pie data={data.porEspecialidad} dataKey='total' nameKey='especialidad' cx='50%' cy='50%' outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                          {data.porEspecialidad.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className='flex-1 space-y-2'>
                      {data.porEspecialidad.map((e: any, i: number) => (
                        <div key={i} className='flex items-center justify-between px-3 py-2 rounded-lg' style={{ backgroundColor: COLORS[i % COLORS.length] + '15' }}>
                          <div className='flex items-center gap-2'>
                            <div className='w-2.5 h-2.5 rounded-full' style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className='text-xs text-gray-600'>{e.especialidad}</span>
                          </div>
                          <span className='text-xs font-bold' style={{ color: COLORS[i % COLORS.length] }}>{e.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral */}
      <div className='w-56 flex-shrink-0 space-y-4'>
        <div className='bg-white rounded-xl border border-gray-200 p-4'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Tipo de reporte</p>
          <div className='space-y-2'>
            {REPORT_TABS.map(({ key, label, icon: Icon, desc }) => (
              <button key={key} onClick={() => setActiveReport(key)}
                className={'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition ' +
                  (activeReport === key ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200')}>
                <Icon size={14} className={activeReport === key ? 'text-blue-600 mt-0.5' : 'text-gray-400 mt-0.5'} />
                <div>
                  <p className={'text-xs font-semibold ' + (activeReport === key ? 'text-blue-700' : 'text-gray-600')}>{label}</p>
                  <p className='text-xs text-gray-400'>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {data && activeReport === 'diario' && (
          <div className='bg-white rounded-xl border border-gray-200 p-4'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Resumen del dia</p>
            <div className='space-y-1.5'>
              {(data.resumen ?? []).map((r: any, i: number) => {
                const pct = r.totalFichas > 0 ? Math.round((r.fichasUsadas / r.totalFichas) * 100) : 0;
                return (
                  <div key={i} className='flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg'>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium text-gray-700 truncate'>{r.especialidad.substring(0,12)}</p>
                      <p className='text-xs text-gray-400'>{r.turno === 'manana' ? '☀️' : '🌙'} {pct}%</p>
                    </div>
                    <span className='text-xs font-bold text-blue-600 ml-2'>{r.fichasUsadas}/{r.totalFichas}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className='bg-white rounded-xl border border-gray-200 p-4'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Exportar</p>
          <div className='space-y-2'>
            <button onClick={exportReportePDF} disabled={!data}
              className='w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition'>
              <Download size={12} /> Exportar PDF
            </button>
            <p className='text-xs text-gray-400 text-center'>Genera primero el reporte para exportar</p>
          </div>
        </div>
      </div>
    </div>
  );
}