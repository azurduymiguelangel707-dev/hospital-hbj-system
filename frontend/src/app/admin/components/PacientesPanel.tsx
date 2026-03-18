'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, User, FileText, Activity, Calendar, Folder, ChevronRight, ArrowLeft, Phone, AlertCircle } from 'lucide-react';

const API = 'http://localhost:3001';
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
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500">Ficha del paciente</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <User size={28} className="text-blue-500" />
              </div>
              <h2 className="font-bold text-gray-900 text-center text-lg leading-tight">{paciente.nombre}</h2>
              <span className="text-xs text-gray-400 mt-1">N° Historial: {paciente.numeroHistorial}</span>
            </div>

            {ultimaConsulta && (
              <div className="bg-green-50 rounded-xl p-3 mb-4 border border-green-100">
                <p className="text-xs font-semibold text-green-700 mb-1">Ultimo diagnostico</p>
                <p className="text-sm text-green-900">{ultimaConsulta.diagnosis}</p>
                <p className="text-xs text-green-600 mt-1">{formatFecha(ultimaConsulta.visitDate)}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Identificacion</p>
              <InfoFila label="CI" value={paciente.ci} />
              <InfoFila label="Edad" value={paciente.edad ? `${paciente.edad} anos` : ''} />
              <InfoFila label="Genero" value={paciente.genero} />
              <InfoFila label="Tipo de sangre" value={paciente.tipoSangre} />
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Contacto</p>
              <InfoFila label="Telefono" value={paciente.telefono} />
              <InfoFila label="Direccion" value={paciente.direccion} />
            </div>

            {paciente.alergias?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Alergias</p>
                <div className="flex flex-wrap gap-1">
                  {paciente.alergias.map((a: string, i: number) => (
                    <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex border-b border-gray-100 px-4">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{t.count}</span>
                </button>
              ))}
            </div>
            <div className="p-5">
              {loading ? <div className="text-center py-16 text-gray-400">Cargando...</div> : (
                <>
                  {tab === 'citas' && (
                    <div className="space-y-3">
                      {citas.length === 0 ? <p className="text-center text-gray-400 py-10">Sin citas registradas</p> :
                        citas.map((c: any) => {
                          const est = ESTADO_CONFIG[c.status] ?? { label: c.status, cls: 'bg-gray-100 text-gray-600' };
                          return (
                            <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 hover:bg-gray-50">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Calendar size={18} className="text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{c.especialidad || 'Especialidad'}</p>
                                <p className="text-xs text-gray-400">{formatFecha(c.appointmentDate)} · {c.appointmentTime?.substring(0,5) ?? ''} · Ficha {c.numeroFicha}/{c.totalFichasTurno}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${est.cls}`}>{est.label}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  {tab === 'vitales' && (
                    <div className="space-y-3">
                      {vitales.length === 0 ? <p className="text-center text-gray-400 py-10">Sin signos vitales</p> :
                        vitales.map((v: any) => (
                          <div key={v.id} className="p-4 rounded-xl border border-gray-100">
                            <p className="text-xs text-gray-400 mb-3">{formatFecha(v.registradoEn)}</p>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: 'FC', valor: v.frecuenciaCardiaca, unidad: 'lpm', color: 'text-red-500' },
                                { label: 'FR', valor: v.frecuenciaRespiratoria, unidad: 'rpm', color: 'text-blue-500' },
                                { label: 'PA', valor: v.presionArterial, unidad: 'mmHg', color: 'text-pink-500' },
                                { label: 'Temp', valor: v.temperatura, unidad: 'C', color: 'text-amber-500' },
                                { label: 'Peso', valor: v.peso, unidad: 'kg', color: 'text-purple-500' },
                                { label: 'SatO2', valor: v.saturacionOxigeno, unidad: '%', color: 'text-green-500' },
                              ].filter(i => i.valor).map(item => (
                                <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center">
                                  <p className={`text-sm font-bold ${item.color}`}>{item.valor}</p>
                                  <p className="text-xs text-gray-400">{item.label} {item.unidad}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  {tab === 'historial' && (
                    <div className="space-y-3">
                      {historial.length === 0 ? <p className="text-center text-gray-400 py-10">Sin historial medico</p> :
                        historial.map((h: any) => (
                          <div key={h.id} className="p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400">{formatFecha(h.visitDate)}</span>
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Consulta</span>
                            </div>
                            <div className="space-y-2">
                              {h.symptoms && <div><p className="text-xs text-amber-600 font-semibold">SINTOMAS</p><p className="text-sm text-gray-700">{h.symptoms}</p></div>}
                              {h.diagnosis && <div><p className="text-xs text-green-600 font-semibold">DIAGNOSTICO</p><p className="text-sm text-gray-700">{h.diagnosis}</p></div>}
                              {h.treatment && <div><p className="text-xs text-blue-600 font-semibold">TRATAMIENTO</p><p className="text-sm text-gray-700">{h.treatment}</p></div>}
                              {h.prescriptions && <div><p className="text-xs text-purple-600 font-semibold">PRESCRIPCIONES</p><p className="text-sm text-gray-700">{h.prescriptions}</p></div>}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  {tab === 'documentos' && (
                    <div className="space-y-3">
                      {documentos.length === 0 ? <p className="text-center text-gray-400 py-10">Sin documentos</p> :
                        documentos.map((d: any) => (
                          <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 hover:bg-gray-50">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                              <Folder size={18} className="text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{d.descripcion || d.fileName}</p>
                              <p className="text-xs text-gray-400">{d.tipo} · {formatFecha(d.creadoEn)}</p>
                            </div>
                            {(d.fileUrl || d.file_url) && (
                              <button
                                onClick={() => window.open('http://localhost:3001' + (d.fileUrl ?? d.file_url), '_blank')}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium">
                                Ver
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PacientesPanel() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [filtrados, setFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<any>(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patients');
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
      setFiltrados(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!busqueda.trim()) { setFiltrados(pacientes); return; }
    const q = busqueda.toLowerCase();
    setFiltrados(pacientes.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.ci?.includes(q) ||
      p.numeroHistorial?.includes(q)
    ));
  }, [busqueda, pacientes]);

  if (seleccionado) return <FichaPaciente paciente={seleccionado} onBack={() => setSeleccionado(null)} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-sm text-gray-400 mt-1">{pacientes.length} pacientes registrados</p>
        </div>
        <button onClick={cargar} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors">
          Actualizar
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nombre, CI o N° historial..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </div>

      {loading ? <div className="text-center py-20 text-gray-400">Cargando pacientes...</div> :
        filtrados.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <User size={40} className="mb-3 opacity-30" />
            <p>Sin resultados</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 uppercase px-5 py-3">Paciente</th>
                  <th className="text-left text-xs text-gray-400 uppercase px-4 py-3">CI</th>
                  <th className="text-left text-xs text-gray-400 uppercase px-4 py-3">Historial</th>
                  <th className="text-left text-xs text-gray-400 uppercase px-4 py-3">Especialidad</th>
                  <th className="text-left text-xs text-gray-400 uppercase px-4 py-3">Registrado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSeleccionado(p)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-500">
                            {p.nombre?.split(' ').slice(0,2).map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.ci}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.numeroHistorial || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.especialidadRequerida || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatFecha(p.createdAt)}</td>
                    <td className="px-4 py-3"><ChevronRight size={16} className="text-gray-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
