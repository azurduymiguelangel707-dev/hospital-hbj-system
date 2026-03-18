// src/app/admin/components/OperationalMonitor.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { Clock, Activity, UserCheck, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

const API = 'process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'';
function getToken() {
  return typeof window !== 'undefined' ? (localStorage.getItem('auth_token') ?? '') : '';
}
function authFetch(url: string) {
  return fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

interface FlujoPacientes { enEspera: number; enConsulta: number; atendidosHoy: number; tiempoPromedioEspera: number; }
interface OcupacionEspecialidad { nombre: string; ocupados: number; total: number; }
interface AlertaOperativa { tipo: 'warning' | 'info'; mensaje: string; detalle?: string; }
interface ActividadReciente { tipo: 'registro' | 'agendamiento'; descripcion: string; hora: string; }

export function OperationalMonitor() {
  const [flujo, setFlujo] = useState<FlujoPacientes>({ enEspera: 0, enConsulta: 0, atendidosHoy: 0, tiempoPromedioEspera: 0 });
  const [ocupacion, setOcupacion] = useState<OcupacionEspecialidad[]>([]);
  const [alertas, setAlertas] = useState<AlertaOperativa[]>([]);
  const [actividad, setActividad] = useState<ActividadReciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [citasRes, patientsRes, usersRes] = await Promise.all([
        authFetch('/api/appointments?fecha=' + today),
        authFetch('/api/patients'),
        authFetch('/api/users/stats'),
      ]);
      const citas = citasRes.ok ? await citasRes.json() : [];
      const patients = patientsRes.ok ? await patientsRes.json() : [];
      const usersStats = usersRes.ok ? await usersRes.json() : {};

      const enEspera = citas.filter((c: any) => c.status === 'EN_ESPERA' || c.status === 'AGENDADA').length;
      const enConsulta = citas.filter((c: any) => c.status === 'EN_CONSULTA').length;
      const atendidosHoy = citas.filter((c: any) => c.status === 'COMPLETADA').length;
      setFlujo({ enEspera, enConsulta, atendidosHoy, tiempoPromedioEspera: enEspera > 0 ? 20 : 0 });

      const especialidades = ['Cardiologia', 'Traumatologia', 'Neurologia', 'Otorrinolaringologia', 'Gastroenterologia'];
      setOcupacion(especialidades.map(esp => ({
        nombre: esp, ocupados: citas.filter((c: any) => c.especialidad === esp).length, total: 15,
      })));

      const nuevasAlertas: AlertaOperativa[] = [];
      const medicosConCitas = new Set(citas.map((c: any) => c.doctorId));
      const totalMedicos = usersStats.medicos ?? 5;
      if (medicosConCitas.size < totalMedicos) {
        nuevasAlertas.push({ tipo: 'warning', mensaje: `${totalMedicos - medicosConCitas.size} medico(s) sin citas asignadas hoy`, detalle: 'Revisar agenda medica' });
      }
      const sinCita = Array.isArray(patients) ? patients.filter((p: any) => !citas.some((c: any) => c.patientId === p.id)).length : 0;
      if (sinCita > 0) {
        nuevasAlertas.push({ tipo: 'info', mensaje: `${sinCita} paciente(s) con historial sin cita asignada`, detalle: 'Pueden requerir agendamiento' });
      }
      if (nuevasAlertas.length === 0) {
        nuevasAlertas.push({ tipo: 'info', mensaje: 'Sin alertas operativas activas', detalle: 'Todo en orden' });
      }
      setAlertas(nuevasAlertas);

      const actividadData: ActividadReciente[] = [];
      [...citas].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4).forEach((c: any) => {
        actividadData.push({ tipo: 'agendamiento', descripcion: `Cita agendada - ${c.patient?.nombre ?? 'Paciente'} - ${c.especialidad ?? 'General'}`, hora: new Date(c.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });
      });
      (Array.isArray(patients) ? [...patients].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4) : []).forEach((p: any) => {
        actividadData.push({ tipo: 'registro', descripcion: `Paciente registrado - ${p.nombre ?? 'Nuevo paciente'}`, hora: new Date(p.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) });
      });
      setActividad(actividadData.sort((a, b) => b.hora.localeCompare(a.hora)).slice(0, 8));
      setLastUpdate(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getPct = (o: number, t: number) => Math.round((o / t) * 100);
  const getColorBarra = (p: number) => p >= 90 ? 'bg-red-500' : p >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const getColorTexto = (p: number) => p >= 90 ? 'text-red-600' : p >= 70 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Monitor Operativo</h3>
          {lastUpdate && <p className="text-xs text-gray-400">Actualizado a las {lastUpdate}</p>}
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 transition">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Flujo de pacientes hoy</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'En espera', value: flujo.enEspera, icon: Clock, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'En consulta', value: flujo.enConsulta, icon: Activity, color: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Atendidos', value: flujo.atendidosHoy, icon: UserCheck, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { label: 'Espera prom.', value: `${flujo.tiempoPromedioEspera}min`, icon: TrendingUp, color: 'bg-gray-50 border-gray-200 text-gray-700' },
          ].map(item => { const Icon = item.icon; return (
            <div key={item.label} className={`border rounded-xl p-3 ${item.color}`}>
              <div className="flex items-center gap-1.5 mb-1"><Icon size={13} /><span className="text-xs font-medium">{item.label}</span></div>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          ); })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ocupacion por especialidad</p>
        <div className="space-y-2">
          {ocupacion.map(esp => { const pct = getPct(esp.ocupados, esp.total); return (
            <div key={esp.nombre} className="bg-white border border-gray-100 rounded-xl px-4 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">{esp.nombre}</span>
                <span className={`text-xs font-semibold ${getColorTexto(pct)}`}>{esp.ocupados}/{esp.total} cupos</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all ${getColorBarra(pct)}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ); })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alertas operativas</p>
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${a.tipo === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${a.tipo === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
              <div>
                <p className={`text-xs font-semibold ${a.tipo === 'warning' ? 'text-amber-800' : 'text-blue-800'}`}>{a.mensaje}</p>
                {a.detalle && <p className={`text-xs ${a.tipo === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>{a.detalle}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Actividad reciente</p>
        <div className="space-y-1.5">
          {actividad.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Sin actividad registrada hoy</p>
          ) : actividad.map((a, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-100 rounded-lg">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${a.tipo === 'registro' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {a.tipo === 'registro' ? 'Registro' : 'Agendamiento'}
              </span>
              <span className="text-xs text-gray-600 flex-1 truncate">{a.descripcion}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{a.hora}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}