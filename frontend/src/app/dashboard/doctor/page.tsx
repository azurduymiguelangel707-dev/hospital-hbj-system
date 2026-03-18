// src/app/dashboard/doctor/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, ClipboardList, FileText, BookOpen, BarChart2, AlertTriangle, Activity } from 'lucide-react';
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
      const u = JSON.parse(localStorage.getItem('user') ?? '{}');
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
    await submitConsulta(selectedAppt.id, consultaForm);
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
            <p className="text-xs text-gray-500">
              {doctor.especialidad} Â· {new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{stats.completed}/{stats.total} completadas</span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
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
              onWeekChange={(o) => { setWeekOffset(o); getWeeklyReport(doctor.id, o).then(setWeeklyReport).catch(() => {}); }} />
          )}

        </main>
      </div>
    </div>
  );
}

// â”€â”€â”€ Sub-paneles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AgendaPanel({ appointments, selectedId, loading, onSelect, onStart, onComplete }: {
  appointments: AppointmentWithPatient[]; selectedId?: string; loading: boolean;
  onSelect: (a: AppointmentWithPatient) => void; onStart: (id: string) => void; onComplete: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all'|'pending'|'done'>('all');
  const filtered = appointments.filter(a =>
    filter === 'pending' ? a.status !== 'COMPLETADA' :
    filter === 'done' ? a.status === 'COMPLETADA' : true
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Agenda de hoy</h2>
        <div className="flex gap-1">
          {([['all','Todos'],['pending','Pendientes'],['done','Completados']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter===k?'bg-blue-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando agenda...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay citas en esta categoria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.sort((a,b) => a.appointmentTime.localeCompare(b.appointmentTime)).map(a => (
            <PatientCard key={a.id} appointment={a} selected={a.id === selectedId}
              onSelect={() => onSelect(a)} onStart={() => onStart(a.id)} onComplete={() => onComplete(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FichaPanel({ detail, loading, onIniciarConsulta, onVerDocumentos }: {
  detail: PatientDetail | null; loading: boolean;
  onIniciarConsulta: () => void; onVerDocumentos: () => void;
}) {
  if (loading) return <div className="text-center py-16 text-gray-400">Cargando ficha...</div>;
  if (!detail) return (
    <div className="text-center py-16 text-gray-400">
      <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm">Selecciona un paciente desde la agenda</p>
    </div>
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{detail.nombre}</h2>
          <p className="text-xs text-gray-500">
            {detail.historialNumero} - {detail.edad} anos - {detail.genero} - {detail.tipoSangre}
            {detail.ci ? ` - CI: ${detail.ci}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onVerDocumentos} className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">Ver documentos</button>
          <button onClick={onIniciarConsulta} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium">Iniciar consulta</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Signos vitales hoy</p>
          {detail.vitalSigns ? <VitalSignsGrid vitals={detail.vitalSigns} /> :
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-400 text-center">Sin vitales registrados</div>}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Alertas clinicas</p>
          {detail.alerts.length === 0 ?
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-400 text-center">Sin alertas activas</div> :
            detail.alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg mb-2 text-xs ${a.tipo === 'danger' ? 'bg-red-50 text-red-700' : a.tipo === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />{a.mensaje}
              </div>
            ))
          }
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Historial reciente</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
          <span>Fecha</span><span className="col-span-2">Diagnostico</span><span className="text-right">Docs</span>
        </div>
        {detail.recentRecords.length === 0 ?
          <div className="px-4 py-6 text-xs text-gray-400 text-center">Sin historial previo</div> :
          detail.recentRecords.map(r => (
            <div key={r.id} className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-gray-100 last:border-0">
              <span className="text-xs text-gray-500">{new Date(r.fecha).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</span>
              <div className="col-span-2">
                <div className="text-sm font-medium text-gray-800">{r.diagnostico}</div>
                <div className="text-xs text-gray-500 truncate">{r.tratamiento}</div>
              </div>
              <div className="text-right">
                {r.docsCount ? <button onClick={onVerDocumentos} className="text-xs text-blue-600 hover:underline">{r.docsCount} doc(s)</button> : <span className="text-xs text-gray-300">-</span>}
              </div>
            </div>
          ))
        }
      </div>
      {detail.activeMedications.length > 0 && (
        <><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Medicacion activa</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {detail.activeMedications.map((m,i) => <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{m.nombre}</span>)}
        </div></>
      )}
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
            {appointment.appointmentTime.substring(0,5)}
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

function ReportePanel({ report, weekOffset, onWeekChange }: {
  report: WeeklyReportData | null; weekOffset: number; onWeekChange: (o: number) => void;
}) {
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
            {['Semana actual','Semana pasada','Hace 2 semanas','Hace 3 semanas'].map((s,i)=><option key={i} value={i}>{s}</option>)}
          </select>
          <button className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">Exportar PDF</button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label:'Consultas', value: report.totalConsultas, color:'text-gray-800' },
          { label:'Criticos', value: report.pacientesCriticosCount, color:'text-red-600' },
          { label:'Controles pendientes', value: report.controlesPendientes, color:'text-amber-600' },
          { label:'Docs subidos', value: report.docsTotal, color:'text-green-600' },
        ].map(m => (
          <div key={m.label} className="bg-gray-50 rounded-xl p-4">
            <div className={`text-2xl font-semibold ${m.color}`}>{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Consultas por dia</p>
          <div className="space-y-2">
            {report.consultasPorDia.map(d => (
              <div key={d.dia} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-gray-500 text-xs">{d.dia}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${d.max>0?(d.count/d.max)*100:0}%` }} />
                </div>
                <span className="w-5 text-right text-xs text-gray-600">{d.count||'-'}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Diagnosticos frecuentes</p>
          <div className="space-y-2">
            {report.diagnosticosFrecuentes.length === 0 ? <p className="text-xs text-gray-400">Sin datos</p> :
              report.diagnosticosFrecuentes.map(d => (
                <div key={d.nombre} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-xs text-gray-700 truncate">{d.nombre}</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-purple-400 rounded-full" style={{ width: `${d.max>0?(d.count/d.max)*100:0}%` }} />
                  </div>
                  <span className="w-5 text-right text-xs text-gray-600">{d.count}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Imagenes', value: report.documentosSubidos.imagenes },
          { label:'Labs', value: report.documentosSubidos.labs },
          { label:'Recetas', value: report.documentosSubidos.recetas },
          { label:'Ordenes', value: report.documentosSubidos.ordenes },
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

