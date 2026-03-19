// src/app/superadmin/components/ReportesPanel.tsx
'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, Stethoscope, Users, FileText } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string) {
  return fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

const ESPECIALIDADES = ['Traumatologia', 'Otorrinolaringologia', 'Cardiologia', 'Gastroenterologia', 'Neurologia'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const today = new Date().toISOString().split('T')[0];
const monthStart = today.substring(0, 8) + '01';

type ReporteType = 'diario' | 'especialidad' | 'pacientes';

export function ReportesPanel() {
  const [activeReport, setActiveReport] = useState<ReporteType>('diario');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Filtros
  const [fechaDiario, setFechaDiario] = useState(today);
  const [especialidad, setEspecialidad] = useState('Cardiologia');
  const [fechaInicio, setFechaInicio] = useState(monthStart);
  const [fechaFin, setFechaFin] = useState(today);

  async function loadReport() {
    setLoading(true); setData(null);
    try {
      let url = '';
      if (activeReport === 'diario') url = `/api/superadmin/reportes/diario?fecha=${fechaDiario}`;
      else if (activeReport === 'especialidad') url = `/api/superadmin/reportes/especialidad?especialidad=${encodeURIComponent(especialidad)}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      else if (activeReport === 'pacientes') url = `/api/superadmin/reportes/pacientes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
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
      <p>Total citas: ${data.totales?.total ?? 0} | Completadas: ${data.totales?.completadas ?? 0} | Pendientes: ${data.totales?.pendientes ?? 0} | Canceladas: ${data.totales?.canceladas ?? 0}</p>
      ${data.resumen?.map((r: any) => `<h3>${r.especialidad} - ${r.turno === 'manana' ? 'Manana' : 'Tarde'}</h3>
      <p>Fichas usadas: ${r.fichasUsadas}/${r.totalFichas}</p>
      <table border="1" cellpadding="4" style="border-collapse:collapse;width:100%;font-size:11px">
        <tr><th>Ficha</th><th>Paciente</th><th>Historial</th><th>Medico</th><th>Estado</th></tr>
        ${r.citas?.map((c: any) => `<tr><td>${c.numero_ficha}/${c.total_fichas_turno}</td><td>${c.patient_nombre}</td><td>${c.numero_historial}</td><td>Dr. ${c.doctor_nombre} ${c.doctor_apellido}</td><td>${c.status}</td></tr>`).join('')}
      </table>`).join('')}`;
    } else if (activeReport === 'especialidad') {
      content = `<h2>Reporte por Especialidad - ${data.especialidad}</h2>
      <p>Periodo: ${data.fechaInicio} al ${data.fechaFin} | Total citas: ${data.total}</p>
      <table border="1" cellpadding="4" style="border-collapse:collapse;width:100%;font-size:11px">
        <tr><th>Fecha</th><th>Total</th><th>Manana</th><th>Tarde</th><th>Completadas</th></tr>
        ${data.porDia?.map((d: any) => `<tr><td>${d.fecha}</td><td>${d.total}</td><td>${d.manana}</td><td>${d.tarde}</td><td>${d.completadas}</td></tr>`).join('')}
      </table>`;
    } else {
      content = `<h2>Reporte de Pacientes</h2>
      <p>Periodo: ${data.fechaInicio} al ${data.fechaFin}</p>
      <p>Total nuevos: ${data.stats?.total ?? 0} | Masculinos: ${data.stats?.masculinos ?? 0} | Femeninos: ${data.stats?.femeninos ?? 0}</p>
      <p>Edad promedio: ${parseFloat(data.stats?.edad_promedio ?? 0).toFixed(1)} anos | Min: ${data.stats?.edad_min} | Max: ${data.stats?.edad_max}</p>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte HBJ</title>
    <style>body{font-family:Arial;margin:40px;color:#1f2937}h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:8px}
    h2{color:#1e40af}h3{color:#374151}table{width:100%;border-collapse:collapse;margin:8px 0}
    th{background:#1e40af;color:white;padding:6px}td{padding:6px}tr:nth-child(even){background:#f9fafb}
    .footer{margin-top:24px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px}</style>
    </head><body>
    <h1>Hospital Boliviano Japones - Sistema HBJ v1.0.0</h1>
    <p style="font-size:12px;color:#6b7280">Generado: ${new Date().toLocaleString('es-ES')}</p>
    ${content}
    <div class="footer">Reporte generado automaticamente por el Sistema de Gestion Hospitalaria HBJ.</div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) setTimeout(() => win.print(), 500);
    URL.revokeObjectURL(url);
  }

  const REPORT_TABS: { key: ReporteType; label: string; icon: any }[] = [
    { key: 'diario', label: 'Reporte diario', icon: Calendar },
    { key: 'especialidad', label: 'Por especialidad', icon: Stethoscope },
    { key: 'pacientes', label: 'Pacientes', icon: Users },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-200 pb-3">
        {REPORT_TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveReport(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition ${activeReport === key ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-end gap-3 flex-wrap">
          {activeReport === 'diario' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
              <input type="date" value={fechaDiario} onChange={e => setFechaDiario(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          )}
          {activeReport === 'especialidad' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Especialidad</label>
              <select value={especialidad} onChange={e => setEspecialidad(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          )}
          {(activeReport === 'especialidad' || activeReport === 'pacientes') && (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha inicio</label>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha fin</label>
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </>
          )}
          <button onClick={loadReport} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            {loading ? 'Generando...' : 'Generar reporte'}
          </button>
          {data && (
            <button onClick={exportReportePDF}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
              <Download size={13} /> Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && <div className="text-center py-12 text-gray-400 text-sm">Generando reporte...</div>}

      {!loading && data && activeReport === 'diario' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total citas', value: data.totales?.total ?? 0, color: 'blue' },
              { label: 'Completadas', value: data.totales?.completadas ?? 0, color: 'green' },
              { label: 'Pendientes', value: data.totales?.pendientes ?? 0, color: 'amber' },
              { label: 'Canceladas', value: data.totales?.canceladas ?? 0, color: 'red' },
            ].map(s => (
              <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-4`}>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          {data.resumen?.length > 0 ? data.resumen.map((r: any) => (
            <div key={`${r.especialidad}-${r.turno}`} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{r.especialidad} - {r.turno === 'manana' ? 'Manana (08:00-14:00)' : 'Tarde (15:00-18:00)'}</h3>
                <span className="text-xs text-gray-500">{r.fichasUsadas}/{r.totalFichas} fichas</span>
              </div>
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>{['Ficha', 'Paciente', 'NÂ° Historial', 'Medico', 'Estado'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {r.citas?.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-semibold text-blue-600">{c.numero_ficha}/{c.total_fichas_turno}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{c.patient_nombre}</td>
                        <td className="px-3 py-2 text-xs font-mono text-gray-500">{c.numero_historial}</td>
                        <td className="px-3 py-2 text-xs text-gray-600">Dr. {c.doctor_nombre} {c.doctor_apellido}</td>
                        <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )) : <p className="text-center py-8 text-gray-400 text-sm">Sin citas registradas para esta fecha</p>}
        </div>
      )}

      {!loading && data && activeReport === 'especialidad' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total citas - {data.especialidad}</p>
              <p className="text-3xl font-bold text-blue-600">{data.total}</p>
              <p className="text-xs text-gray-400 mt-1">{data.fechaInicio} al {data.fechaFin}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Distribucion por turno</p>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={data.porDia?.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="manana" name="Manana" fill="#3b82f6" />
                  <Bar dataKey="tarde" name="Tarde" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {data.porDia?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Tendencia de citas</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.porDia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
                  <Line type="monotone" dataKey="completadas" stroke="#10b981" name="Completadas" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!loading && data && activeReport === 'pacientes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Nuevos pacientes', value: data.stats?.total ?? 0 },
              { label: 'Masculinos', value: data.stats?.masculinos ?? 0 },
              { label: 'Femeninos', value: data.stats?.femeninos ?? 0 },
              { label: 'Edad promedio', value: `${parseFloat(data.stats?.edad_promedio ?? 0).toFixed(1)} anos` },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          {data.porEspecialidad?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Pacientes por especialidad requerida</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.porEspecialidad} dataKey="total" nameKey="especialidad" cx="50%" cy="50%" outerRadius={80} label={({ especialidad, total }) => `${especialidad}: ${total}`}>
                    {data.porEspecialidad.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
