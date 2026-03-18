// src/app/admin/components/StatsGrid.tsx
import { Users, Stethoscope, Calendar, CheckCircle, Clock, Activity, UserX, TrendingUp } from 'lucide-react';

interface Props {
  userStats: { totalUsers: number; totalDoctors: number; totalPatients: number; activeUsers: number };
  apptStats: { totalHoy: number; completadasHoy: number; pendientesHoy: number; enCursoHoy: number; canceladasHoy: number; totalHistorico: number };
}

export function StatsGrid({ userStats, apptStats }: Props) {
  const cards = [
    { label: 'Usuarios activos', value: userStats.activeUsers, icon: Users, color: 'blue', sub: `${userStats.totalUsers} total` },
    { label: 'Medicos', value: userStats.totalDoctors, icon: Stethoscope, color: 'green', sub: 'en el sistema' },
    { label: 'Pacientes', value: userStats.totalPatients, icon: Users, color: 'purple', sub: 'registrados' },
    { label: 'Citas hoy', value: apptStats.totalHoy, icon: Calendar, color: 'indigo', sub: `${apptStats.totalHistorico} historico` },
    { label: 'Completadas hoy', value: apptStats.completadasHoy, icon: CheckCircle, color: 'emerald', sub: 'finalizadas' },
    { label: 'Pendientes hoy', value: apptStats.pendientesHoy, icon: Clock, color: 'amber', sub: 'por atender' },
    { label: 'En consulta', value: apptStats.enCursoHoy, icon: Activity, color: 'blue', sub: 'ahora mismo' },
    { label: 'Canceladas hoy', value: apptStats.canceladasHoy, icon: UserX, color: 'red', sub: 'no atendidas' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        const cls = colorMap[c.color] ?? colorMap.blue;
        return (
          <div key={c.label} className={`border rounded-xl p-4 ${cls}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-medium opacity-70">{c.label}</p>
                <p className="text-3xl font-bold mt-1">{c.value}</p>
                <p className="text-xs opacity-60 mt-1">{c.sub}</p>
              </div>
              <Icon size={20} className="opacity-40 mt-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
