'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, User, FileText, Activity, Calendar, Folder, ChevronRight, ArrowLeft, Phone, AlertCircle } from 'lucide-react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}
const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  AGENDADA:    { label: 'Agendada',    cls: 'bg-amber-100 text-amber-800' },
  EN_ESPERA:   { label: 'En espera',   cls: 'bg-blue-100 text-blue-800' },
  EN_CONSULTA: { label: 'En consulta', cls: 'bg-purple-100 text-purple-800' },
  COMPLETADA:  { label: 'Completada',  cls: 'bg-green-100 text-green-800' },
  NO_ASISTIO:  { label: 'No asistio',  cls: 'bg-gray-100 text-gray-600' },
  ANULADA:     { label: 'Anulada',     cls: 'bg-red-100 text-red-800' },
};
function formatFecha(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
function InfoFila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right">{value || '-'}</span>
    </div>
  );
}
function FichaPaciente({ paciente, onBack }: { paciente: any; onBack: () => void }) {
  const [citas, setCitas] = useState<any[]>([]);
  const [vitales, setVitales] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'citas'|'vitales'|'historial'|'documentos'>('citas');
  useEffect(() => {
    const cargar = async () => {
      try {
        const [cRes, vRes, hRes, dRes] = await Promise.all([
          authFetch('/api/appointments').then(r => r.json()),
          authFetch(`/api/vital-signs?patientId=${paciente.id}`).then(r => r.json()),
          authFetch(`/api/medical-records?patientId=${paciente.id}`).then(r => r.json()),
          authFetch(`/api/documents?patientId=${paciente.id}`).then(r => r.json()),
        ]);
        const todas = Array.isArray(cRes) ? cRes : [];
        setCitas(todas.filter((c: any) => c.patientId === paciente.id));
        setVitales(Array.isArray(vRes) ? vRes : []);
        setHistorial(Array.isArray(hRes) ? hRes : (Array.isArray(hRes?.data) ? hRes.data : []));
        setDocumentos(Array.isArray(dRes) ? dRes : []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, [paciente.id]);
  const ultimaConsulta = historial[0];
  const tabs = [
    { key: 'citas', label: 'Citas', count: citas.length },
    { key: 'vitales', label: 'Vitales', count: vitales.length },
    { key: 'historial', label: 'Historial', count: historial.length },
    { key: 'documentos', label: 'Documentos', count: documentos.length },
  ];
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Volver
        </button>
        <h2 className="text-lg font-bold text-gray-800">{paciente.nombre}</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Datos personales</p>
          <InfoFila label="CI" value={paciente.ci} />
          <InfoFila label="Edad" value={paciente.edad + ' anos'} />
          <InfoFila label="Genero" value={paciente.genero} />
          <InfoFila label="Telefono" value={paciente.telefono} />
          <InfoFila label="Tipo sangre" value={paciente.tipoSangre} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Historial clinico</p>
          <InfoFila label="N Historial" value={paciente.numero_historial} />
          <InfoFila label="Especialidad" value={paciente.especialidad_requerida} />
          {ultimaConsulta && <InfoFila label="Ultima consulta" value={formatFecha(ultimaConsulta.visit_date)} />}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Alertas medicas</p>
          {paciente.alergias && <InfoFila label="Alergias" value={paciente.alergias} />}
          {paciente.medicamentos && <InfoFila label="Medicamentos" value={paciente.medicamentos} />}
          {paciente.condiciones && <InfoFila label="Condiciones" value={paciente.condiciones} />}
          {!paciente.alergias && !paciente.medicamentos && !paciente.condiciones && (
            <p className="text-xs text-gray-400 text-center py-4">Sin alertas registradas</p>
          )}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-3 text-sm font-medium transition ${tab === t.key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label} {t.count > 0 && <span className="ml-1 text-xs bg-gray-100 px-1.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="p-4">
          {loading ? <p className="text-center text-gray-400 py-8 text-sm">Cargando...</p> : (
            <>
              {tab === 'citas' && (
                citas.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin citas registradas</p> :
                <div className="space-y-2">
                  {citas.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{formatFecha(c.appointment_date)}</p>
                        <p className="text-xs text-gray-400">{c.especialidad} - {c.turno}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_CONFIG[c.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                        {ESTADO_CONFIG[c.status]?.label ?? c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'vitales' && (
                vitales.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin signos vitales</p> :
                <div className="space-y-2">
                  {vitales.slice(0, 5).map((v: any) => (
                    <div key={v.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">{formatFecha(v.registradoEn)}</p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {v.presionArterial && <span>PA: {v.presionArterial}</span>}
                        {v.frecuenciaCardiaca && <span>FC: {v.frecuenciaCardiaca}</span>}
                        {v.temperatura && <span>Temp: {v.temperatura}</span>}
                        {v.saturacionOxigeno && <span>SpO2: {v.saturacionOxigeno}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'historial' && (
                historial.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin historial medico</p> :
                <div className="space-y-2">
                  {historial.slice(0, 5).map((h: any) => (
                    <div key={h.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">{h.diagnosis}</p>
                      <p className="text-xs text-gray-400">{formatFecha(h.visit_date)}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'documentos' && (
                documentos.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin documentos</p> :
                <div className="space-y-2">
                  {documentos.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText size={14} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{d.fileName ?? d.descripcion ?? 'Documento'}</p>
                        <p className="text-xs text-gray-400">{formatFecha(d.creadoEn)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export function PacientesPanel() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/patients');
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : (data.data ?? []));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  const filtrados = pacientes.filter(p =>
    p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.ci?.includes(search) ||
    p.numero_historial?.includes(search)
  );
  if (selected) return <FichaPaciente paciente={selected} onBack={() => setSelected(null)} />;
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre, CI o historial..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <button onClick={cargar} className="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition">
          Actualizar
        </button>
        <span className="text-xs text-gray-400">{filtrados.length} pacientes</span>
      </div>
      {loading ? <p className="text-center text-gray-400 py-12 text-sm">Cargando pacientes...</p> :
        filtrados.length === 0 ? <p className="text-center text-gray-400 py-12 text-sm">Sin resultados</p> :
        <div className="grid grid-cols-2 gap-3">
          {filtrados.map(p => (
            <button key={p.id} onClick={() => setSelected(p)}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.nombre}</p>
                    <p className="text-xs text-gray-400">CI: {p.ci} - Hist: {p.numero_historial ?? '-'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-300 mt-1" />
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                <span>{p.edad} anos - {p.genero}</span>
                {p.especialidad_requerida && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{p.especialidad_requerida}</span>}
              </div>
            </button>
          ))}
        </div>
      }
    </div>
  );
}