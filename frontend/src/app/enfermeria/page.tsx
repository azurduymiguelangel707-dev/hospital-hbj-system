// src/app/enfermeria/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Heart, Thermometer, Wind, Weight,
  AlertTriangle, CheckCircle, Clock, RefreshCw, User
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken() {
  return typeof window !== 'undefined' ? (localStorage.getItem('auth_token') ?? '') : '';
}

function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) },
  });
}

type FlowStatus = 'waiting_vitals' | 'ready' | 'in_progress' | 'completed';

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  flowStatus: FlowStatus;
  reason: string;
  isUrgent: boolean;
  patient?: { id: string; nombre: string; edad: number; ci: string; condicionesCronicas?: string[] };
  doctor?: { user?: { first_name: string; last_name: string }; specialty?: string };
  vitalSigns?: VitalSigns;
}

interface VitalSigns {
  presionArterial: string;
  frecuenciaCardiaca: number | string;
  frecuenciaRespiratoria: number | string;
  temperatura: number | string;
  peso: number | string;
  saturacionOxigeno: number | string;
}

const EMPTY_VITALS: VitalSigns = {
  presionArterial: '',
  frecuenciaCardiaca: '',
  frecuenciaRespiratoria: '',
  temperatura: '',
  peso: '',
  saturacionOxigeno: '',
};

function paStatus(val: string): 'ok' | 'warn' | 'danger' | 'neutral' {
  if (!val) return 'neutral';
  const sys = parseInt(val.split('/')[0]);
  if (sys >= 160) return 'danger';
  if (sys >= 140) return 'warn';
  return 'ok';
}

function numStatus(val: number | string, low: number, high: number): 'ok' | 'warn' | 'danger' | 'neutral' {
  if (val === '' || val === undefined) return 'neutral';
  const n = Number(val);
  if (n > high * 1.1 || n < low * 0.9) return 'danger';
  if (n > high || n < low) return 'warn';
  return 'ok';
}

const STATUS_CLASS = { ok: 'text-green-600', warn: 'text-amber-600', danger: 'text-red-600', neutral: 'text-gray-400' };
const STATUS_BG = { ok: 'bg-green-50 border-green-200', warn: 'bg-amber-50 border-amber-200', danger: 'bg-red-50 border-red-200', neutral: 'bg-gray-50 border-gray-200' };

function FlowBadge({ status }: { status: FlowStatus }) {
  const cfg = {
    waiting_vitals: { label: 'Esperando vitales', cls: 'bg-amber-100 text-amber-800' },
    ready:          { label: 'Listo p/ consulta', cls: 'bg-green-100 text-green-800' },
    in_progress:    { label: 'En consulta',        cls: 'bg-blue-100 text-blue-800' },
    completed:      { label: 'Completado',          cls: 'bg-gray-100 text-gray-600' },
  }[status];
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>;
}

export default function EnfermeriaDashboard() {
  const router = useRouter();
  const handleLogout = () => { localStorage.clear(); router.push('/login'); };
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [vitals, setVitals] = useState<VitalSigns>(EMPTY_VITALS);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [search, setSearch] = useState('');
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [enfermeraInfo, setEnfermeraInfo] = useState({ nombre: "Enfermeria", especialidad: "", fechaHoy: "" });
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user_data") ?? "{}");
      const firstName = u.nombre ?? u.firstName ?? u.first_name ?? "";
      const lastName  = u.apellido ?? u.lastName ?? u.last_name ?? "";
      const fullName  = [firstName, lastName].filter(Boolean).join(" ");
      const email = u.email ?? "";
      const espMap: Record<string,string> = { "ENF-CAR": "Cardiologia", "ENF-TRA": "Traumatologia", "ENF-NEU": "Neurologia", "ENF-OTO": "Otorrinolaringologia", "ENF-GAS": "Gastroenterologia" };
      const prefix = Object.keys(espMap).find(k => email.startsWith(k));
      const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));
      const fechaHoy = ahora.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      setEnfermeraInfo({ nombre: fullName ? `Enf. ${fullName}` : "Enfermeria", especialidad: prefix ? espMap[prefix] : "", fechaHoy });
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Obtener especialidad de la enfermera logueada
      let enfermeraEsp = "";
      try {
        const userData = JSON.parse(localStorage.getItem("user_data") ?? "{}");
        const email = userData.email ?? "";
        const espMap: Record<string, string> = {
          "ENF-CAR": "Cardiologia",
          "ENF-TRA": "Traumatologia",
          "ENF-NEU": "Neurologia",
          "ENF-OTO": "Otorrinolaringologia",
          "ENF-GAS": "Gastroenterologia",
        };
        const prefix = Object.keys(espMap).find(k => email.startsWith(k));
        if (prefix) enfermeraEsp = espMap[prefix];
      } catch {}
      const res = await authFetch("/api/appointments");
      const all: any[] = await res.json();
      const today = new Date().toISOString().split("T")[0];
      const todayAppts = all
        .filter(a => (a.appointmentDate ?? "").split("T")[0] === today)
        .filter(a => {
          if (!enfermeraEsp) return true;
          const esp = a.doctor?.specialty ?? a.especialidad ?? a.doctor?.especialidad ?? "";
          return esp.toLowerCase() === enfermeraEsp.toLowerCase();
        })
        .map(a => ({
          ...a,
          flowStatus: deriveFlow(a),
        }));
      setAppointments(todayAppts);
      try {
        const vsRes = await authFetch("/api/vital-signs");
        const allVs = vsRes.ok ? await vsRes.json() : [];
        const todayVs = Array.isArray(allVs) ? allVs.filter((v: any) => {
          const d = new Date(v.registradoEn ?? v.registrado_en ?? v.createdAt);
          return d.toISOString().split("T")[0] === today;
        }) : [];
        setVitalsHistory(todayVs);
      } catch {}
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function deriveFlow(a: any): FlowStatus {
    if (a.status === 'COMPLETADA') return 'completed';
    if (a.status === 'EN_CONSULTA') return 'in_progress';
    if (a.vitalSignsRegistered) return 'ready';
    return 'waiting_vitals';
  }

  function selectAppointment(a: Appointment) {
    setSelected(a);
    setVitals(a.vitalSigns ?? EMPTY_VITALS);
    setSavedMsg('');
  }

  async function saveVitals() {
    if (!selected) return;
    setSaving(true);
    try {
      // Guardar vitales en medical record o endpoint de vitales
      await authFetch(`/api/vital-signs`, {
        method: 'POST',
        body: JSON.stringify({
          patientId: selected.patient?.id,
          presionArterial: vitals.presionArterial,
          frecuenciaCardiaca: Number(vitals.frecuenciaCardiaca) || null,
          frecuenciaRespiratoria: Number(vitals.frecuenciaRespiratoria) || null,
          temperatura: Number(vitals.temperatura) || null,
          peso: Number(vitals.peso) || null,
          saturacionOxigeno: Number(vitals.saturacionOxigeno) || null,
        }),
      });
      // Actualizar estado a EN_ESPERA si estaba AGENDADA
      if (selected.status === 'AGENDADA') {
        await authFetch(`/api/appointments/${selected.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'EN_ESPERA' }),
        });
      }
      setSavedMsg('Signos vitales registrados correctamente');
      load();
      setTimeout(() => { setSavedMsg(''); setSelected(null); }, 3000);
    } catch (e: any) {
      setSavedMsg('Error al guardar: ' + (e.message ?? 'intenta de nuevo'));
    } finally {
      setSaving(false);
    }
  }

  const filtered = appointments.filter(a => {
    const matchFilter = filter === 'pending' ? a.status !== 'COMPLETADA' && a.status !== 'ANULADA' : filter === 'done' ? a.status === 'COMPLETADA' : true;
    const matchSearch = !search || (a.patient?.nombre ?? '').toLowerCase().includes(search.toLowerCase()) || (a.patient?.ci ?? '').includes(search);
    return matchFilter && matchSearch;
  });
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.flowStatus === 'waiting_vitals').length,
    ready: appointments.filter(a => a.flowStatus === 'ready').length,
    inProgress: appointments.filter(a => a.flowStatus === 'in_progress').length,
    completed: appointments.filter(a => a.flowStatus === 'completed').length,
  };

  function getVitalAlerts(v: VitalSigns): string[] {
    const alerts: string[] = [];
    if (v.presionArterial) {
      const sys = parseInt(v.presionArterial.split('/')[0]);
      if (sys >= 160) alerts.push('Hipertension severa');
      else if (sys >= 140) alerts.push('Presion arterial elevada');
    }
    if (Number(v.saturacionOxigeno) < 94 && v.saturacionOxigeno !== '') alerts.push('Saturacion O2 baja');
    if (Number(v.temperatura) >= 38.5) alerts.push('Fiebre alta');
    if (Number(v.frecuenciaCardiaca) > 120) alerts.push('Taquicardia');
    if (Number(v.frecuenciaCardiaca) < 50 && v.frecuenciaCardiaca !== '') alerts.push('Bradicardia');
    return alerts;
  }

  const vitalAlerts = getVitalAlerts(vitals);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
            <Activity size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{enfermeraInfo.nombre}</p>
            <p className="text-xs text-gray-500" suppressHydrationWarning>
              {enfermeraInfo.especialidad && `${enfermeraInfo.especialidad} - `}{new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" })).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
          <RefreshCw size={14} /> Actualizar
        </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar sesion
          </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        {[
          { label: 'Total hoy', value: stats.total, color: 'text-gray-700' },
          { label: 'Sin vitales', value: stats.pending, color: 'text-amber-600' },
          { label: 'Listos', value: stats.ready, color: 'text-green-600' },
          { label: 'En consulta', value: stats.inProgress, color: 'text-blue-600' },
          { label: 'Completados', value: stats.completed, color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista de pacientes */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 min-h-0">
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Buscar paciente por nombre o CI..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            {search && <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Limpiar</button>}
          </div>
          <div className="flex gap-1 p-3 border-b border-gray-100">
            {([['pending','Pendientes'],['all','Todos'],['done','Completados']] as const).map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter===k ? "bg-teal-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <User size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin pacientes</p>
              </div>
            ) : (
              filtered.map(a => (
                <div key={a.id}
                  onClick={() => selectAppointment(a)}
                  className={[
                    'border rounded-xl p-3 cursor-pointer transition-all',
                    selected?.id === a.id ? 'border-teal-500 border-2 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
                    a.isUrgent ? 'border-l-4 border-l-red-500 rounded-l-none' : '',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{a.patient?.nombre ?? 'Paciente'}</p>
                      <p className="text-xs text-gray-500">{a.patient?.edad ? `${a.patient.edad} anos` : ''}{a.patient?.ci ? ` - CI: ${a.patient.ci}` : ''}</p>
                    </div>
                    
                  </div>
                  {a.reason && <p className="text-xs text-gray-400 italic mb-1.5 truncate">{a.reason}</p>}
                  <div className="flex items-center justify-between">
                    <FlowBadge status={a.flowStatus} />
                    {a.isUrgent && <span className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertTriangle size={10} />Urgente</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel de vitales */}
        <div className="flex-1 overflow-auto p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Activity size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Selecciona un paciente</p>
              <p className="text-sm mt-1">para registrar sus signos vitales</p>
            </div>
          ) : (
            <div className="max-w-2xl">
              {/* Info paciente */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{selected.patient?.nombre}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selected.patient?.edad ? `${selected.patient.edad} anos` : ''}
                      {selected.patient?.ci ? ` - CI: ${selected.patient.ci}` : ''}
                      {selected.patient?.condicionesCronicas?.length ? ` - ${selected.patient.condicionesCronicas.join(', ')}` : ''}
                    </p>
                    {selected.reason && <p className="text-xs text-gray-400 italic mt-1">Motivo: {selected.reason}</p>}
                  </div>
                  <div className="text-right">
                    <FlowBadge status={selected.flowStatus} />
                    <p className="text-xs text-gray-500 mt-1">
                      {selected.doctor?.user ? `Dr. ${selected.doctor.user.first_name} ${selected.doctor.user.last_name}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vitales previos del paciente */}
              {vitalsHistory.filter((v: any) => v.patientId === selected.patient?.id).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Activity size={12} /> Vitales previos registrados hoy
                  </p>
                  <div className="space-y-2">
                    {vitalsHistory.filter((v: any) => v.patientId === selected.patient?.id).map((v: any, i: number) => (
                      <div key={i} className="bg-white rounded-lg px-3 py-2 grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${paStatus(v.presionArterial ?? '') === 'danger' ? 'text-red-600' : paStatus(v.presionArterial ?? '') === 'warn' ? 'text-amber-600' : 'text-blue-700'}`}>{v.presionArterial ?? '-'}</p>
                          <p className="text-xs text-gray-400">PA mmHg</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${STATUS_CLASS[numStatus(v.frecuenciaCardiaca ?? '', 60, 100)]}`}>{v.frecuenciaCardiaca ? Math.round(Number(v.frecuenciaCardiaca)) : '-'}</p>
                          <p className="text-xs text-gray-400">FC bpm</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${STATUS_CLASS[numStatus(v.temperatura ?? '', 36, 37.5)]}`}>{v.temperatura ? Number(v.temperatura).toFixed(1) : '-'}</p>
                          <p className="text-xs text-gray-400">Temp C</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${STATUS_CLASS[numStatus(v.saturacionOxigeno ?? '', 94, 100)]}`}>{v.saturacionOxigeno ? Math.round(Number(v.saturacionOxigeno)) : '-'}</p>
                          <p className="text-xs text-gray-400">SpO2 %</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-700">{v.frecuenciaRespiratoria ?? '-'}</p>
                          <p className="text-xs text-gray-400">FR rpm</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-700">{v.peso ?? '-'}</p>
                          <p className="text-xs text-gray-400">Peso kg</p>
                        </div>
                        <div className="col-span-3 text-right">
                          <p className="text-xs text-gray-400">Registrado a las {new Date(v.registradoEn ?? v.registrado_en ?? v.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas de vitales */}
              {vitalAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} /> Alertas clinicas
                  </p>
                  {vitalAlerts.map((a, i) => (
                    <p key={i} className="text-xs text-red-600">• {a}</p>
                  ))}
                </div>
              )}

              {/* Formulario vitales */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Registro de signos vitales</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* PA */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                      <Heart size={11} className="text-red-500" /> Presion Arterial (mmHg)
                    </label>
                    <input
                      value={vitals.presionArterial}
                      onChange={e => setVitals(v => ({ ...v, presionArterial: e.target.value }))}
                      placeholder="120/80"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${STATUS_BG[paStatus(vitals.presionArterial)]}`}
                    />
                  </div>
                  {/* FC */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                      <Activity size={11} className="text-blue-500" /> Frec. Cardiaca (bpm)
                    </label>
                    <input
                      type="number" value={vitals.frecuenciaCardiaca}
                      onChange={e => setVitals(v => ({ ...v, frecuenciaCardiaca: e.target.value }))}
                      placeholder="72"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${STATUS_BG[numStatus(vitals.frecuenciaCardiaca, 60, 100)]}`}
                    />
                  </div>
                  {/* Temp */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                      <Thermometer size={11} className="text-orange-500" /> Temperatura (C)
                    </label>
                    <input
                      type="number" step="0.1" value={vitals.temperatura}
                      onChange={e => setVitals(v => ({ ...v, temperatura: e.target.value }))}
                      placeholder="36.5"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${STATUS_BG[numStatus(vitals.temperatura, 36, 37.5)]}`}
                    />
                  </div>
                  {/* SpO2 */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                      <Wind size={11} className="text-cyan-500" /> Saturacion O2 (%)
                    </label>
                    <input
                      type="number" value={vitals.saturacionOxigeno}
                      onChange={e => setVitals(v => ({ ...v, saturacionOxigeno: e.target.value }))}
                      placeholder="98"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${STATUS_BG[numStatus(vitals.saturacionOxigeno, 94, 100)]}`}
                    />
                  </div>
                  {/* FR */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                      <Wind size={11} className="text-gray-400" /> Frec. Respiratoria (rpm)
                    </label>
                    <input
                      type="number" value={vitals.frecuenciaRespiratoria}
                      onChange={e => setVitals(v => ({ ...v, frecuenciaRespiratoria: e.target.value }))}
                      placeholder="16"
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${STATUS_BG[numStatus(vitals.frecuenciaRespiratoria, 12, 20)]}`}
                    />
                  </div>
                  {/* Peso */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                      <Weight size={11} className="text-gray-400" /> Peso (kg)
                    </label>
                    <input
                      type="number" step="0.1" value={vitals.peso}
                      onChange={e => setVitals(v => ({ ...v, peso: e.target.value }))}
                      placeholder="70"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50"
                    />
                  </div>
                </div>

                {/* Preview coloreado */}
                {(vitals.presionArterial || vitals.frecuenciaCardiaca || vitals.temperatura) && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: 'PA', val: vitals.presionArterial, unit: 'mmHg', st: paStatus(vitals.presionArterial) },
                      { label: 'FC', val: vitals.frecuenciaCardiaca, unit: 'bpm', st: numStatus(vitals.frecuenciaCardiaca, 60, 100) },
                      { label: 'Temp', val: vitals.temperatura, unit: 'C', st: numStatus(vitals.temperatura, 36, 37.5) },
                      { label: 'SpO2', val: vitals.saturacionOxigeno, unit: '%', st: numStatus(vitals.saturacionOxigeno, 94, 100) },
                      { label: 'FR', val: vitals.frecuenciaRespiratoria, unit: 'rpm', st: numStatus(vitals.frecuenciaRespiratoria, 12, 20) },
                      { label: 'Peso', val: vitals.peso, unit: 'kg', st: 'neutral' as const },
                    ].map(item => item.val !== '' && (
                      <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center">
                        <div className={`text-base font-semibold ${STATUS_CLASS[item.st as keyof typeof STATUS_CLASS]}`}>{item.val}</div>
                        <div className="text-xs text-gray-500">{item.label} {item.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

      {/* Panel vitales unificado */}
      {(() => {
        const pv = vitalsHistory.filter((v: any) => v.patientId === selected.patient?.id);
        const latest = pv[0];
        const paActual  = Number(String(vitals.presionArterial).split("/")[0]) || 0;
        const padActual = Number(String(vitals.presionArterial).split("/")[1]) || 0;
        const fcActual  = Number(vitals.frecuenciaCardiaca) || 0;
        const frActual  = Number(vitals.frecuenciaRespiratoria) || 0;
        const spActual  = Number(vitals.saturacionOxigeno) || 0;
        const tActual   = Number(vitals.temperatura) || 0;
        const hasActual = paActual > 0 || fcActual > 0 || spActual > 0 || tActual > 0;
        type Semaforo = "normal" | "precaucion" | "alerta" | "sin-dato";
        const semaforo = (val: number, min: number, max: number, warnLow?: number, warnHigh?: number): Semaforo => {
          if (val === 0) return "sin-dato";
          if (val < min || val > max) return "alerta";
          if (warnLow && warnHigh && (val < warnLow || val > warnHigh)) return "precaucion";
          return "normal";
        };
        const colorSemaforo: Record<Semaforo, string> = {
          "normal":    "#10b981",
          "precaucion":"#f59e0b",
          "alerta":    "#ef4444",
          "sin-dato":  "#cbd5e1",
        };
        const bgSemaforo: Record<Semaforo, string> = {
          "normal":    "#f0fdf4",
          "precaucion":"#fffbeb",
          "alerta":    "#fef2f2",
          "sin-dato":  "#f8fafc",
        };
        const labelSemaforo: Record<Semaforo, string> = {
          "normal":    "Normal",
          "precaucion":"Precaucion",
          "alerta":    "Fuera de rango",
          "sin-dato":  "Sin dato",
        };
        const signos = [
          {
            id: "pa", nombre: "Presion arterial", descripcion: "Fuerza de la sangre en las arterias",
            unidad: "mmHg", icono: "🫀",
            actual: paActual, previo: Number(String(latest?.presionArterial ?? "").split("/")[0]) || 0,
            min: 90, max: 140, warnLow: 100, warnHigh: 130,
            sufijo: padActual > 0 ? "/" + padActual : "",
          },
          {
            id: "fc", nombre: "Pulso (latidos)", descripcion: "Veces que late el corazon por minuto",
            unidad: "lpm", icono: "💓",
            actual: fcActual, previo: Number(latest?.frecuenciaCardiaca ?? 0) || 0,
            min: 60, max: 100, warnLow: 65, warnHigh: 90,
            sufijo: "",
          },
          {
            id: "sp", nombre: "Oxigeno en sangre", descripcion: "Porcentaje de oxigeno que lleva la sangre",
            unidad: "%", icono: "🫁",
            actual: spActual, previo: Number(latest?.saturacionOxigeno ?? 0) || 0,
            min: 95, max: 100, warnLow: 96, warnHigh: 100,
            sufijo: "",
          },
          {
            id: "tp", nombre: "Temperatura", descripcion: "Calor corporal — normal entre 36 y 37.5 °C",
            unidad: "°C", icono: "🌡️",
            actual: tActual, previo: Number(latest?.temperatura ?? 0) || 0,
            min: 36, max: 37.5, warnLow: 36.2, warnHigh: 37.2,
            sufijo: "",
          },
          {
            id: "fr", nombre: "Respiracion", descripcion: "Veces que respira por minuto",
            unidad: "rpm", icono: "🌬️",
            actual: frActual, previo: Number(latest?.frecuenciaRespiratoria ?? 0) || 0,
            min: 12, max: 20, warnLow: 13, warnHigh: 18,
            sufijo: "",
          },
        ];
        const histData = pv.slice(0, 6).reverse().map((v: any, i: number) => ({
          label: "Reg " + (i + 1),
          PAS:  Number(String(v.presionArterial ?? "").split("/")[0]) || 0,
          FC:   Number(v.frecuenciaCardiaca) || 0,
          SpO2: Number(v.saturacionOxigeno) || 0,
          Temp: Number(v.temperatura) || 0,
        }));
        return (
          <div className="mb-4 rounded-xl border border-gray-200 overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-teal-600 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-white" />
                <span className="text-sm font-semibold text-white">
                  Signos vitales — {selected.patient?.nombre?.split(" ").slice(0,2).join(" ")}
                </span>
              </div>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                {pv.length === 0 ? "Primer registro" : pv.length + " registro(s) previo(s)"}
              </span>
            </div>
            {/* Semaforo + barras de rango */}
            <div className="p-3 grid grid-cols-1 gap-2">
              {signos.map(s => {
                const estado = semaforo(s.actual, s.min, s.max, s.warnLow, s.warnHigh);
                const color  = colorSemaforo[estado];
                const bg     = bgSemaforo[estado];
                const label  = labelSemaforo[estado];
                const pct    = s.actual > 0 ? Math.min(((s.actual - s.min * 0.8) / (s.max * 1.2 - s.min * 0.8)) * 100, 100) : 0;
                const prevPct= s.previo > 0 ? Math.min(((s.previo - s.min * 0.8) / (s.max * 1.2 - s.min * 0.8)) * 100, 100) : 0;
                const diff   = s.actual > 0 && s.previo > 0 ? s.actual - s.previo : null;
                return (
                  <div key={s.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: color + "40", backgroundColor: bg }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{s.icono}</span>
                        <div>
                          <div className="text-xs font-semibold text-gray-700">{s.nombre}</div>
                          <div className="text-xs text-gray-400">{s.descripcion}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {s.actual > 0 ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold" style={{ color }}>{s.actual}{s.sufijo}</span>
                            <span className="text-xs text-gray-400">{s.unidad}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-300">— sin dato</span>
                        )}
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ color, backgroundColor: color + "20" }}>{label}</span>
                      </div>
                    </div>
                    {/* Barra de rango visual */}
                    <div className="relative h-3 rounded-full bg-gray-100 overflow-visible mb-1">
                      {/* zona normal */}
                      <div className="absolute h-3 rounded-full bg-emerald-100" style={{
                        left: "20%", width: "50%"
                      }} />
                      {/* valor previo */}
                      {s.previo > 0 && (
                        <div className="absolute top-0 h-3 w-1 rounded-full bg-gray-300 opacity-60" style={{ left: prevPct + "%" }} />
                      )}
                      {/* valor actual */}
                      {s.actual > 0 && (
                        <div className="absolute -top-0.5 h-4 w-2 rounded-full shadow-sm" style={{ left: "calc(" + pct + "% - 4px)", backgroundColor: color }} />
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>bajo ({s.min} {s.unidad})</span>
                      <span className="text-emerald-400 font-medium">zona normal</span>
                      <span>alto ({s.max} {s.unidad})</span>
                    </div>
                    {/* Comparativo vs anterior */}
                    {diff !== null && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400">Anterior: {s.previo} {s.unidad}</span>
                        <span className="font-semibold" style={{ color: diff > 0 ? "#ef4444" : "#10b981" }}>
                          {diff > 0 ? "▲ sube " : "▼ baja "}{Math.abs(diff).toFixed(1)}
                        </span>
                        {estado === "normal" && diff !== 0 && <span className="text-emerald-500">— sigue en rango normal</span>}
                        {estado === "alerta" && <span className="text-red-400 font-medium">— requiere atencion</span>}
                        {estado === "precaucion" && <span className="text-amber-500">— vigilar de cerca</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Tendencia historica - solo si hay mas de 1 registro */}
            {histData.length > 1 && (
              <div className="border-t border-gray-100 px-3 pt-2 pb-3">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <span>📈</span> Tendencia de los ultimos {histData.length} registros del dia
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={histData} barSize={14} barGap={3}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="PAS"  name="Presion (mmHg)"  fill="#0d9488" radius={[3,3,0,0]} />
                    <Bar dataKey="FC"   name="Pulso (lpm)"     fill="#6366f1" radius={[3,3,0,0]} />
                    <Bar dataKey="SpO2" name="Oxigeno (%)"     fill="#f59e0b" radius={[3,3,0,0]} />
                    <Bar dataKey="Temp" name="Temperatura (C)" fill="#f97316" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-teal-600"/>Presion arterial</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-indigo-500"/>Pulso</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-amber-400"/>Oxigeno en sangre</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-orange-400"/>Temperatura</span>
                </div>
              </div>
            )}
            {/* Sin registros y sin datos actuales */}
            {pv.length === 0 && !hasActual && (
              <div className="px-4 py-4 text-center">
                <div className="text-2xl mb-1">📋</div>
                <div className="text-xs font-medium text-gray-500">Ingresa los signos vitales en el formulario</div>
                <div className="text-xs text-gray-300 mt-0.5">El semaforo se activara automaticamente</div>
              </div>
            )}
          </div>
        );
      })()}

      {savedMsg && (
                <div className={`rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2 ${savedMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {savedMsg.startsWith('Error') ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                  {savedMsg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={saveVitals}
                  disabled={saving || selected.flowStatus === 'completed'}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition font-semibold text-sm"
                >
                  {saving ? 'Guardando...' : 'Registrar y marcar listo para consulta'}
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Panel derecho - alertas vitales del turno */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
            <Activity size={12} className="text-teal-600" />
            Estado del turno
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {appointments.length} pacientes · {vitalsHistory.length} registros · {appointments.filter(a => a.flowStatus === "waiting_vitals").length} sin vitales
          </p>
        </div>
        {/* Lista pacientes con semaforo */}
        <div className="flex-1 overflow-y-auto">
          {(() => {
            const sem = (val: number, min: number, max: number) => {
              if (val === 0) return { color: "#94a3b8", label: "—", dot: "bg-gray-300" };
              if (val < min || val > max) return { color: "#ef4444", label: "Alerta", dot: "bg-red-500" };
              if (val < min * 1.05 || val > max * 0.97) return { color: "#f59e0b", label: "Precaucion", dot: "bg-amber-400" };
              return { color: "#10b981", label: "Normal", dot: "bg-emerald-500" };
            };
            // agrupar ultimo vital por paciente
            const pacientes = appointments.map(a => {
              const pvs = vitalsHistory.filter((v: any) => v.patientId === a.patient?.id);
              const ultimo = pvs[0];
              const pas = Number(String(ultimo?.presionArterial ?? "").split("/")[0]) || 0;
              const fc  = Number(ultimo?.frecuenciaCardiaca ?? 0) || 0;
              const sp  = Number(ultimo?.saturacionOxigeno ?? 0) || 0;
              const tp  = Number(ultimo?.temperatura ?? 0) || 0;
              const fr  = Number(ultimo?.frecuenciaRespiratoria ?? 0) || 0;
              const estados = [
                sem(pas, 90, 140),
                sem(fc,  60, 100),
                sem(sp,  95, 100),
                sem(tp,  36, 37.5),
                sem(fr,  12, 20),
              ];
              const tieneAlerta    = estados.some(e => e.label === "Alerta");
              const tienePrecaucion= estados.some(e => e.label === "Precaucion");
              const globalColor    = tieneAlerta ? "#ef4444" : tienePrecaucion ? "#f59e0b" : ultimo ? "#10b981" : "#94a3b8";
              const globalLabel    = tieneAlerta ? "Alerta" : tienePrecaucion ? "Precaucion" : ultimo ? "Normal" : "Sin vitales";
              const globalBg       = tieneAlerta ? "#fef2f2" : tienePrecaucion ? "#fffbeb" : ultimo ? "#f0fdf4" : "#f8fafc";
              return { a, ultimo, pvs, pas, fc, sp, tp, fr, estados, globalColor, globalLabel, globalBg };
            });
            // ordenar: alertas primero
            const sorted = [...pacientes].sort((a, b) => {
              const order = { "Alerta": 0, "Precaucion": 1, "Sin vitales": 2, "Normal": 3 };
              return (order[a.globalLabel as keyof typeof order] ?? 3) - (order[b.globalLabel as keyof typeof order] ?? 3);
            });
            if (sorted.length === 0) return (
              <div className="text-center py-8 text-gray-400">
                <Activity size={28} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">Sin pacientes en el turno</p>
              </div>
            );
            return (
              <div className="divide-y divide-gray-50">
                {sorted.map(({ a, ultimo, pvs, pas, fc, sp, tp, fr, estados, globalColor, globalLabel, globalBg }, i) => (
                  <div key={i}
                    className="px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition"
                    style={{ borderLeft: "3px solid " + globalColor }}
                    onClick={() => selectAppointment(a)}
                  >
                    {/* Fila principal */}
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 leading-tight">
                          {a.patient?.nombre?.split(" ").slice(0,2).join(" ")}
                        </p>
                        <p className="text-xs text-gray-400">{a.reason ?? ""}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: globalColor, backgroundColor: globalColor + "18" }}>
                        {globalLabel}
                      </span>
                    </div>
                    {/* Semaforos compactos */}
                    {ultimo ? (
                      <div className="grid grid-cols-5 gap-1 mt-1">
                        {[
                          { icono: "🫀", val: pas > 0 ? String(ultimo.presionArterial) : "—", st: estados[0] },
                          { icono: "💓", val: fc > 0 ? fc + " lpm" : "—", st: estados[1] },
                          { icono: "🫁", val: sp > 0 ? sp + "%" : "—", st: estados[2] },
                          { icono: "🌡️", val: tp > 0 ? tp + "°" : "—", st: estados[3] },
                          { icono: "🌬️", val: fr > 0 ? fr + " rpm" : "—", st: estados[4] },
                        ].map((s, j) => (
                          <div key={j} className="rounded p-1 text-center" style={{ backgroundColor: s.st.color + "12" }}>
                            <div className="text-xs">{s.icono}</div>
                            <div className="text-xs font-medium leading-tight" style={{ color: s.st.color }}>{s.val}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"/>
                        Esperando registro de vitales
                      </div>
                    )}
                    {/* Hora ultimo registro */}
                    {ultimo && (
                      <div className="text-xs text-gray-300 mt-1">
                        {pvs.length} reg. · ultimo: {new Date(ultimo.registradoEn ?? ultimo.registrado_en ?? ultimo.createdAt).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  </div>
  );
}





