// src/app/dashboard/doctor/page.tsx
'use client';
import { useRouter } from 'next/navigation';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, ClipboardList, FileText, BookOpen, BarChart2, AlertTriangle, Activity, Clock } from 'lucide-react';
import type {
  AppointmentWithPatient, PatientDetail, ConsultaForm,
  ClinicalDocument, WeeklyReportData, FollowUpPatient,
} from '@/lib/types/doctor.types';
import {
  getTodayAppointments, updateAppointmentStatus,
  getPatientDetail, submitConsulta,
  getPatientDocuments, getFollowUpPatients, getWeeklyReport,
} from '@/lib/api/doctor';
import { PatientCard }    from './components/PatientCard';
import { VitalSignsGrid } from './components/VitalSignsGrid';
import { DocumentsPanel } from './components/DocumentsPanel';

type Panel = 'agenda' | 'ficha' | 'consulta' | 'documentos' | 'seguimiento' | 'reporte';

function useDoctorSession() {
  const [session, setSession] = useState({ id: '', nombre: 'Dr.', especialidad: 'Medicina General' });
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user_data') ?? '{}');
      setSession({
        id: u.doctorId ?? u.id ?? '',
        nombre: u.nombre ? `Dr. ${u.nombre} ${u.apellido ?? ''}`.trim() : 'Dr.',
        especialidad: u.especialidad ?? u.specialty ?? 'Medicina General',
      });
    } catch {}
  }, []);
  return session;
}

const PANELS: { key: Panel; label: string; color: string }[] = [
  { key: 'agenda',      label: 'Agenda del dia',   color: '#378ADD' },
  { key: 'ficha',       label: 'Ficha clinica',    color: '#1D9E75' },
  { key: 'consulta',    label: 'Consulta activa',  color: '#7F77DD' },
  { key: 'documentos',  label: 'Documentos',       color: '#D85A30' },
  { key: 'seguimiento', label: 'Seguimiento',      color: '#BA7517' },
  { key: 'reporte',     label: 'Reporte semanal',  color: '#D4537E' },
];

export default function DoctorDashboard() {
  const doctor = useDoctorSession();
  const router = useRouter();
  const handleLogout = () => { localStorage.clear(); router.push('/login'); };
  const [activePanel, setActivePanel] = useState<Panel>('agenda');
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentWithPatient | null>(null);
  const [patientDetail, setPatientDetail] = useState<PatientDetail | null>(null);
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpPatient[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [consultaForm, setConsultaForm] = useState<ConsultaForm>({
    motivoConsulta: '', diagnostico: '', codigosCIE10: [],
    tratamiento: '', prescripciones: [], estudiosSolicitados: [],
    fechaControl: '', notasInternas: '',
  });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const appts = await getTodayAppointments(doctor.id);
      setAppointments(appts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [doctor.id]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  async function selectPatient(appt: AppointmentWithPatient) {
    setSelectedAppt(appt);
    if (!appt.patient?.id) return;
    setLoadingDetail(true);
    try {
      const [detail, docs] = await Promise.all([
        getPatientDetail(appt.patient.id),
        getPatientDocuments(appt.patient.id),
      ]);
      setPatientDetail(detail);
      setDocuments(docs);
      setConsultaForm((f) => ({ ...f, motivoConsulta: appt.reason ?? '' }));
    } catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  }

  async function handleStart(id: string) {
    await updateAppointmentStatus(id, 'EN_CONSULTA');
    loadAppointments();
  }

  async function handleComplete() {
    if (!selectedAppt) return;
    if (!consultaForm.diagnostico) {
      alert('Completa el diagnostico antes de sellar la consulta.');
      setActivePanel('consulta');
      return;
    }
    await submitConsulta(selectedAppt.id, consultaForm, selectedAppt.patient?.id, selectedAppt.doctorId);
    loadAppointments();
    setActivePanel('agenda');
  }

  function handlePanelChange(p: Panel) {
    setActivePanel(p);
    if (p === 'seguimiento' && !followUps.length) getFollowUpPatients(doctor.id).then(setFollowUps).catch(() => {});
    if (p === 'reporte' && !weeklyReport) getWeeklyReport(doctor.id, 0).then(setWeeklyReport).catch(() => {});
  }

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'COMPLETADA').length,
    pending: appointments.filter(a => a.status !== 'COMPLETADA' && a.status !== 'ANULADA').length,
  };
  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
            {doctor.nombre.split(' ').filter(Boolean).slice(1,3).map(w => w[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{doctor.nombre}</p>
            <p className="text-xs text-gray-500" suppressHydrationWarning>
              {doctor.especialidad} - {new Date(new Date().toLocaleString('en-US', { timeZone: 'America/La_Paz' })).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{stats.completed}/{stats.total} completadas</span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar sesion
          </button>
        </div>

      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-gray-200 flex flex-col py-4 px-3 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">Modulos</p>
          {PANELS.map(({ key, label, color }) => {
            const active = activePanel === key;
            return (
              <button key={key} onClick={() => handlePanelChange(key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-1 transition-all text-left w-full ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active ? color : '#D1D5DB' }} />
                {label}
              </button>
            );
          })}
          <div className="mt-auto pt-4 border-t border-gray-100 px-2">
            <p className="text-xs text-gray-400 mb-2">Pacientes hoy</p>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{stats.completed}/{stats.total}</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">

          {/* AGENDA */}
          {activePanel === 'agenda' && (
            <AgendaPanel appointments={appointments} selectedId={selectedAppt?.id} loading={loading}
              onSelect={(a) => { selectPatient(a); setActivePanel('ficha'); }}
              onStart={handleStart}
              onComplete={() => setActivePanel('consulta')} />
          )}

          {/* FICHA */}
          {activePanel === 'ficha' && (
            <FichaPanel detail={patientDetail} loading={loadingDetail}
              onIniciarConsulta={() => setActivePanel('consulta')}
              onVerDocumentos={() => setActivePanel('documentos')} />
          )}

          {/* CONSULTA */}
          {activePanel === 'consulta' && selectedAppt && (
            <ConsultaPanel appointment={selectedAppt} patientDetail={patientDetail}
              form={consultaForm} onChange={setConsultaForm}
              onComplete={handleComplete}
              onAdjuntarDocs={() => setActivePanel('documentos')} />
          )}
          {activePanel === 'consulta' && !selectedAppt && (
            <div className="text-center py-16 text-gray-400">
              <Activity size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona un paciente desde la agenda primero</p>
            </div>
          )}

          {/* DOCUMENTOS */}
          {activePanel === 'documentos' && patientDetail && (
            <DocumentsPanel
              patientId={patientDetail.id} patientName={patientDetail.nombre}
              historialNumero={patientDetail.historialNumero}
              appointments={patientDetail.recentRecords.map(r => ({ id: r.id, fecha: r.fecha, diagnostico: r.diagnostico }))}
              documents={documents} currentAppointmentId={selectedAppt?.id}
              onDocUploaded={(d) => setDocuments(prev => [d, ...prev])}
              onDocDeleted={(id) => setDocuments(prev => prev.filter(d => d.id !== id))} />
          )}
          {activePanel === 'documentos' && !patientDetail && (
            <div className="text-center py-16 text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecciona un paciente desde la agenda primero</p>
            </div>
          )}

          {/* SEGUIMIENTO */}
          {activePanel === 'seguimiento' && (
            <SeguimientoPanel followUps={followUps}
              onRefresh={() => getFollowUpPatients(doctor.id).then(setFollowUps).catch(() => {})} />
          )}

          {/* REPORTE */}
          {activePanel === 'reporte' && (
            <ReportePanel report={weeklyReport} weekOffset={weekOffset}
              onWeekChange={(o: number) => { setWeekOffset(o); getWeeklyReport(doctor.id, o).then(setWeeklyReport).catch(() => {}); }} />
          )}

        </main>
      </div>
    </div>
  );
}

// --- Sub-paneles ---

function AgendaPanel({ appointments, selectedId, loading, onSelect, onStart, onComplete }: {
  appointments: AppointmentWithPatient[]; selectedId?: string; loading: boolean;
  onSelect: (a: AppointmentWithPatient) => void; onStart: (id: string) => void; onComplete: () => void;
}) {
  const [filter, setFilter] = useState<"all"|"pending"|"done"|"ready">("all");
  const filtered = appointments.filter(a =>
    filter === "pending" ? (a.status !== "COMPLETADA" && a.flowStatus === "waiting_vitals") :
    filter === "ready"   ? (a.flowStatus === "ready" || a.flowStatus === "in_progress") :
    filter === "done"    ? a.status === "COMPLETADA" : true
  ).sort((a, b) => (a.appointmentTime ?? "").localeCompare(b.appointmentTime ?? ""));

  const stats = {
    total:     appointments.length,
    completed: appointments.filter(a => a.status === "COMPLETADA").length,
    ready:     appointments.filter(a => a.flowStatus === "ready").length,
    inProgress:appointments.filter(a => a.flowStatus === "in_progress").length,
    waiting:   appointments.filter(a => a.flowStatus === "waiting_vitals").length,
    urgent:    appointments.filter(a => a.isUrgent).length,
  };
  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const next = appointments.find(a => a.flowStatus === "ready" || a.flowStatus === "in_progress");

  return (
    <div className="flex gap-5 h-full">
      {/* Columna izquierda - lista citas */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Agenda de hoy</h2>
            <p className="text-xs text-gray-400">{stats.completed} de {stats.total} consultas completadas</p>
          </div>
          <div className="flex gap-1">
            {([
              ["all",     "Todas",          stats.total],
              ["ready",   "Con vitales",    stats.ready + stats.inProgress],
              ["pending", "Sin vitales",    stats.waiting],
              ["done",    "Completadas",    stats.completed],
            ] as const).map(([k, l, n]) => (
              <button key={k} onClick={() => setFilter(k as typeof filter)}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 " +
                  (filter === k ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300")}
              >
                {l}
                <span className={"px-1.5 py-0.5 rounded-full text-xs " + (filter === k ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                  {n}
                </span>
              </button>
            ))}
          </div>
        </div>
        {/* Lista */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Cargando agenda...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay citas en esta categoria</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <PatientCard key={a.id} appointment={a} selected={a.id === selectedId}
                onSelect={() => onSelect(a)} onStart={() => onStart(a.id)} onComplete={() => onComplete()} />
            ))}
          </div>
        )}
      </div>

      {/* Columna derecha - resumen turno */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Progreso del turno */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Progreso del turno</p>
          <div className="flex items-end justify-between mb-2">
            <span className="text-3xl font-bold text-gray-800">{progress}%</span>
            <span className="text-xs text-gray-400">{stats.completed}/{stats.total} citas</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: progress + "%" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Con vitales",  val: stats.ready,      color: "#10b981", bg: "#f0fdf4" },
              { label: "En consulta",  val: stats.inProgress, color: "#3b82f6", bg: "#eff6ff" },
              { label: "Sin vitales",  val: stats.waiting,    color: "#f59e0b", bg: "#fffbeb" },
              { label: "Completadas",  val: stats.completed,  color: "#6b7280", bg: "#f9fafb" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: s.bg }}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
          {stats.urgent > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600 font-medium">{stats.urgent} paciente(s) urgente(s)</span>
            </div>
          )}
        </div>

        {/* Proximo paciente */}
        {next && (
          <div className="bg-white rounded-xl border border-emerald-200 p-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {next.flowStatus === "in_progress" ? "En consulta ahora" : "Siguiente paciente"}
            </p>
            <p className="text-sm font-semibold text-gray-800">{next.patient?.nombre?.split(" ").slice(0,2).join(" ")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{next.reason}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock size={11} />
              <span>{next.appointmentTime?.substring(0,5)}</span>
              {next.patient?.edad && <span>· {next.patient.edad} anos</span>}
            </div>
            <button
              onClick={() => onSelect(next)}
              className="mt-3 w-full px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              {next.flowStatus === "in_progress" ? "Continuar consulta" : "Iniciar consulta"}
            </button>
          </div>
        )}

        {/* Lista rapida orden del dia */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Orden del dia</p>
          <div className="space-y-1.5">
            {appointments.sort((a,b) => (a.appointmentTime ?? "").localeCompare(b.appointmentTime ?? "")).map((a, i) => {
              const flow = {
                waiting_vitals: { dot: "bg-amber-400", text: "text-amber-600" },
                ready:          { dot: "bg-emerald-500", text: "text-emerald-600" },
                in_progress:    { dot: "bg-blue-500", text: "text-blue-600" },
                completed:      { dot: "bg-gray-300", text: "text-gray-400" },
              }[a.flowStatus];
              return (
                <div key={i}
                  onClick={() => onSelect(a)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                >
                  <span className={"w-2 h-2 rounded-full flex-shrink-0 " + flow.dot} />
                  <span className="text-xs font-mono text-gray-400 w-10 flex-shrink-0">{a.appointmentTime?.substring(0,5)}</span>
                  <span className={"text-xs font-medium truncate flex-1 " + (a.id === selectedId ? "text-blue-600" : "text-gray-700")}>
                    {a.patient?.nombre?.split(" ").slice(0,2).join(" ")}
                  </span>
                  {a.isUrgent && <AlertTriangle size={10} className="text-red-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FichaPanel({ detail, loading, onIniciarConsulta, onVerDocumentos }: {
  detail: PatientDetail | null; loading: boolean;
  onIniciarConsulta: () => void; onVerDocumentos: () => void;
}) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  if (loading) return <div className="text-center py-16 text-gray-400">Cargando ficha...</div>;
  if (!detail) return (
    <div className="text-center py-16 text-gray-400">
      <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">Selecciona un paciente desde la agenda</p>
    </div>
  );

  const semaforo = (val: number, min: number, max: number) => {
    if (val === 0) return { color: "#94a3b8", bg: "#f8fafc", label: "Sin dato" };
    if (val < min || val > max) return { color: "#ef4444", bg: "#fef2f2", label: "Fuera de rango" };
    if (val < min * 1.05 || val > max * 0.97) return { color: "#f59e0b", bg: "#fffbeb", label: "Precaucion" };
    return { color: "#10b981", bg: "#f0fdf4", label: "Normal" };
  };

  const vs = detail.vitalSigns;
  const paVal = Number(String(vs?.presionArterial ?? "").split("/")[0]) || 0;
  const signos = vs ? [
    { nombre: "Presion arterial", icono: "🫀", val: paVal,                       unidad: "mmHg", min: 90,  max: 140, extra: vs.presionArterial },
    { nombre: "Pulso",            icono: "💓", val: Number(vs.frecuenciaCardiaca)||0, unidad: "lpm",  min: 60,  max: 100 },
    { nombre: "Oxigeno en sangre",icono: "🫁", val: Number(vs.saturacionOxigeno)||0, unidad: "%",    min: 95,  max: 100 },
    { nombre: "Temperatura",      icono: "🌡️", val: Number(vs.temperatura)||0,       unidad: "°C",   min: 36,  max: 37.5 },
    { nombre: "Respiracion",      icono: "🌬️", val: Number(vs.frecuenciaRespiratoria)||0, unidad: "rpm", min: 12, max: 20 },
    { nombre: "Peso",             icono: "⚖️", val: Number(vs.peso)||0,               unidad: "kg",   min: 40,  max: 120 },
  ] : [];

  const alertColor: Record<string,string> = { danger: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
  const alertBg:    Record<string,string> = { danger: "#fef2f2", warning: "#fffbeb", info: "#eff6ff" };

  const initials = detail.nombre.split(" ").filter(Boolean).slice(0,2).map((w:string) => w[0]).join("");

  return (
    <div className="flex gap-5">
      {/* Columna izquierda */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header paciente */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{detail.nombre}</h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    { label: detail.historialNumero, color: "#3b82f6" },
                    { label: detail.edad + " anos",  color: "#6b7280" },
                    { label: detail.genero,          color: "#6b7280" },
                    { label: detail.tipoSangre,      color: "#ef4444" },
                    detail.ci ? { label: "CI: " + detail.ci, color: "#6b7280" } : null,
                    detail.telefono ? { label: "📞 " + detail.telefono, color: "#10b981" } : null,
                  ].filter(Boolean).map((chip: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: chip.color, backgroundColor: chip.color + "15", border: "1px solid " + chip.color + "30" }}>
                      {chip.label}
                    </span>
                  ))}
                </div>
                {detail.condicionesCronicas && detail.condicionesCronicas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {detail.condicionesCronicas.map((c: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={onVerDocumentos} className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition">
                Ver documentos
              </button>
              <button onClick={onIniciarConsulta} className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
                Iniciar consulta
              </button>
            </div>
          </div>
        </div>

        {/* Vitales con semaforo */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Signos vitales recientes</p>
          {!vs ? (
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-400 text-center">Sin vitales registrados hoy</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {signos.map((s, i) => {
                const st = semaforo(s.val, s.min, s.max);
                const pct = s.val > 0 ? Math.min(((s.val - s.min * 0.8) / (s.max * 1.2 - s.min * 0.8)) * 100, 100) : 0;
                return (
                  <div key={i} className="rounded-lg border px-3 py-2" style={{ borderColor: st.color + "30", backgroundColor: st.bg }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{s.icono}</span>
                        <span className="text-xs text-gray-600 font-medium">{s.nombre}</span>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ color: st.color, backgroundColor: st.color + "20" }}>{st.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-xl font-bold" style={{ color: st.color }}>{s.extra ?? (s.val || "—")}</span>
                      <span className="text-xs text-gray-400">{s.unidad}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="absolute h-1.5 bg-emerald-200 rounded-full" style={{ left: "20%", width: "45%" }} />
                      {s.val > 0 && <div className="absolute h-1.5 w-2 rounded-full" style={{ left: "calc(" + pct + "% - 4px)", backgroundColor: st.color }} />}
                    </div>
                    <div className="text-xs text-gray-300 mt-0.5">rango: {s.min}–{s.max} {s.unidad}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Historial reciente */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial reciente</p>
          </div>
          {detail.recentRecords.length === 0 ? (
            <div className="px-4 py-6 text-xs text-gray-400 text-center">Sin historial previo</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {detail.recentRecords.map(r => (
                <div key={r.id} className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer" onClick={() => setExpandedRecord(expandedRecord === r.id ? null : r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400 font-mono">{new Date(r.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        {r.medicoNombre && <span className="text-xs text-blue-500">Dr. {r.medicoNombre}</span>}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{r.diagnostico}</p>
                      {expandedRecord === r.id && (
                        <div className="mt-2 space-y-1.5">
                          {r.tratamiento && <p className="text-xs text-gray-600"><span className="font-medium">Tratamiento:</span> {r.tratamiento}</p>}
                          {r.medicamentos && <p className="text-xs text-gray-600"><span className="font-medium">Medicamentos:</span> {r.medicamentos}</p>}
                          {r.notasInternas && <p className="text-xs text-gray-400 italic">{r.notasInternas}</p>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.docsCount ? (
                        <button onClick={(e) => { e.stopPropagation(); onVerDocumentos(); }} className="text-xs text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded-lg">
                          {r.docsCount} doc(s)
                        </button>
                      ) : null}
                      <span className="text-gray-300 text-xs">{expandedRecord === r.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna derecha */}
      <div className="w-72 flex-shrink-0 space-y-4">

        {/* Alertas clinicas */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alertas clinicas</p>
            <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (detail.alerts.length > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
              {detail.alerts.length > 0 ? detail.alerts.length + " alerta(s)" : "Sin alertas"}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {detail.alerts.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
                <span className="text-base">✅</span>
                <span className="text-xs text-emerald-700 font-medium">Paciente sin alertas activas</span>
              </div>
            ) : (
              detail.alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: alertBg[a.tipo], color: alertColor[a.tipo] }}>
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{a.mensaje}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medicacion activa */}
        {detail.activeMedications.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicacion activa</p>
            </div>
            <div className="p-3 space-y-2">
              {detail.activeMedications.map((m, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-base">💊</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-800">{m.nombre}</p>
                    <p className="text-xs text-blue-600">{m.dosis} · {m.frecuencia}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proximos controles */}
        {detail.upcomingControls.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proximos controles</p>
            </div>
            <div className="p-3 space-y-2">
              {detail.upcomingControls.map((u, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-base">📅</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">{u.titulo}</p>
                    <p className="text-xs text-amber-600">{u.tipo} · {new Date(u.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones rapidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acciones rapidas</p>
          <button onClick={onIniciarConsulta} className="w-full px-3 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <ClipboardList size={13} /> Iniciar consulta
          </button>
          <button onClick={onVerDocumentos} className="w-full px-3 py-2.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <FileText size={13} /> Ver documentos
          </button>
        </div>
      </div>
    </div>
  );
}

function ConsultaPanel({ appointment, patientDetail, form, onChange, onComplete, onAdjuntarDocs }: {
  appointment: AppointmentWithPatient; patientDetail: PatientDetail | null;
  form: ConsultaForm; onChange: (f: ConsultaForm) => void;
  onComplete: () => void; onAdjuntarDocs: () => void;
}) {
  const alergia = patientDetail?.alerts.find(a => a.tipo === 'danger');
  const ESTUDIOS = ['ECG','Glucemia','HbA1c','Perfil lipidico','Ecocardiograma','Radiografia torax','Hemograma'];
  function set<K extends keyof ConsultaForm>(k: K, v: ConsultaForm[K]) { onChange({ ...form, [k]: v }); }
  function toggleEstudio(e: string) {
    set('estudiosSolicitados', form.estudiosSolicitados.includes(e) ? form.estudiosSolicitados.filter(x=>x!==e) : [...form.estudiosSolicitados, e]);
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Consulta activa - {patientDetail?.nombre ?? 'Paciente'}</h2>
          <p className="text-xs text-gray-500">
            {(appointment.appointmentTime ?? '--:--').substring(0,5)}
            {alergia ? ` - Alerta: ${alergia.mensaje}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onAdjuntarDocs} className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">Adjuntar docs</button>
          <button onClick={onComplete} className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-medium">Completar y sellar</button>
        </div>
      </div>
      {alergia && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700 flex items-center gap-2 mb-4">
          <AlertTriangle size={14} /> {alergia.mensaje}
        </div>
      )}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Motivo de consulta</label>
            <textarea value={form.motivoConsulta} onChange={e=>set('motivoConsulta',e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" placeholder="Motivo..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Diagnostico *</label>
            <input value={form.diagnostico} onChange={e=>set('diagnostico',e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Diagnostico principal..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Tratamiento</label>
            <textarea value={form.tratamiento} onChange={e=>set('tratamiento',e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" placeholder="Tratamiento indicado..." />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Notas internas</label>
            <textarea value={form.notasInternas} onChange={e=>set('notasInternas',e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-500" placeholder="Notas privadas (no visibles al paciente)..." />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Prescripcion</label>
            <div className="border border-gray-200 rounded-xl p-3 space-y-2">
              {form.prescripciones.length === 0 ?
                <p className="text-xs text-gray-400 text-center py-2">Sin medicamentos agregados</p> :
                form.prescripciones.map((p,i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-medium">{p.medicamento}</span>
                    <span className="text-gray-500">{p.dosis} - {p.duracion}</span>
                  </div>
                ))
              }
              <button onClick={() => {
                const med = prompt('Medicamento (ej: Losartan 100mg):');
                const dosis = prompt('Dosis (ej: 1/dia):');
                const dur = prompt('Duracion (ej: 30 dias):');
                if (med) set('prescripciones', [...form.prescripciones, { medicamento: med, dosis: dosis??'', duracion: dur??'' }]);
              }} className="w-full border border-dashed border-gray-300 text-xs text-gray-500 rounded-lg py-2 hover:bg-gray-50 transition">
                + Agregar medicamento
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Proximo control</label>
            <input type="date" value={form.fechaControl} onChange={e=>set('fechaControl',e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Solicitar estudios</label>
            <div className="flex flex-wrap gap-2">
              {ESTUDIOS.map(e => (
                <button key={e} onClick={() => toggleEstudio(e)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${form.estudiosSolicitados.includes(e) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeguimientoPanel({ followUps, onRefresh }: { followUps: FollowUpPatient[]; onRefresh: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Seguimiento de pacientes</h2>
        <button onClick={onRefresh} className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">Actualizar</button>
      </div>
      {followUps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin pacientes pendientes de seguimiento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map(f => (
            <div key={f.id} className={`border rounded-xl px-4 py-3 ${f.severidad==='danger'?'border-red-200 bg-red-50':'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${f.severidad==='danger'?'text-red-800':'text-amber-800'}`}>{f.nombre} - {f.diagnostico}</p>
                  <p className={`text-xs mt-0.5 ${f.severidad==='danger'?'text-red-600':'text-amber-600'}`}>{f.motivo}{f.diasVencido ? ` - Vencido hace ${f.diasVencido} dias` : ''}</p>
                </div>
                <button className="px-3 py-1.5 bg-white border border-gray-300 text-xs rounded-lg hover:bg-gray-50 transition">Agendar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportePanel({ report, weekOffset, onWeekChange }: any) {
  if (!report) return <div className="text-center py-16 text-gray-400">Cargando reporte...</div>;
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Reporte semanal</h2>
          <p className="text-xs text-gray-500">{report.semana}</p>
        </div>
        <div className="flex gap-2">
          <select value={weekOffset} onChange={e=>onWeekChange(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
            {["Semana actual","Semana pasada","Hace 2 semanas","Hace 3 semanas"].map((s,i)=><option key={i} value={i}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:"Pacientes atendidos", value: report.pacientesAtendidos, color:"blue" },
          { label:"Consultas completadas", value: report.consultasCompletadas, color:"green" },
          { label:"Canceladas", value: report.canceladas, color:"red" },
          { label:"Pendientes", value: report.pendientes, color:"amber" },
        ].map(m => (
          <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Documentos subidos</p>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:"Imagenes", value: report.documentosSubidos.imagenes },
          { label:"Labs", value: report.documentosSubidos.labs },
          { label:"Recetas", value: report.documentosSubidos.recetas },
          { label:"Ordenes", value: report.documentosSubidos.ordenes },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xl font-semibold text-gray-700">{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}



