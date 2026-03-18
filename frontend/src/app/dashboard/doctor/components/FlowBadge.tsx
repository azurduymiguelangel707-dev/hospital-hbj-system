// src/app/dashboard/doctor/components/FlowBadge.tsx
import type { FlowStatus } from '@/lib/types/doctor.types';

const CONFIG: Record<FlowStatus, { label: string; className: string }> = {
  waiting_vitals: { label: 'Esperando vitales', className: 'bg-amber-100 text-amber-800' },
  ready:          { label: 'Listo p/ consulta', className: 'bg-green-100 text-green-800' },
  in_progress:    { label: 'En consulta',        className: 'bg-blue-100 text-blue-800' },
  completed:      { label: 'Completado',          className: 'bg-gray-100 text-gray-600' },
};

export function FlowBadge({ status }: { status: FlowStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
