// src/app/dashboard/doctor/components/PatientCard.tsx
'use client';

import type { AppointmentWithPatient, VitalSigns } from '@/lib/types/doctor.types';
import { FlowBadge } from './FlowBadge';
import { VitalSignsGrid } from './VitalSignsGrid';
import { AlertTriangle } from 'lucide-react';

interface Props {
  appointment: AppointmentWithPatient;
  vitals?: VitalSigns;
  selected?: boolean;
  onSelect: () => void;
  onStart: () => void;
  onComplete: () => void;
}

export function PatientCard({ appointment, vitals, selected, onSelect, onStart, onComplete }: Props) {
  const { patient, appointmentTime, status, flowStatus, isUrgent, reason } = appointment;

  return (
    <div
      onClick={onSelect}
      className={[
        'border rounded-xl p-4 cursor-pointer transition-all',
        selected ? 'border-blue-500 border-2 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
        isUrgent ? 'border-l-4 border-l-red-500 rounded-l-none' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-gray-800">{patient?.nombre ?? 'Paciente'}</span>
            {isUrgent && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <AlertTriangle size={10} /> Urgente
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {patient?.historialNumero && `${patient.historialNumero} Â· `}
            {patient?.edad && `${patient.edad} anos`}
            {patient?.condicionesCronicas?.length ? ` Â· ${patient.condicionesCronicas.join(', ')}` : ''}
          </div>
          {reason && <div className="text-xs text-gray-400 mt-1 italic">{reason}</div>}
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-sm font-semibold text-gray-700">{appointmentTime.substring(0, 5)}</div>
          <div className="mt-1"><FlowBadge status={flowStatus} /></div>
        </div>
      </div>

      {vitals && flowStatus !== 'waiting_vitals' && (
        <div className="mb-3"><VitalSignsGrid vitals={vitals} /></div>
      )}

      {patient?.tieneAlertas && (
        <div className="bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
          <AlertTriangle size={12} /> Revisar alergias en ficha clinica
        </div>
      )}

      {selected && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          {(status === 'EN_ESPERA' || status === 'AGENDADA') && (
            <button
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Iniciar consulta
            </button>
          )}
          {status === 'EN_CONSULTA' && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition font-medium"
            >
              Completar y sellar
            </button>
          )}
          {status === 'COMPLETADA' && (
            <div className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg text-center">Completada</div>
          )}
        </div>
      )}
    </div>
  );
}
