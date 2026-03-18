// src/app/admin/components/AppointmentMonitor.tsx
'use client';
import { RefreshCw, MapPin } from 'lucide-react';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  AGENDADA:    { label: 'Agendada',     cls: 'bg-amber-100 text-amber-800' },
  EN_ESPERA:   { label: 'En espera',    cls: 'bg-blue-100 text-blue-800' },
  EN_CONSULTA: { label: 'En consulta',  cls: 'bg-purple-100 text-purple-800' },
  COMPLETADA:  { label: 'Completada',   cls: 'bg-green-100 text-green-800' },
  NO_ASISTIO:  { label: 'No asistio',   cls: 'bg-gray-100 text-gray-600' },
  ANULADA:     { label: 'Anulada',      cls: 'bg-red-100 text-red-800' },
};

const ESP_CFG: Record<string, { color: string; bg: string; consultorio: string; short: string }> = {
  Cardiologia:          { color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      consultorio: 'Consultorio 1', short: 'CAR' },
  Traumatologia:        { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', consultorio: 'Consultorio 2', short: 'TRA' },
  Neurologia:           { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', consultorio: 'Consultorio 3', short: 'NEU' },
  Otorrinolaringologia: { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     consultorio: 'Consultorio 4', short: 'OTO' },
  Gastroenterologia:    { color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   consultorio: 'Consultorio 5', short: 'GAS' },
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
    .filter(a => (a.appointmentDate ?? '').split('T')[0] === today && a.status !== 'ANULADA')
    .sort((a, b) => (a.numeroFicha ?? 99) - (b.numeroFicha ?? 99));

  // Agrupar por especialidad
  const porEspecialidad: Record<string, Appointment[]> = {};
  for (const a of todayAppts) {
    const esp = a.especialidad ?? a.doctor?.specialty ?? 'General';
    if (!porEspecialidad[esp]) porEspecialidad[esp] = [];
    porEspecialidad[esp].push(a);
  }

  const especialidades = Object.keys(porEspecialidad).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500">{todayAppts.length} citas programadas hoy</p>
        <button onClick={onRefresh} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition">
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {todayAppts.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm border border-gray-200 rounded-xl">Sin citas para hoy</div>
      ) : (
        <div className="space-y-4">
          {especialidades.map(esp => {
            const citas = porEspecialidad[esp];
            const cfg = ESP_CFG[esp] ?? { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', consultorio: 'Consultorio', short: 'GEN' };
            const doctor = citas[0]?.doctor?.user;
            const manana = citas.filter(c => c.turno === 'manana');
            const tarde = citas.filter(c => c.turno === 'tarde');
            const sinTurno = citas.filter(c => !c.turno);

            return (
              <div key={esp} className={`border rounded-xl overflow-hidden ${cfg.bg}`}>
                {/* Header especialidad */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${cfg.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${cfg.color.replace('text-', 'bg-').replace('-700', '-600')}`}>
                      {cfg.short}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${cfg.color}`}>{esp}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-gray-400" />
                        <p className="text-xs text-gray-500">{cfg.consultorio}</p>
                        {doctor && <span className="text-xs text-gray-400 ml-2">— Dr. {doctor.first_name} {doctor.last_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.color} bg-white bg-opacity-70`}>
                      {citas.length} pacientes
                    </span>
                  </div>
                </div>

                {/* Turnos */}
                <div className="bg-white">
                  {[
                    { label: 'Turno Manana', items: manana, hora: '08:00 - 14:00' },
                    { label: 'Turno Tarde', items: tarde, hora: '15:00 - 18:00' },
                    { label: 'Sin turno asignado', items: sinTurno, hora: '' },
                  ].filter(t => t.items.length > 0).map(turno => (
                    <div key={turno.label}>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600">{turno.label}</span>
                        {turno.hora && <span className="text-xs text-gray-400">{turno.hora}</span>}
                        <span className="text-xs text-gray-400 ml-auto">{turno.items.length} fichas</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {turno.items.map(a => {
                          const stCfg = STATUS_CFG[a.status] ?? { label: a.status, cls: 'bg-gray-100 text-gray-600' };
                          return (
                            <div key={a.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition">
                              {/* Numero de ficha */}
                              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border-2 ${a.status === 'COMPLETADA' ? 'bg-green-50 border-green-300' : a.status === 'EN_CONSULTA' ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200'}`}>
                                <span className={`text-lg font-bold leading-none ${a.status === 'COMPLETADA' ? 'text-green-600' : a.status === 'EN_CONSULTA' ? 'text-purple-600' : cfg.color}`}>
                                  {a.numeroFicha ?? '?'}
                                </span>
                                <span className="text-xs text-gray-400 leading-none mt-0.5">/{a.totalFichasTurno ?? 15}</span>
                              </div>
                              {/* Info paciente */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{a.patient?.nombre ?? 'N/A'}</p>
                                <p className="text-xs text-gray-400 truncate">{a.reason ?? 'Sin motivo registrado'}</p>
                              </div>
                              {/* Sin hora - sistema por fichas */}
                              {/* Estado */}
                              <div className="flex-shrink-0">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stCfg.cls}`}>{stCfg.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
 
