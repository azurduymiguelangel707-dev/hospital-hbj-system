// src/app/dashboard/doctor/components/VitalSignsGrid.tsx
import type { VitalSigns } from '@/lib/types/doctor.types';

type VStatus = 'ok' | 'warn' | 'danger' | 'neutral';

const STATUS_CLASS: Record<VStatus, string> = {
  ok:      'text-green-600',
  warn:    'text-amber-600',
  danger:  'text-red-600',
  neutral: 'text-gray-500',
};

function paStatus(val?: string): VStatus {
  if (!val) return 'neutral';
  const sys = parseInt(val.split('/')[0]);
  if (sys >= 160) return 'danger';
  if (sys >= 140) return 'warn';
  return 'ok';
}

export function VitalSignsGrid({ vitals }: { vitals: VitalSigns }) {
  const items = [
    { label: 'PA', unit: 'mmHg', value: vitals.presionArterial,
      status: paStatus(vitals.presionArterial) },
    { label: 'FC', unit: 'bpm', value: vitals.frecuenciaCardiaca,
      status: !vitals.frecuenciaCardiaca ? 'neutral' : vitals.frecuenciaCardiaca > 100 || vitals.frecuenciaCardiaca < 60 ? 'warn' : 'ok' as VStatus },
    { label: 'Temp', unit: 'C', value: vitals.temperatura,
      status: !vitals.temperatura ? 'neutral' : vitals.temperatura >= 38 ? 'warn' : 'ok' as VStatus },
    { label: 'SpO2', unit: '%', value: vitals.saturacionOxigeno,
      status: !vitals.saturacionOxigeno ? 'neutral' : vitals.saturacionOxigeno < 94 ? 'danger' : 'ok' as VStatus },
    { label: 'FR', unit: 'rpm', value: vitals.frecuenciaRespiratoria,
      status: !vitals.frecuenciaRespiratoria ? 'neutral' : vitals.frecuenciaRespiratoria > 20 ? 'warn' : 'ok' as VStatus },
    { label: 'Peso', unit: 'kg', value: vitals.peso, status: 'neutral' as VStatus },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center">
          <div className={`text-lg font-semibold leading-tight ${STATUS_CLASS[item.status as VStatus]}`}>
            {item.value ?? 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{item.label} {item.unit}</div>
        </div>
      ))}
    </div>
  );
}
