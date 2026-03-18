// src/app/admin/components/TurnosPanel.tsx
'use client';
import { useMemo } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';

const ESPECIALIDADES = ['Cardiologia','Traumatologia','Neurologia','Otorrinolaringologia','Gastroenterologia'];
const TURNOS = ['manana','tarde'];
const TURNO_LABEL: Record<string,string> = { manana: 'Mañana', tarde: 'Tarde' };
const ESP_SHORT: Record<string,string> = {
  Cardiologia: 'Cardio', Traumatologia: 'Trauma', Neurologia: 'Neuro',
  Otorrinolaringologia: 'Otorrino', Gastroenterologia: 'Gastro'
};
const STATUS_COLORS: Record<string,string> = {
  AGENDADA:   'bg-blue-100 text-blue-700',
  EN_ESPERA:  'bg-amber-100 text-amber-700',
  EN_CONSULTA:'bg-purple-100 text-purple-700',
  COMPLETADA: 'bg-green-100 text-green-700',
  NO_ASISTIO: 'bg-red-100 text-red-700',
  ANULADA:    'bg-gray-100 text-gray-500',
};

interface Props { appointments: any[] }

export default function TurnosPanel({ appointments }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = useMemo(() =>
    appointments.filter(a => (a.appointmentDate ?? '').split('T')[0] === today),
    [appointments, today]
  );

  const stats = useMemo(() => {
    return TURNOS.map(turno => {
      const turnoAppts = todayAppts.filter(a => a.turno === turno);
      const total = turnoAppts.length;
      const completadas = turnoAppts.filter(a => a.status === 'COMPLETADA').length;
      const enEspera = turnoAppts.filter(a => ['AGENDADA','EN_ESPERA'].includes(a.status)).length;
      const enConsulta = turnoAppts.filter(a => a.status === 'EN_CONSULTA').length;
      const noAsistio = turnoAppts.filter(a => a.status === 'NO_ASISTIO').length;
      const anuladas = turnoAppts.filter(a => a.status === 'ANULADA').length;
      const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

      const porEsp = ESPECIALIDADES.map(esp => {
        const espAppts = turnoAppts.filter(a => a.especialidad === esp);
        return {
          esp,
          total: espAppts.length,
          completadas: espAppts.filter(a => a.status === 'COMPLETADA').length,
          pendientes: espAppts.filter(a => ['AGENDADA','EN_ESPERA','EN_CONSULTA'].includes(a.status)).length,
        };
      }).filter(e => e.total > 0);

      return { turno, total, completadas, enEspera, enConsulta, noAsistio, anuladas, porcentaje, porEsp };
    });
  }, [todayAppts]);

  const totalDia = todayAppts.length;
  const totalCompletadas = todayAppts.filter(a => a.status === 'COMPLETADA').length;
  const totalPendientes = todayAppts.filter(a => ['AGENDADA','EN_ESPERA','EN_CONSULTA'].includes(a.status)).length;

  return (
    <div className="space-y-6">
      {/* Resumen global del dia */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalDia}</p>
            <p className="text-xs text-gray-500">Citas totales hoy</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalCompletadas}</p>
            <p className="text-xs text-gray-500">Completadas</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalPendientes}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>
      </div>

      {/* Turnos */}
      <div className="grid grid-cols-2 gap-6">
        {stats.map(s => (
          <div key={s.turno} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">Turno {TURNO_LABEL[s.turno]}</h3>
              </div>
              <span className="text-xs font-medium text-gray-500">{s.total} citas</span>
            </div>

            {/* Barra de progreso */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progreso</span>
                <span>{s.porcentaje}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${s.porcentaje}%` }}
                />
              </div>
            </div>

            {/* Contadores de estado */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Pendientes', val: s.enEspera, color: 'text-amber-600 bg-amber-50' },
                { label: 'En consulta', val: s.enConsulta, color: 'text-purple-600 bg-purple-50' },
                { label: 'Completadas', val: s.completadas, color: 'text-green-600 bg-green-50' },
                { label: 'No asistió', val: s.noAsistio, color: 'text-red-600 bg-red-50' },
              ].map(c => (
                <div key={c.label} className={`rounded-lg p-2 text-center ${c.color}`}>
                  <p className="text-lg font-bold">{c.val}</p>
                  <p className="text-xs leading-tight">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Por especialidad */}
            {s.porEsp.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Por especialidad</p>
                {s.porEsp.map(e => (
                  <div key={e.esp} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20 shrink-0">{ESP_SHORT[e.esp] ?? e.esp}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: e.total > 0 ? `${Math.round((e.completadas/e.total)*100)}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right shrink-0">{e.completadas}/{e.total}</span>
                  </div>
                ))}
              </div>
            )}

            {s.total === 0 && (
              <div className="text-center py-4">
                <AlertCircle size={20} className="text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Sin citas para este turno</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}