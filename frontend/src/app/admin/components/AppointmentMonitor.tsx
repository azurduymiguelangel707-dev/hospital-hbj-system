'use client';
import { useState } from 'react';
import { RefreshCw, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  AGENDADA:    { label: 'Agendada',    cls: 'bg-amber-100 text-amber-800' },
  PENDIENTE:   { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-800' },
  CONFIRMADA:  { label: 'Confirmada',  cls: 'bg-blue-100 text-blue-800' },
  EN_ESPERA:   { label: 'En espera',   cls: 'bg-blue-100 text-blue-800' },
  EN_CONSULTA: { label: 'En consulta', cls: 'bg-purple-100 text-purple-800' },
  COMPLETADA:  { label: 'Completada',  cls: 'bg-green-100 text-green-800' },
  NO_ASISTIO:  { label: 'No asistio',  cls: 'bg-gray-100 text-gray-600' },
  ANULADA:     { label: 'Anulada',     cls: 'bg-red-100 text-red-800' },
  CANCELADA:   { label: 'Cancelada',   cls: 'bg-red-100 text-red-800' },
};
const ESP_CFG: Record<string, { color: string; bg: string; border: string; consultorio: string; short: string; dot: string }> = {
  Cardiologia:          { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    consultorio: 'Consultorio 1', short: 'CAR', dot: 'bg-red-500' },
  Traumatologia:        { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', consultorio: 'Consultorio 2', short: 'TRA', dot: 'bg-orange-500' },
  Neurologia:           { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', consultorio: 'Consultorio 3', short: 'NEU', dot: 'bg-purple-500' },
  Otorrinolaringologia: { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   consultorio: 'Consultorio 4', short: 'OTO', dot: 'bg-blue-500' },
  Gastroenterologia:    { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  consultorio: 'Consultorio 5', short: 'GAS', dot: 'bg-green-500' },
};
interface Appointment {
  id: string; appointmentDate: string; appointmentTime: string;
  status: string; reason: string; turno?: string;
  numeroFicha?: number; totalFichasTurno?: number; especialidad?: string;
  patient?: { nombre: string };
  doctor?: { user?: { first_name: string; last_name: string }; specialty?: string };
}
interface Props { appointments: Appointment[]; onRefresh: () => void; }
export function AppointmentMonitor({ appointments, onRefresh }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments
    .filter(a => (a.appointmentDate ?? '').split('T')[0] === today && a.status !== 'ANULADA' && a.status !== 'CANCELADA')
    .sort((a, b) => (a.numeroFicha ?? 99) - (b.numeroFicha ?? 99));
  const porEspecialidad: Record<string, Appointment[]> = {};
  for (const a of todayAppts) {
    const esp = a.especialidad ?? a.doctor?.specialty ?? 'General';
    if (!porEspecialidad[esp]) porEspecialidad[esp] = [];
    porEspecialidad[esp].push(a);
  }
  const especialidades = Object.keys(porEspecialidad).sort();
  const [filtro, setFiltro] = useState<string>('todas');
  const [expandidas, setExpandidas] = useState<Record<string, boolean>>({});
  const toggle = (esp: string) => setExpandidas(prev => ({ ...prev, [esp]: !prev[esp] }));
  const espsVisibles = filtro === 'todas' ? especialidades : especialidades.filter(e => e === filtro);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{todayAppts.length} citas programadas hoy</p>
        <button onClick={onRefresh} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition">
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => setFiltro('todas')} className={'px-3 py-1.5 rounded-lg text-xs font-medium border transition ' + (filtro === 'todas' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}>
          Todas ({todayAppts.length})
        </button>
        {especialidades.map(esp => {
          const cfg = ESP_CFG[esp] ?? { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' };
          return (
            <button key={esp} onClick={() => setFiltro(esp === filtro ? 'todas' : esp)}
              className={'px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ' + (filtro === esp ? cfg.bg + ' ' + cfg.color + ' ' + cfg.border : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}>
              <span className={'w-1.5 h-1.5 rounded-full ' + cfg.dot}></span>
              {esp} ({porEspecialidad[esp].length})
            </button>
          );
        })}
      </div>
      {todayAppts.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm border border-gray-200 rounded-xl">Sin citas para hoy</div>
      ) : (
        <div className="space-y-3">
          {espsVisibles.map(esp => {
            const citas = porEspecialidad[esp];
            const cfg = ESP_CFG[esp] ?? { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', consultorio: 'Consultorio', short: 'GEN', dot: 'bg-gray-400' };
            const doctor = citas[0]?.doctor?.user;
            const completadas = citas.filter(c => c.status === 'COMPLETADA').length;
            const progreso = Math.round((completadas / citas.length) * 100);
            const expandida = expandidas[esp] !== false;
            const manana = citas.filter(c => c.turno === 'manana');
            const tarde = citas.filter(c => c.turno === 'tarde');
            const sinTurno = citas.filter(c => !c.turno);
            return (
              <div key={esp} className={'border rounded-xl overflow-hidden ' + cfg.border}>
                <div className={'flex items-center justify-between px-4 py-3 cursor-pointer ' + cfg.bg} onClick={() => toggle(esp)}>
                  <div className="flex items-center gap-3">
                    <div className={'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ' + cfg.dot}>
                      {cfg.short}
                    </div>
                    <div>
                      <p className={'text-sm font-bold ' + cfg.color}>{esp}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin size={10} className="text-gray-400" />
                        <p className="text-xs text-gray-500">{cfg.consultorio}</p>
                        {doctor && <span className="text-xs text-gray-400">- Dr. {doctor.first_name} {doctor.last_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={'text-xs font-semibold ' + cfg.color}>{citas.length} pacientes</p>
                      <p className="text-xs text-gray-400">{completadas} completadas</p>
                    </div>
                    <div className="w-16">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: progreso + '%' }}></div>
                      </div>
                      <p className="text-xs text-gray-400 text-right mt-0.5">{progreso}%</p>
                    </div>
                    {expandida ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>
                {expandida && (
                  <div className="bg-white">
                    {[{label:'Turno Manana',items:manana,hora:'08:00 - 14:00'},{label:'Turno Tarde',items:tarde,hora:'15:00 - 18:00'},{label:'Sin turno',items:sinTurno,hora:''}].filter(t => t.items.length > 0).map(turno => (
                      <div key={turno.label}>
                        <div className="px-4 py-2 bg-gray-50 border-b border-t border-gray-100 flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">{turno.label}</span>
                          {turno.hora && <span className="text-xs text-gray-400">{turno.hora}</span>}
                          <span className="text-xs text-gray-400 ml-auto">{turno.items.length} fichas</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {turno.items.map(a => {
                            const stCfg = STATUS_CFG[a.status] ?? { label: a.status, cls: 'bg-gray-100 text-gray-600' };
                            return (
                              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition">
                                <div className={'w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 border ' + (a.status === 'COMPLETADA' ? 'bg-green-50 border-green-200' : a.status === 'EN_CONSULTA' ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200')}>
                                  <span className={'text-base font-bold leading-none ' + (a.status === 'COMPLETADA' ? 'text-green-600' : a.status === 'EN_CONSULTA' ? 'text-purple-600' : cfg.color)}>{a.numeroFicha ?? '?'}</span>
                                  <span className="text-xs text-gray-300 leading-none">/{a.totalFichasTurno ?? 15}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{a.patient?.nombre ?? 'N/A'}</p>
                                  <p className="text-xs text-gray-400 truncate">{a.reason ?? 'Sin motivo'}</p>
                                </div>
                                <span className={'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ' + stCfg.cls}>{stCfg.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
