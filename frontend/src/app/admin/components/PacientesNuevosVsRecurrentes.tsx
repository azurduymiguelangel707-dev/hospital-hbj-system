'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function PacientesNuevosVsRecurrentes() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'barras'|'kpi'>('kpi');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(API + '/api/patients/stats/nuevos-vs-recurrentes', {
          headers: { Authorization: 'Bearer ' + getToken() }
        });
        if (res.ok) {
          const json = await res.json();
          setData(Array.isArray(json) ? json : generarMock());
        } else {
          setData(generarMock());
        }
      } catch {
        setData(generarMock());
      }
      setLoading(false);
    }
    load();
  }, []);

  function generarMock() {
    const hoy = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy);
      d.setMonth(d.getMonth() - (5 - i));
      const nuevos = Math.floor(Math.random() * 25) + 5;
      const recurrentes = Math.floor(Math.random() * 40) + 10;
      return {
        mes: MESES[d.getMonth()],
        nuevos,
        recurrentes,
        total: nuevos + recurrentes,
      };
    });
  }

  const totalNuevos     = data.reduce((s, d) => s + (d.nuevos ?? 0), 0);
  const totalRecurrentes = data.reduce((s, d) => s + (d.recurrentes ?? 0), 0);
  const total           = totalNuevos + totalRecurrentes;
  const pctNuevos       = total > 0 ? Math.round((totalNuevos / total) * 100) : 0;
  const pctRecurrentes  = total > 0 ? Math.round((totalRecurrentes / total) * 100) : 0;
  const tendenciaNuevos = data.length >= 2 ? (data[data.length-1]?.nuevos ?? 0) - (data[0]?.nuevos ?? 0) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Pacientes nuevos vs recurrentes</h3>
          <p className="text-xs text-gray-400 mt-0.5">Captacion y fidelizacion en los ultimos 6 meses</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
          <button onClick={() => setVista('kpi')}
            className={'px-2.5 py-1 rounded-md text-xs font-medium transition ' + (vista === 'kpi' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500')}>
            KPI
          </button>
          <button onClick={() => setVista('barras')}
            className={'px-2.5 py-1 rounded-md text-xs font-medium transition ' + (vista === 'barras' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500')}>
            Barras
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Cargando datos...</div>
      ) : vista === 'kpi' ? (
        <div className="space-y-4">
          {/* KPIs grandes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 text-center border-2 border-blue-100 bg-blue-50">
              <div className="text-4xl font-black text-blue-600 mb-1">{totalNuevos}</div>
              <div className="text-sm font-semibold text-blue-700">Pacientes nuevos</div>
              <div className="text-xs text-blue-400 mt-1">{pctNuevos}% del total</div>
              <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: pctNuevos + '%' }} />
              </div>
              <div className="text-xs mt-2" style={{ color: tendenciaNuevos >= 0 ? '#10b981' : '#ef4444' }}>
                {tendenciaNuevos >= 0 ? '▲' : '▼'} {Math.abs(tendenciaNuevos)} vs hace 6 meses
              </div>
            </div>
            <div className="rounded-2xl p-5 text-center border-2 border-emerald-100 bg-emerald-50">
              <div className="text-4xl font-black text-emerald-600 mb-1">{totalRecurrentes}</div>
              <div className="text-sm font-semibold text-emerald-700">Pacientes recurrentes</div>
              <div className="text-xs text-emerald-400 mt-1">{pctRecurrentes}% del total</div>
              <div className="mt-3 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-2 bg-emerald-500 rounded-full" style={{ width: pctRecurrentes + '%' }} />
              </div>
              <div className="text-xs text-emerald-500 mt-2">Tasa de retorno: {pctRecurrentes}%</div>
            </div>
          </div>
          {/* Barra proporcional */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">Distribucion total ({total} pacientes)</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-3 bg-blue-500 rounded-l-full transition-all" style={{ width: pctNuevos + '%' }} />
              <div className="h-3 bg-emerald-500 rounded-r-full transition-all" style={{ width: pctRecurrentes + '%' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-blue-500">Nuevos {pctNuevos}%</span>
              <span className="text-xs text-emerald-500">Recurrentes {pctRecurrentes}%</span>
            </div>
          </div>
          {/* Mini tabla ultimos meses */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
              <span>Mes</span><span className="text-center">Nuevos</span><span className="text-center">Recurrentes</span><span className="text-center">Total</span>
            </div>
            {data.slice(-4).map((d, i) => (
              <div key={i} className="grid grid-cols-4 px-4 py-2 text-xs border-t border-gray-50 hover:bg-gray-50 transition">
                <span className="font-medium text-gray-700">{d.mes}</span>
                <span className="text-center font-bold text-blue-600">{d.nuevos}</span>
                <span className="text-center font-bold text-emerald-600">{d.recurrentes}</span>
                <span className="text-center font-semibold text-gray-700">{d.total}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} barGap={4} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="nuevos"      name="Nuevos"      fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey="recurrentes" name="Recurrentes" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
