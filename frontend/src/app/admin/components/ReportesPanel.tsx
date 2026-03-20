'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string) {
  return fetch(API + url, { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() } });
}
const COLORS = ['#3b82f6','#10b981','#f97316','#8b5cf6','#ef4444','#06b6d4','#f59e0b','#84cc16','#ec4899','#6366f1'];
const ESTADO_COLORS: Record<string, string> = { COMPLETADA: '#10b981', PENDIENTE: '#f97316', CONFIRMADA: '#3b82f6', CANCELADA: '#ef4444', NO_ASISTIO: '#9ca3af', EN_CONSULTA: '#8b5cf6', AGENDADA: '#f59e0b' };
export function ReportesPanel() {
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [citasEstado, setCitasEstado] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const cargar = async () => {
      try {
        const [eRes, mRes, aRes] = await Promise.all([
          authFetch('/api/patients/reports/specialties').then(r => r.json()),
          authFetch('/api/medical-records/reports/medications').then(r => r.json()),
          authFetch('/api/appointments/stats/dashboard').then(r => r.json()),
        ]);
        setEspecialidades(Array.isArray(eRes) ? eRes : []);
        setMedicamentos(Array.isArray(mRes) ? mRes : []);
        if (aRes && typeof aRes === 'object') {
          const estados = [
            { estado: 'Completadas', valor: aRes.completadasHoy ?? 0 },
            { estado: 'Pendientes', valor: aRes.pendientesHoy ?? 0 },
            { estado: 'En curso', valor: aRes.enCursoHoy ?? 0 },
            { estado: 'Canceladas', valor: aRes.canceladasHoy ?? 0 },
          ].filter(e => e.valor > 0);
          setCitasEstado(estados);
        }
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, []);
  if (loading) return <p className="text-center text-gray-400 py-12 text-sm">Cargando reportes...</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Especialidades mas requeridas</p>
          {especialidades.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin datos</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={especialidades} margin={{ top: 0, right: 16, left: 0, bottom: 60 }}>
                <XAxis dataKey="especialidad" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip formatter={(v: any) => [v + ' pacientes', 'Total']} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {especialidades.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Citas de hoy por estado</p>
          {citasEstado.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin citas hoy</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={citasEstado} dataKey="valor" nameKey="estado" cx="50%" cy="45%" outerRadius={90} label={({ name, percent }: any) => name + ' ' + ((percent ?? 0) * 100).toFixed(0) + '%'}>
                  {citasEstado.map((e: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [v + ' citas', '']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Top 10 medicamentos mas recetados</p>
        {medicamentos.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin datos de prescripciones</p> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={medicamentos} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="medicamento" tick={{ fontSize: 11 }} width={140} />
              <Tooltip formatter={(v: any) => [v + ' recetas', 'Cantidad']} />
              <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                {medicamentos.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
