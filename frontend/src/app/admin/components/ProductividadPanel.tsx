'use client';
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Clock, Users, Target, RefreshCw, ChevronUp, ChevronDown, Minus } from 'lucide-react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string) { return fetch(API + url, { headers: { Authorization: 'Bearer ' + getToken() } }); }
interface MedicoStats { nombre: string; especialidad: string; doctorId: string; atendidos: number; pendientes: number; capacidad: number; tiempoPromedio: number; proyeccionCierre: string; }
export function ProductividadPanel() {
  const [medicos, setMedicos] = useState<MedicoStats[]>([]);
  const [totales, setTotales] = useState({ atendidos: 0, pendientes: 0, capacidad: 0, porcentaje: 0 });
  const [ayer, setAyer] = useState({ atendidos: 0, porcentaje: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const [citasRes, doctorsRes] = await Promise.all([
        authFetch('/api/appointments'),
        authFetch('/api/doctors'),
      ]);
      const todasCitas: any[] = citasRes.ok ? await citasRes.json() : [];
      const doctors: any[] = doctorsRes.ok ? await doctorsRes.json() : [];
      const citas = todasCitas.filter((c: any) => (c.appointmentDate ?? '').split('T')[0] === today);
      const citasAyer = todasCitas.filter((c: any) => (c.appointmentDate ?? '').split('T')[0] === yesterday);
      const medicoStats: MedicoStats[] = doctors.map((d: any) => {
        const citasDoc = citas.filter((c: any) => c.doctorId === d.id);
        const atendidos = citasDoc.filter((c: any) => c.status === 'COMPLETADA').length;
        const pendientes = citasDoc.filter((c: any) => ['EN_ESPERA','AGENDADA','PENDIENTE','CONFIRMADA'].includes(c.status)).length;
        const capacidad = 30;
        const tiempoPromedio = atendidos > 0 ? Math.round(420 / Math.max(atendidos, 1)) : 20;
        let proyeccion = '--:--';
        if (pendientes > 0) {
          const ahora = new Date();
          const minutos = pendientes * tiempoPromedio;
          const cierre = new Date(ahora.getTime() + minutos * 60000);
          proyeccion = cierre.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' });
        } else if (atendidos > 0) { proyeccion = 'Completado'; }
        else if (citasDoc.length === 0) { proyeccion = 'Sin citas'; }
        return { nombre: d.user ? 'Dr. ' + d.user.first_name + ' ' + d.user.last_name : 'Sin nombre', especialidad: d.specialty ?? 'General', doctorId: d.id, atendidos, pendientes, capacidad, tiempoPromedio, proyeccionCierre: proyeccion };
      }).filter((m: MedicoStats) => m.atendidos > 0 || m.pendientes > 0);
      setMedicos(medicoStats);
      const totalAtendidos = citas.filter((c: any) => c.status === 'COMPLETADA').length;
      const totalPendientes = citas.filter((c: any) => ['EN_ESPERA','AGENDADA','PENDIENTE','CONFIRMADA'].includes(c.status)).length;
      const totalCapacidad = doctors.length * 30;
      setTotales({ atendidos: totalAtendidos, pendientes: totalPendientes, capacidad: totalCapacidad, porcentaje: Math.round((totalAtendidos / Math.max(totalCapacidad, 1)) * 100) });
      const ayerAtendidos = citasAyer.filter((c: any) => c.status === 'COMPLETADA').length;
      setAyer({ atendidos: ayerAtendidos, porcentaje: Math.round((ayerAtendidos / Math.max(totalCapacidad, 1)) * 100) });
      setLastUpdate(new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' }));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const diff = totales.atendidos - ayer.atendidos;
  const TrendIcon = diff > 0 ? ChevronUp : diff < 0 ? ChevronDown : Minus;
  const trendColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {lastUpdate && <p className="text-xs text-gray-400">Actualizado a las {lastUpdate}</p>}
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 transition">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[{label:'Atendidos hoy',value:totales.atendidos,icon:Users,color:'bg-green-50 border-green-200 text-green-700'},{label:'Pendientes',value:totales.pendientes,icon:Clock,color:'bg-amber-50 border-amber-200 text-amber-700'},{label:'Capacidad max',value:totales.capacidad,icon:Target,color:'bg-gray-50 border-gray-200 text-gray-700'},{label:'Ocupacion',value:totales.porcentaje+'%',icon:TrendingUp,color:'bg-blue-50 border-blue-200 text-blue-700'}].map(item => {
          const Icon = item.icon;
          return (<div key={item.label} className={'border rounded-xl p-3 ' + item.color}><div className="flex items-center gap-1.5 mb-1"><Icon size={13} /><span className="text-xs font-medium">{item.label}</span></div><p className="text-xl font-bold">{item.value}</p></div>);
        })}
      </div>
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <div><p className="text-xs font-semibold text-gray-600">Comparativa con ayer</p><p className="text-xs text-gray-400 mt-0.5">Ayer: {ayer.atendidos} pacientes ({ayer.porcentaje}% ocupacion)</p></div>
        <div className={'flex items-center gap-1 ' + trendColor}><TrendIcon size={18} /><span className="text-sm font-bold">{Math.abs(diff)} pacientes</span></div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Progreso del dia</p>
          <p className="text-xs font-semibold text-gray-700">{totales.atendidos}/{totales.capacidad}</p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={'h-3 rounded-full transition-all ' + (totales.porcentaje >= 90 ? 'bg-green-500' : totales.porcentaje >= 50 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: totales.porcentaje + '%' }} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Productividad por medico {medicos.length === 0 ? '- sin citas hoy' : ''}</p>
        {medicos.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Sin actividad medica hoy</p>
        ) : (
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '280px' }}>
            {medicos.map((m, i) => {
              const pct = Math.round((m.atendidos / m.capacidad) * 100);
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div><p className="text-xs font-semibold text-gray-800">{m.nombre}</p><p className="text-xs text-gray-400">{m.especialidad}</p></div>
                    <div className="text-right"><p className="text-xs font-semibold text-gray-700">{m.atendidos}/{m.capacidad}</p><p className="text-xs text-gray-400">{m.pendientes} pendientes</p></div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className={'h-1.5 rounded-full transition-all ' + (pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: pct + '%' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Prom: {m.tiempoPromedio} min/paciente</span>
                    <span className={'text-xs font-medium ' + (m.proyeccionCierre === 'Completado' ? 'text-green-600' : m.proyeccionCierre === 'Sin citas' ? 'text-gray-400' : 'text-blue-600')}>
                      {m.proyeccionCierre === 'Completado' ? 'Completado' : m.proyeccionCierre === 'Sin citas' ? 'Sin citas hoy' : 'Cierre aprox: ' + m.proyeccionCierre}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
