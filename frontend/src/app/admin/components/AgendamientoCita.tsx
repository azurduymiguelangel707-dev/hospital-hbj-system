// src/app/admin/components/AgendamientoCita.tsx
'use client';
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Stethoscope, CheckCircle, ChevronLeft, AlertTriangle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

const ESPECIALIDADES = ['Traumatologia', 'Otorrinolaringologia', 'Cardiologia', 'Gastroenterologia', 'Neurologia'];
const TURNOS = [
  { key: 'manana', label: 'Manana', horario: '08:00 - 14:00' },
  { key: 'tarde', label: 'Tarde', horario: '15:00 - 18:00' },
];

interface Props {
  patient: any;
  onBack: () => void;
  onDone: () => void;
}

export function AgendamientoCita({ patient, onBack, onDone }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    especialidad: patient.especialidadRequerida ?? 'Cardiologia',
    turno: 'manana',
    fecha: today,
    doctorId: '',
    reason: patient.diagnosticosPresuntivos ?? '',
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [slots, setSlots] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<any>(null);
  const [error, setError] = useState('');

  // Cargar medicos por especialidad
  useEffect(() => {
    if (!form.especialidad) return;
    authFetch(`/api/doctors?specialty=${encodeURIComponent(form.especialidad)}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setDoctors(list);
        if (list.length > 0) setForm(f => ({ ...f, doctorId: list[0].id }));
      }).catch(() => setDoctors([]));
  }, [form.especialidad]);

  // Cargar slots disponibles
  useEffect(() => {
    if (!form.fecha || !form.especialidad || !form.turno) return;
    setLoadingSlots(true);
    authFetch(`/api/appointments/slots?fecha=${form.fecha}&especialidad=${encodeURIComponent(form.especialidad)}&turno=${form.turno}`)
      .then(r => r.json())
      .then(data => setSlots(data))
      .catch(() => setSlots(null))
      .finally(() => setLoadingSlots(false));
  }, [form.fecha, form.especialidad, form.turno]);

  async function handleAgendar() {
    if (!form.doctorId) { setError('Selecciona un medico'); return; }
    if (!slots || slots.fichasDisponibles <= 0) { setError('No hay fichas disponibles en este turno'); return; }
    setSaving(true); setError('');
    try {
      const res = await authFetch('/api/appointments/agendar', {
        method: 'POST',
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: form.doctorId,
          fecha: form.fecha,
          especialidad: form.especialidad,
          turno: form.turno,
          reason: form.reason,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? 'Error al agendar'); }
      const appt = await res.json();
      setSaved(appt);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  const selectedDoctor = doctors.find(d => d.id === form.doctorId);

  if (saved) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <CheckCircle size={20} className="text-green-600" />
          <h3 className="text-base font-semibold text-green-800">Cita agendada exitosamente</h3>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comprobante de cita</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'N° Ficha', value: `${saved.numeroFicha} / ${saved.totalFichasTurno}`, highlight: true },
              { label: 'N° Historial', value: patient.numeroHistorial, highlight: true },
              { label: 'Paciente', value: patient.nombre },
              { label: 'Medico', value: selectedDoctor ? `Dr. ${selectedDoctor.user?.first_name ?? ''} ${selectedDoctor.user?.last_name ?? ''}` : '-' },
              { label: 'Especialidad', value: saved.especialidad },
              { label: 'Turno', value: saved.turno === 'manana' ? 'Manana (08:00-14:00)' : 'Tarde (15:00-18:00)' },
              { label: 'Fecha', value: new Date(saved.appointmentDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Estado', value: 'AGENDADA' },
            ].map(item => (
              <div key={item.label} className={`rounded-lg px-3 py-2.5 border ${item.highlight ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className={`font-semibold ${item.highlight ? 'text-green-700 text-base' : 'text-gray-800 text-sm'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onDone}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            Nuevo registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header paciente */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User size={16} className="text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-800">{patient.nombre}</p>
            <p className="text-xs text-blue-600">CI: {patient.ci} | Historial: {patient.numeroHistorial ?? 'Sin asignar'}</p>
          </div>
        </div>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition">
          <ChevronLeft size={12} /> Cambiar paciente
        </button>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos de la cita</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Especialidad</label>
            <select value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value, doctorId: '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fecha de consulta</label>
            <input type="date" value={form.fecha} min={today}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>

        {/* Turno */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Turno</label>
          <div className="grid grid-cols-2 gap-2">
            {TURNOS.map(t => (
              <button key={t.key} onClick={() => setForm(f => ({ ...f, turno: t.key }))}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm transition ${form.turno === t.key ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>
                <Clock size={14} />
                <div className="text-left">
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs opacity-70">{t.horario}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Slots disponibles */}
        {slots && (
          <div className={`rounded-lg px-4 py-3 border text-sm ${slots.fichasDisponibles > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {loadingSlots ? (
              <p className="text-gray-500 text-xs">Verificando disponibilidad...</p>
            ) : slots.fichasDisponibles > 0 ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-700">Ficha N° {slots.proximaFicha} / {slots.totalFichas}</p>
                  <p className="text-xs text-green-600">{slots.fichasDisponibles} fichas disponibles</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: slots.totalFichas }, (_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${i < slots.fichasOcupadas ? 'bg-red-400' : i === slots.fichasOcupadas ? 'bg-green-500 ring-1 ring-green-700' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-red-700 font-medium">Turno completo — sin fichas disponibles</p>
            )}
          </div>
        )}

        {/* Medico */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Medico asignado</label>
          {doctors.length === 0 ? (
            <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle size={11} /> No hay medicos de {form.especialidad}</p>
          ) : (
            <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
              {doctors.map(d => (
                  Dr. {d.user?.first_name ?? ''} {d.user?.last_name ?? ''} - {d.specialty}
                  Dr. {d.user?.first_name ?? ''} {d.user?.last_name ?? ''} — {d.specialty}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Motivo / Diagnostico presuntivo</label>
          <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
        </div>
      </div>

      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}

      <button onClick={handleAgendar} disabled={saving || !slots || slots.fichasDisponibles <= 0}
        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm flex items-center justify-center gap-2">
        <Calendar size={15} />
        {saving ? 'Agendando...' : 'Confirmar cita medica'}
      </button>
    </div>
  );
}
