'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, User, FileText, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(API + url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken(), ...(options.headers ?? {}) } });
}
const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  AGENDADA:    { label: 'Agendada',    cls: 'bg-amber-100 text-amber-800' },
  CONFIRMADA:  { label: 'Confirmada',  cls: 'bg-blue-100 text-blue-800' },
  EN_ESPERA:   { label: 'En espera',   cls: 'bg-blue-100 text-blue-800' },
  EN_CONSULTA: { label: 'En consulta', cls: 'bg-purple-100 text-purple-800' },
  COMPLETADA:  { label: 'Completada',  cls: 'bg-green-100 text-green-800' },
  PENDIENTE:   { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-800' },
  NO_ASISTIO:  { label: 'No asistio',  cls: 'bg-gray-100 text-gray-600' },
  CANCELADA:   { label: 'Cancelada',   cls: 'bg-red-100 text-red-800' },
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
function LineChartVitales({ datos, color, unidad, min, max }: { datos: any[]; color: string; unidad: string; min: number|null; max: number|null }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={datos} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={36} />
        <Tooltip formatter={(v: any) => [v + ' ' + unidad, 'Valor']} />
        {min !== null && <ReferenceLine y={min} stroke={color} strokeDasharray="4 2" strokeOpacity={0.4} />}
        {max !== null && <ReferenceLine y={max} stroke={color} strokeDasharray="4 2" strokeOpacity={0.4} />}
        <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
function FichaPaciente({ paciente, onBack }: { paciente: any; onBack: () => void }) {
  const [citasFull, setCitasFull] = useState<any[]>([]);
  const [vitalesHistory, setVitalesHistory] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'citas'|'vitales'|'historial'|'documentos'>('citas');
  const [metricaVital, setMetricaVital] = useState<string>('frecuenciaCardiaca');
  useEffect(() => {
    const cargar = async () => {
      try {
        const [cRes, vRes, hRes, dRes, sRes, mRes] = await Promise.all([
          authFetch('/api/patients/' + paciente.id + '/appointments/full').then(r => r.json()),
          authFetch('/api/patients/' + paciente.id + '/vitals/history').then(r => r.json()),
          authFetch('/api/medical-records?patientId=' + paciente.id).then(r => r.json()),
          authFetch('/api/documents?patientId=' + paciente.id).then(r => r.json()),
          authFetch('/api/patients/' + paciente.id + '/summary').then(r => r.json()),
          authFetch('/api/medical-records/reports/medications').then(r => r.json()),
        ]);
        setCitasFull(Array.isArray(cRes) ? cRes : []);
        setVitalesHistory(Array.isArray(vRes) ? vRes : []);
        setHistorial(Array.isArray(hRes) ? hRes : (Array.isArray(hRes?.data) ? hRes.data : []));
        setDocumentos(Array.isArray(dRes) ? dRes : []);
        setSummary(sRes && !sRes.message ? sRes : null);
        setMedicamentos(Array.isArray(mRes) ? mRes : []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, [paciente.id]);
  const proximaCita = summary?.citas?.proxima ?? null;
  const ultimaVisita = summary?.citas?.ultimaVisita ?? null;
  const alertas: any[] = summary?.alertas ?? [];
  const METRICAS = [
    { key: 'frecuenciaCardiaca', label: 'Frec. cardiaca', unidad: 'bpm', color: '#ef4444', min: 60, max: 100 },
    { key: 'temperatura', label: 'Temperatura', unidad: 'C', color: '#f97316', min: 36, max: 37.5 },
    { key: 'peso', label: 'Peso', unidad: 'kg', color: '#3b82f6', min: null, max: null },
    { key: 'saturacionOxigeno', label: 'SpO2', unidad: '%', color: '#8b5cf6', min: 95, max: 100 },
    { key: 'frecuenciaRespiratoria', label: 'Frec. resp.', unidad: 'rpm', color: '#10b981', min: 12, max: 20 },
  ];
  const metricaActual = METRICAS.find(m => m.key === metricaVital) ?? METRICAS[0];
  const datosGrafico = vitalesHistory
    .filter(v => v[metricaVital] !== null && v[metricaVital] !== undefined)
    .map(v => ({ fecha: new Date(v.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), valor: Number(v[metricaVital]) }));
  const tabs = [
    { key: 'citas', label: 'Citas', count: citasFull.length },
    { key: 'vitales', label: 'Vitales', count: vitalesHistory.length },
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
          <InfoFila label="N Historial" value={paciente.numeroHistorial} />
          <InfoFila label="Especialidad" value={paciente.especialidadRequerida} />
          {ultimaVisita && <InfoFila label="Ultima visita" value={formatFecha(ultimaVisita.fecha) + ' - ' + (ultimaVisita.especialidad ?? '')} />}
          {proximaCita && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium">Proxima cita</p>
              <p className="text-xs text-blue-800">{formatFecha(proximaCita.fecha)}{proximaCita.hora ? ' - ' + proximaCita.hora : ''}</p>
              <p className="text-xs text-blue-600">{proximaCita.especialidad} - Ficha #{proximaCita.numeroFicha}</p>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Alertas medicas</p>
          {alertas.length > 0 ? (
            <div className="space-y-1">
              {alertas.map((a: any, i: number) => (
                <div key={i} className={'flex items-center gap-2 p-1.5 rounded text-xs ' + (a.tipo === 'ALERGIA' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                  <AlertCircle size={12} />
                  <span>{a.tipo === 'ALERGIA' ? 'Alergia' : 'Condicion'}: {a.descripcion}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Sin alertas registradas</p>
          )}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={'px-4 py-3 text-sm font-medium transition ' + (tab === t.key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700')}>
              {t.label} {t.count > 0 && <span className="ml-1 text-xs bg-gray-100 px-1.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="p-4">
          {loading ? <p className="text-center text-gray-400 py-8 text-sm">Cargando...</p> : (
            <>
              {tab === 'citas' && (
                citasFull.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin citas registradas</p> :
                <div className="space-y-3">
                  {citasFull.map((c: any) => (
                    <div key={c.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-700 leading-none">{new Date(c.fecha).getDate()}</span>
                            <span className="text-xs text-blue-500 leading-none">{new Date(c.fecha).toLocaleDateString('es-ES',{month:'short'})}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{formatFecha(c.fecha)}{c.hora ? ' - ' + c.hora : ''}</p>
                            <p className="text-xs text-gray-500">{c.especialidad ?? '-'}</p>
                          </div>
                        </div>
                        <span className={'px-2.5 py-1 rounded-full text-xs font-semibold ' + (ESTADO_CONFIG[c.estado]?.cls ?? 'bg-gray-100 text-gray-600')}>
                          {ESTADO_CONFIG[c.estado]?.label ?? c.estado}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">
                        <span><span className="text-gray-400">Doctor:</span> {c.doctor?.nombre ?? 'Sin asignar'}</span>
                        <span><span className="text-gray-400">Turno:</span> {c.turno ?? '-'}</span>
                        <span><span className="text-gray-400">Ficha:</span> #{c.numeroFicha ?? '-'} / {c.totalFichasTurno ?? '-'}</span>
                      </div>
                      {c.motivo && <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">Motivo: {c.motivo}</p>}
                      {c.cancelacion && <p className="text-xs text-red-400 mt-1">Cancelada: {c.cancelacion.motivo ?? 'Sin motivo'}</p>}
                    </div>
                  ))}
                </div>
              )}
              {tab === 'vitales' && (
                <div>
                  {vitalesHistory.length > 0 && (
                    <div>
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {METRICAS.map(m => (
                          <button key={m.key} onClick={() => setMetricaVital(m.key)}
                            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition border ' + (metricaVital === m.key ? 'text-white border-transparent' : 'bg-white text-gray-500 border-gray-200')}
                            style={metricaVital === m.key ? { backgroundColor: m.color, borderColor: m.color } : {}}>
                            {m.label}
                          </button>
                        ))}
                      </div>
                      {datosGrafico.length === 0
                        ? <p className="text-center text-gray-400 py-6 text-sm">Sin datos para esta metrica</p>
                        : <LineChartVitales datos={datosGrafico} color={metricaActual.color} unidad={metricaActual.unidad} min={metricaActual.min ?? null} max={metricaActual.max ?? null} />}
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Ultimos registros</p>
                        {vitalesHistory.slice(0, 5).map((v: any, i: number) => (
                          <div key={i} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">{formatFecha(v.fecha)}</p>
                            <div className="grid grid-cols-5 gap-2 text-xs">
                              {v.presionArterial && <span className="text-gray-700">PA: <strong>{v.presionArterial}</strong></span>}
                              {v.frecuenciaCardiaca && <span className="text-gray-700">FC: <strong>{v.frecuenciaCardiaca} bpm</strong></span>}
                              {v.temperatura && <span className="text-gray-700">T: <strong>{v.temperatura}C</strong></span>}
                              {v.saturacionOxigeno && <span className="text-gray-700">SpO2: <strong>{v.saturacionOxigeno}%</strong></span>}
                              {v.peso && <span className="text-gray-700">Peso: <strong>{v.peso} kg</strong></span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {vitalesHistory.length === 0 && (
                    <p className="text-center text-gray-400 py-4 text-sm">Sin signos vitales registrados</p>
                  )}
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Top 10 medicamentos recetados</p>
                    {medicamentos.length === 0 ? <p className="text-center text-gray-400 py-4 text-sm">Sin datos de prescripciones</p> : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={medicamentos} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="medicamento" tick={{ fontSize: 11 }} width={120} />
                          <Tooltip formatter={(v: any) => [v + ' recetas', 'Cantidad']} />
                          <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
              {tab === 'historial' && (
                historial.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin historial medico</p> :
                <div className="space-y-3">
                  {historial.slice(0, 10).map((h: any) => (
                    <div key={h.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-800">{h.diagnosis}</p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatFecha(h.visit_date || h.visitDate)}</span>
                      </div>
                      {h.symptoms && <p className="text-xs text-gray-500 mt-1">Sintomas: {h.symptoms}</p>}
                      {h.treatment && <p className="text-xs text-gray-500 mt-1">Tratamiento: {h.treatment}</p>}
                      {h.prescriptions && <p className="text-xs text-blue-600 mt-1">Prescripciones: {h.prescriptions}</p>}
                      {h.follow_up_date && <p className="text-xs text-amber-600 mt-1">Seguimiento: {formatFecha(h.follow_up_date)}</p>}
                    </div>
                  ))}
                </div>
              )}
              {tab === 'documentos' && (
                documentos.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Sin documentos</p> :
                <div className="space-y-2">
                  {documentos.map((d: any) => {
                    const isImg = d.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(d.fileName ?? '');
                    const url = d.fileUrl ? (d.fileUrl.startsWith('http') ? d.fileUrl : API.replace('/api','') + d.fileUrl) : null;
                    return (
                    <div key={d.id} className="p-3 bg-gray-50 rounded-lg">
                      {isImg && url ? (
                        <img src={url} alt={d.fileName} className="w-full max-h-48 object-contain rounded mb-2 border" />
                      ) : (
                        <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-gray-400" /></div>
                      )}
                      <p className="text-sm font-medium text-gray-700">{d.fileName ?? d.descripcion ?? 'Documento'}</p>
                      <p className="text-xs text-gray-400">{formatFecha(d.creadoEn)}</p>
                    </div>
                    );
                  })}
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
    p.numeroHistorial?.includes(search)
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
        <button onClick={cargar} className="px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition">Actualizar</button>
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
                    <p className="text-xs text-gray-400">CI: {p.ci} - Hist: {p.numeroHistorial ?? '-'}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-300 mt-1" />
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                <span>{p.edad} anos - {p.genero}</span>
                {p.especialidadRequerida && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{p.especialidadRequerida}</span>}
              </div>
            </button>
          ))}
        </div>
      }
    </div>
  );
}
