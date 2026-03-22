'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  AGENDADA:    { label: 'Agendada',    color: '#f59e0b', bg: '#fffbeb', dot: 'bg-amber-400' },
  PENDIENTE:   { label: 'Pendiente',   color: '#f59e0b', bg: '#fffbeb', dot: 'bg-amber-400' },
  CONFIRMADA:  { label: 'Confirmada',  color: '#3b82f6', bg: '#eff6ff', dot: 'bg-blue-500' },
  EN_ESPERA:   { label: 'En espera',   color: '#3b82f6', bg: '#eff6ff', dot: 'bg-blue-500' },
  EN_CONSULTA: { label: 'En consulta', color: '#8b5cf6', bg: '#f5f3ff', dot: 'bg-purple-500' },
  COMPLETADA:  { label: 'Completada',  color: '#10b981', bg: '#f0fdf4', dot: 'bg-emerald-500' },
  NO_ASISTIO:  { label: 'No asistio',  color: '#6b7280', bg: '#f9fafb', dot: 'bg-gray-400' },
  ANULADA:     { label: 'Anulada',     color: '#ef4444', bg: '#fef2f2', dot: 'bg-red-500' },
  CANCELADA:   { label: 'Cancelada',   color: '#ef4444', bg: '#fef2f2', dot: 'bg-red-500' },
};

const ESP_CFG: Record<string, { color: string; bg: string; border: string; dot: string; short: string; consultorio: string }> = {
  Cardiologia:          { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: 'bg-red-500',    short: 'CAR', consultorio: 'Consultorio 1' },
  Traumatologia:        { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', dot: 'bg-orange-500', short: 'TRA', consultorio: 'Consultorio 2' },
  Neurologia:           { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dot: 'bg-purple-500', short: 'NEU', consultorio: 'Consultorio 3' },
  Otorrinolaringologia: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: 'bg-blue-500',   short: 'OTR', consultorio: 'Consultorio 4' },
  Gastroenterologia:    { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', dot: 'bg-green-500',  short: 'GAS', consultorio: 'Consultorio 5' },
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
  const now = new Date(); const today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
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
  const [expanded, setExpanded] = useState<string | null>(null);

  const espsVisibles = filtro === 'todas' ? especialidades : especialidades.filter(e => e === filtro);

  const completadasTotal = todayAppts.filter(a => a.status === 'COMPLETADA').length;
  const pendientesTotal  = todayAppts.filter(a => ['PENDIENTE','AGENDADA','CONFIRMADA','EN_ESPERA'].includes(a.status)).length;
  const enConsulta       = todayAppts.filter(a => a.status === 'EN_CONSULTA').length;

  return (
    <div className="space-y-3">
      {/* KPIs compactos */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total hoy',    val: todayAppts.length,  color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Completadas',  val: completadasTotal,   color: '#10b981', bg: '#f0fdf4' },
          { label: 'Pendientes',   val: pendientesTotal,    color: '#f59e0b', bg: '#fffbeb' },
          { label: 'En consulta',  val: enConsulta,         color: '#8b5cf6', bg: '#f5f3ff' },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: k.bg, borderColor: k.color + '30' }}>
            <div className="text-xl font-bold" style={{ color: k.color }}>{k.val}</div>
            <div className="text-xs mt-0.5" style={{ color: k.color }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <button onClick={() => setFiltro('todas')}
          className={'px-2.5 py-1 rounded-lg text-xs font-medium border transition ' + (filtro === 'todas' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
          Todas
        </button>
        {especialidades.map(esp => {
          const cfg = ESP_CFG[esp] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: 'bg-gray-400', short: esp.substring(0,3).toUpperCase(), consultorio: '' };
          return (
            <button key={esp} onClick={() => setFiltro(esp === filtro ? 'todas' : esp)}
              className={'px-2.5 py-1 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ' + (filtro === esp ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300')}
              style={filtro === esp ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}>
              <span className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + cfg.dot} />
              {esp.substring(0,6)} ({porEspecialidad[esp].length})
            </button>
          );
        })}
        <button onClick={onRefresh} className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
          <RefreshCw size={11} /> Actualizar
        </button>
      </div>

      {/* Grid de especialidades */}
      {todayAppts.length === 0 ? (
        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-sm">Sin citas programadas para hoy</p>
        </div>
      ) : (
        <div className="space-y-2">
          {espsVisibles.map(esp => {
            const citas = porEspecialidad[esp];
            const cfg = ESP_CFG[esp] ?? { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', dot: 'bg-gray-400', short: esp.substring(0,3).toUpperCase(), consultorio: '-' };
            const completadas = citas.filter(c => c.status === 'COMPLETADA').length;
            const progreso = Math.round((completadas / citas.length) * 100);
            const isOpen = expanded === esp;
            const doctor = citas[0]?.doctor?.user;

            return (
              <div key={esp} className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: cfg.border }}>
                {/* Header especialidad */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                  style={{ backgroundColor: isOpen ? cfg.bg : undefined }}
                  onClick={() => setExpanded(isOpen ? null : esp)}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}>
                    {cfg.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: cfg.color }}>{esp}</p>
                      <span className="text-xs text-gray-400">{cfg.consultorio}</span>
                      {doctor && <span className="text-xs text-gray-400 truncate">· Dr. {doctor.first_name} {doctor.last_name}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: progreso + '%' }} />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{completadas}/{citas.length} · {progreso}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Mini status pills */}
                    {(['EN_CONSULTA','PENDIENTE','COMPLETADA'] as const).map(st => {
                      const count = citas.filter(c => c.status === st).length;
                      if (count === 0) return null;
                      const sCfg = STATUS_CFG[st];
                      return (
                        <span key={st} className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ color: sCfg.color, backgroundColor: sCfg.bg }}>
                          {count}
                        </span>
                      );
                    })}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className={"transition-transform text-gray-400 " + (isOpen ? "rotate-180" : "")}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>

                {/* Citas expandidas */}
                {isOpen && (
                  <div className="border-t" style={{ borderColor: cfg.border }}>
                    {[
                      { label: 'Manana', hora: '08:00-14:00', items: citas.filter(c => c.turno === 'manana') },
                      { label: 'Tarde',  hora: '15:00-18:00', items: citas.filter(c => c.turno === 'tarde') },
                      { label: 'Sin turno', hora: '', items: citas.filter(c => !c.turno) },
                    ].filter(t => t.items.length > 0).map(turno => (
                      <div key={turno.label}>
                        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">{turno.label}</span>
                          {turno.hora && <span className="text-xs text-gray-400">{turno.hora}</span>}
                          <span className="text-xs text-gray-400 ml-auto">{turno.items.length} fichas</span>
                        </div>
                        <div className="grid grid-cols-2 gap-0 divide-y divide-gray-50">
                          {turno.items.map(a => {
                            const stCfg = STATUS_CFG[a.status] ?? { label: a.status, color: '#6b7280', bg: '#f9fafb', dot: 'bg-gray-400' };
                            return (
                              <div key={a.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 transition">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                  style={{ backgroundColor: stCfg.bg, color: stCfg.color }}>
                                  {a.numeroFicha ?? '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-700 truncate">{a.patient?.nombre ?? 'N/A'}</p>
                                  <p className="text-xs text-gray-400 truncate">{a.reason ?? 'Sin motivo'}</p>
                                </div>
                                <span className="text-xs font-medium flex-shrink-0" style={{ color: stCfg.color }}>{stCfg.label}</span>
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
