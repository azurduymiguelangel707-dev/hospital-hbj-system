'use client';
import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, User, FileText, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';

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
function FichaPaciente({ paciente, onBack }: { paciente: any; onBack: () => void }) {
  const [citasFull, setCitasFull] = useState<any[]>([]);
  const [vitalesHistory, setVitalesHistory] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'citas'|'vitales'|'historial'|'documentos'|'grafico'>('citas');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [cRes, vRes, hRes, dRes, sRes] = await Promise.all([
          authFetch('/api/patients/' + paciente.id + '/appointments/full').then(r => r.json()),
          authFetch('/api/patients/' + paciente.id + '/vitals/history').then(r => r.json()),
          authFetch('/api/medical-records?patientId=' + paciente.id).then(r => r.json()),
          authFetch('/api/documents?patientId=' + paciente.id).then(r => r.json()),
          authFetch('/api/patients/' + paciente.id + '/summary').then(r => r.json()),
        ]);
        setCitasFull(Array.isArray(cRes) ? cRes : []);
        setVitalesHistory(Array.isArray(vRes) ? vRes : []);
        setHistorial(Array.isArray(hRes) ? hRes : (Array.isArray(hRes?.data) ? hRes.data : []));
        setDocumentos(Array.isArray(dRes) ? dRes : []);
        setSummary(sRes && !sRes.message ? sRes : null);


      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, [paciente.id]);
  const proximaCita = summary?.citas?.proxima ?? null;
  const ultimaVisita = summary?.citas?.ultimaVisita ?? null;
  const alertas: any[] = summary?.alertas ?? [];











  const tabs = [
    { key: 'citas', label: 'Citas', count: citasFull.length },
    { key: 'vitales', label: 'Vitales', count: vitalesHistory.length },
    { key: 'historial', label: 'Historial', count: historial.length },
    { key: 'documentos', label: 'Documentos', count: documentos.length },
    { key: 'grafico', label: 'Actividad clinica', count: historial.length },

  ];
  return (
    <div className="flex flex-col h-full overflow-auto">
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
                  {vitalesHistory.length === 0 ? (
                    <p className="text-center text-gray-400 py-6 text-sm">Sin signos vitales registrados</p>
                  ) : (
                    <div>
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        {[{key:'presionArterial',label:'Presion arterial',unidad:'',min:null,max:null,str:true},
                          {key:'frecuenciaCardiaca',label:'Frec. cardiaca',unidad:'bpm',min:60,max:100,str:false},
                          {key:'temperatura',label:'Temperatura',unidad:'C',min:36,max:37.5,str:false},
                          {key:'saturacionOxigeno',label:'SpO2',unidad:'%',min:95,max:100,str:false},
                          {key:'peso',label:'Peso',unidad:'kg',min:null,max:null,str:false},
                          {key:'frecuenciaRespiratoria',label:'Frec. resp.',unidad:'rpm',min:12,max:20,str:false}
                        ].map((m: any) => {
                          const ult = vitalesHistory[vitalesHistory.length-1];
                          const pen = vitalesHistory.length > 1 ? vitalesHistory[vitalesHistory.length-2] : null;
                          const val = ult ? ult[m.key] : null;
                          const valP = pen ? pen[m.key] : null;
                          const enRango = m.str || m.min===null ? null : (val!==null && Number(val)>=m.min && Number(val)<=m.max);
                          const tend = (!m.str && val!==null && valP!==null) ? (Number(val)>Number(valP)?'up':Number(val)<Number(valP)?'down':'eq') : null;
                          const bg = enRango===null?'bg-gray-50':enRango?'bg-green-50':'bg-red-50';
                          const tc = enRango===null?'text-gray-700':enRango?'text-green-700':'text-red-600';
                          const lc = enRango===null?'text-gray-400':enRango?'text-green-500':'text-red-400';
                          return (
                            <div key={m.key} className={'rounded-xl p-4 border ' + bg + (enRango===false?' border-red-100':' border-gray-100')}>
                              <p className={'text-xs uppercase tracking-wide mb-1 ' + lc}>{m.label}</p>
                              <div className="flex items-end gap-2">
                                <span className={'text-2xl font-bold ' + tc}>{val!==null&&val!==undefined?(m.str?val:Number(val).toFixed(m.unidad==='C'?1:0)):'-'}</span>
                                {m.unidad && val!==null && <span className={'text-xs ' + lc}>{m.unidad}</span>}
                                {tend==='up' && <span className="text-red-400 text-sm font-bold mb-1">↑</span>}
                                {tend==='down' && <span className="text-green-400 text-sm font-bold mb-1">↓</span>}
                              </div>
                              {m.min!==null && <p className="text-xs text-gray-300 mt-1">Normal: {m.min} - {m.max} {m.unidad}</p>}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Historial de registros</p>
                      <div className="relative">
                        <div className="absolute left-16 top-0 bottom-0 w-px bg-gray-100"></div>
                        {[...vitalesHistory].reverse().map((v: any, idx: number, arr: any[]) => {
                          const prev = arr[idx+1];
                          const chg = (k: string) => prev && prev[k]!==null && v[k]!==null && String(v[k])!==String(prev[k]);
                          const oor = (k: string, mn: number, mx: number) => v[k]!==null && v[k]!==undefined && (Number(v[k])<mn||Number(v[k])>mx);
                          return (
                            <div key={idx} className="flex gap-4 mb-3 relative">
                              <div className="w-16 flex-shrink-0 text-right pt-1">
                                <p className="text-xs text-gray-400 leading-tight">{new Date(v.fecha).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</p>
                                <p className="text-xs text-gray-300">{new Date(v.fecha).getFullYear()}</p>
                              </div>
                              <div className="w-2 h-2 rounded-full bg-blue-300 flex-shrink-0 mt-2 relative z-10"></div>
                              <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                  {v.presionArterial && <span className={'font-medium '+(chg('presionArterial')?'text-blue-600':'text-gray-500')}>PA: {v.presionArterial}</span>}
                                  {v.frecuenciaCardiaca && <span className={'font-medium '+(oor('frecuenciaCardiaca',60,100)?'text-red-500':chg('frecuenciaCardiaca')?'text-blue-600':'text-gray-500')}>FC: {Number(v.frecuenciaCardiaca).toFixed(0)} bpm</span>}
                                  {v.temperatura && <span className={'font-medium '+(oor('temperatura',36,37.5)?'text-red-500':chg('temperatura')?'text-blue-600':'text-gray-500')}>T: {Number(v.temperatura).toFixed(1)}C</span>}
                                  {v.saturacionOxigeno && <span className={'font-medium '+(oor('saturacionOxigeno',95,100)?'text-red-500':chg('saturacionOxigeno')?'text-blue-600':'text-gray-500')}>SpO2: {Number(v.saturacionOxigeno).toFixed(0)}%</span>}
                                  {v.peso && <span className={'font-medium '+(chg('peso')?'text-blue-600':'text-gray-500')}>Peso: {Number(v.peso).toFixed(1)} kg</span>}
                                  {v.frecuenciaRespiratoria && <span className={'font-medium '+(oor('frecuenciaRespiratoria',12,20)?'text-red-500':chg('frecuenciaRespiratoria')?'text-blue-600':'text-gray-500')}>FR: {Number(v.frecuenciaRespiratoria).toFixed(0)} rpm</span>}
                                </div>
                                {v.notas && <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">Nota: {v.notas}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                <div className="grid grid-cols-3 gap-4">
                  {documentos.map((d: any) => {
                    const isImg = d.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(d.fileName ?? '');
                    const isPdf = d.mimeType === 'application/pdf' || /\.pdf$/i.test(d.fileName ?? '');
                    const url = d.fileUrl ? (d.fileUrl.startsWith('http') ? d.fileUrl : API.replace('/api','') + d.fileUrl) : null;
                    const nombre = d.fileName ? d.fileName.replace(/^[0-9a-f-]{36}[-_]?/i,'').replace(/\.[^.]+$/,'') || d.fileName : (d.descripcion ?? 'Documento');
                    const ext = d.fileName ? d.fileName.split('.').pop()?.toUpperCase() : 'DOC';
                    return (
                      <div key={d.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition">
                        {isImg && url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={nombre} className="w-full h-40 object-cover" />
                          </a>
                        ) : (
                          <div className="w-full h-40 bg-gray-50 flex flex-col items-center justify-center gap-2">
                            <FileText size={32} className={isPdf ? 'text-red-400' : 'text-blue-400'} />
                            <span className={'text-xs font-bold px-2 py-0.5 rounded ' + (isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500')}>{ext}</span>
                          </div>
                        )}
                        <div className="p-3">
                          <p className="text-xs font-medium text-gray-700 truncate" title={d.fileName}>{nombre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatFecha(d.creadoEn)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
                {tab === 'grafico' && (
                  <div className='space-y-4'>
                    {/* KPIs historial */}
                    <div className='grid grid-cols-3 gap-3'>
                      {[
                        { label: 'Registros totales',  val: historial.length,                                                          color: '#3b82f6', bg: '#eff6ff' },
                        { label: 'Ultimo registro',    val: historial[0] ? new Date(historial[0].fecha ?? historial[0].createdAt).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : 'Sin registros', color: '#8b5cf6', bg: '#f5f3ff' },
                        { label: 'Estado historial',   val: historial.length > 0 ? 'Activo' : 'Sin actividad',                        color: historial.length > 0 ? '#10b981' : '#ef4444', bg: historial.length > 0 ? '#f0fdf4' : '#fef2f2' },
                      ].map((k, i) => (
                        <div key={i} className='rounded-xl p-3 text-center border' style={{ backgroundColor: k.bg, borderColor: k.color + '30' }}>
                          <div className='text-lg font-bold' style={{ color: k.color }}>{k.val}</div>
                          <div className='text-xs mt-0.5' style={{ color: k.color }}>{k.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Grafica area actividad por mes */}
                    <div className='bg-gray-50 rounded-xl p-4'>
                      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Actividad clinica — ultimos 6 meses</p>
                      {historial.length === 0 ? (
                        <div className='text-center py-8 text-gray-300'>
                          <p className='text-sm'>Sin registros en el historial</p>
                        </div>
                      ) : (() => {
                        const meses = Array.from({length: 6}, (_, i) => {
                          const d = new Date(); d.setMonth(d.getMonth() - (5-i));
                          const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
                          const label = d.toLocaleDateString('es-ES',{month:'short',year:'2-digit'});
                          const registros = historial.filter((h: any) => {
                            const hd = new Date(h.fecha ?? h.createdAt);
                            return hd.getFullYear() + '-' + String(hd.getMonth()+1).padStart(2,'0') === key;
                          }).length;
                          return { mes: label, registros, activo: registros > 0 ? registros : 0, inactivo: registros === 0 ? 1 : 0 };
                        });
                        return (
                          <ResponsiveContainer width='100%' height={180}>
                            <AreaChart data={meses} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                              <defs>
                                <linearGradient id='colorActivo' x1='0' y1='0' x2='0' y2='1'>
                                  <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.3}/>
                                  <stop offset='95%' stopColor='#3b82f6' stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray='3 3' stroke='#f3f4f6' />
                              <XAxis dataKey='mes' tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                              <Area type='monotone' dataKey='registros' name='Registros clinicos' stroke='#3b82f6' strokeWidth={2} fill='url(#colorActivo)' />
                            </AreaChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                    {/* Timeline registros */}
                    {historial.length > 0 && (
                      <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
                        <div className='px-4 py-3 bg-gray-50 border-b border-gray-100'>
                          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Ultimos registros clinicos</p>
                        </div>
                        <div className='divide-y divide-gray-50'>
                          {historial.slice(0,5).map((h: any, i: number) => (
                            <div key={i} className='flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition'>
                              <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0'>
                                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='#3b82f6' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><path d='M14 2v6h6M16 13H8M16 17H8M10 9H8'/></svg>
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='text-xs font-semibold text-gray-700 truncate'>{h.diagnostico ?? h.diagnosis ?? 'Sin diagnostico'}</p>
                                <p className='text-xs text-gray-400'>{new Date(h.fecha ?? h.createdAt).toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}</p>
                              </div>
                              <span className='text-xs text-gray-400 flex-shrink-0'>{h.doctor?.user?.first_name ? 'Dr. ' + h.doctor.user.first_name : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
export function PacientesPanel() {
  const [pacientes, setPacientes]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<any>(null);
  const [activeEsp, setActiveEsp]   = useState('Todas');

  const ESPECIALIDADES = ['Todas','Cardiologia','Traumatologia','Neurologia','Otorrinolaringologia','Gastroenterologia'];

  const ESP_COLORS: Record<string,{color:string;bg:string;border:string}> = {
    Cardiologia:          { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    Traumatologia:        { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    Neurologia:           { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    Otorrinolaringologia: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    Gastroenterologia:    { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  };

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

  const filtrados = pacientes.filter(p => {
    const matchEsp = activeEsp === 'Todas' || p.especialidadRequerida === activeEsp;
    const matchSearch = search === '' ||
      p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.ci?.includes(search) ||
      p.numeroHistorial?.includes(search);
    return matchEsp && matchSearch;
  });

  if (selected) return <FichaPaciente paciente={selected} onBack={() => setSelected(null)} />;

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {/* Header con buscador */}
      <div className='flex items-center gap-3 mb-3 flex-shrink-0'>
        <div className='relative flex-1 max-w-sm'>
          <Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
          <input type='text' placeholder='Buscar por nombre, CI o historial...'
            value={search} onChange={e => setSearch(e.target.value)}
            className='w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400' />
        </div>
        <button onClick={cargar} className='px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition'>
          Actualizar
        </button>
        <span className='text-xs text-gray-400'>{filtrados.length} pacientes</span>
      </div>

      {/* Tabs especialidad */}
      <div className='flex gap-1 flex-shrink-0 mb-3 overflow-x-auto pb-1'>
        {ESPECIALIDADES.map(esp => {
          const count = esp === 'Todas' ? pacientes.length : pacientes.filter(p => p.especialidadRequerida === esp).length;
          const cfg = ESP_COLORS[esp];
          const isActive = activeEsp === esp;
          return (
            <button key={esp} onClick={() => setActiveEsp(esp)}
              className={'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition flex-shrink-0 ' +
                (isActive ? 'text-white' : 'bg-white text-gray-600 hover:border-gray-300')}
              style={isActive ? { backgroundColor: cfg?.color ?? '#3b82f6', borderColor: cfg?.color ?? '#3b82f6' } : { borderColor: cfg?.border ?? '#e5e7eb', backgroundColor: cfg?.bg ?? '#fff' }}>
              {esp === 'Todas' ? '📋' : esp.substring(0,3).toUpperCase()}
              <span>{esp === 'Todas' ? 'Todos' : esp}</span>
              <span className={'px-1.5 py-0.5 rounded-full text-xs font-bold ' + (isActive ? 'bg-white/30' : 'bg-gray-100')}
                style={isActive ? {} : { color: cfg?.color ?? '#6b7280' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista pacientes con scroll interno */}
      {loading ? (
        <div className='flex-1 flex items-center justify-center'>
          <p className='text-gray-400 text-sm'>Cargando pacientes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className='flex-1 flex items-center justify-center'>
          <p className='text-gray-400 text-sm'>Sin pacientes{activeEsp !== 'Todas' ? ' en ' + activeEsp : ''}</p>
        </div>
      ) : (
        <div className='flex-1 overflow-auto'>
          <div className='space-y-1.5'>
            {filtrados.map(p => {
              const cfg = ESP_COLORS[p.especialidadRequerida ?? ''];
              return (
                <button key={p.id} onClick={() => setSelected(p)}
                  className='w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-left hover:border-blue-200 hover:shadow-sm transition flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white'
                    style={{ backgroundColor: cfg?.color ?? '#6b7280' }}>
                    {p.nombre?.substring(0,2).toUpperCase() ?? 'PA'}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-gray-800 truncate'>{p.nombre}</p>
                    <p className='text-xs text-gray-400'>CI: {p.ci} · Hist: {p.numeroHistorial ?? '-'} · {p.edad ?? '-'} años</p>
                  </div>
                  <div className='flex items-center gap-2 flex-shrink-0'>
                    {p.especialidadRequerida && (
                      <span className='px-2 py-1 rounded-lg text-xs font-semibold' style={{ color: cfg?.color ?? '#6b7280', backgroundColor: cfg?.bg ?? '#f9fafb', border: '1px solid ' + (cfg?.border ?? '#e5e7eb') }}>
                        {p.especialidadRequerida.substring(0,6)}
                      </span>
                    )}
                    <ChevronRight size={14} className='text-gray-300' />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
