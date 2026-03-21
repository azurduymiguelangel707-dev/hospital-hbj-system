// src/app/dashboard/doctor/components/PatientCard.tsx
"use client";

import type { AppointmentWithPatient, VitalSigns } from "@/lib/types/doctor.types";
import { AlertTriangle, Clock, User, ChevronRight } from "lucide-react";

const FLOW_CONFIG = {
  waiting_vitals: { label: "Esperando vitales", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", dot: "bg-amber-400" },
  ready:          { label: "Listo para consulta", color: "#10b981", bg: "#f0fdf4", border: "#6ee7b7", dot: "bg-emerald-500" },
  in_progress:    { label: "En consulta",         color: "#3b82f6", bg: "#eff6ff", border: "#93c5fd", dot: "bg-blue-500" },
  completed:      { label: "Completado",           color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", dot: "bg-gray-400" },
};

interface Props {
  appointment: AppointmentWithPatient;
  vitals?: VitalSigns;
  selected?: boolean;
  onSelect: () => void;
  onStart: () => void;
  onComplete: () => void;
}

function VitalPill({ label, value, color }: { label: string; value: string | number | undefined; color: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white border" style={{ borderColor: color + "40", color }}>
      <span className="font-bold">{value}</span>
      <span className="opacity-60">{label}</span>
    </span>
  );
}

export function PatientCard({ appointment, vitals, selected, onSelect, onStart, onComplete }: Props) {
  const { patient, appointmentTime, status, flowStatus, isUrgent, reason } = appointment;
  const flow = FLOW_CONFIG[flowStatus] ?? FLOW_CONFIG.waiting_vitals;
  const hora = appointmentTime ? appointmentTime.substring(0, 5) : "--:--";

  return (
    <div
      onClick={onSelect}
      className="rounded-xl cursor-pointer transition-all overflow-hidden"
      style={{
        border: selected ? "2px solid " + flow.color : "1px solid " + flow.border,
        boxShadow: selected ? "0 0 0 3px " + flow.color + "20" : undefined,
        backgroundColor: selected ? flow.bg : "white",
      }}
    >
      {/* Barra superior de estado */}
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: flow.border, backgroundColor: flow.bg }}>
        <div className="flex items-center gap-2">
          <span className={"w-2 h-2 rounded-full " + flow.dot} />
          <span className="text-xs font-semibold" style={{ color: flow.color }}>{flow.label}</span>
          {isUrgent && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
              <AlertTriangle size={10} /> Urgente
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          <span className="font-mono font-medium text-gray-600">{hora}</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Nombre */}
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-800 truncate">{patient?.nombre ?? "Paciente"}</span>
            </div>
            {/* Info secundaria */}
            <div className="text-xs text-gray-400 ml-9 mb-1">
              {[patient?.edad && patient.edad + " anos", patient?.historialNumero].filter(Boolean).join(" · ")}
            </div>
            {/* Motivo */}
            {reason && (
              <div className="ml-9 text-xs text-gray-500 italic truncate">"{reason}"</div>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
        </div>

        {/* Vitales clave inline */}
        {vitals && flowStatus !== "waiting_vitals" && (
          <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
            <VitalPill label="PA" value={vitals.presionArterial}
              color={(() => { const s = parseInt(String(vitals.presionArterial).split("/")[0]); return s >= 160 ? "#ef4444" : s >= 140 ? "#f59e0b" : "#10b981"; })()}
            />
            <VitalPill label="FC" value={vitals.frecuenciaCardiaca ? vitals.frecuenciaCardiaca + " bpm" : undefined}
              color={Number(vitals.frecuenciaCardiaca) > 100 || Number(vitals.frecuenciaCardiaca) < 60 ? "#ef4444" : "#10b981"}
            />
            <VitalPill label="SpO2" value={vitals.saturacionOxigeno ? vitals.saturacionOxigeno + "%" : undefined}
              color={Number(vitals.saturacionOxigeno) < 94 ? "#ef4444" : "#10b981"}
            />
            <VitalPill label="T°" value={vitals.temperatura ? vitals.temperatura + "°C" : undefined}
              color={Number(vitals.temperatura) >= 38 ? "#f59e0b" : "#10b981"}
            />
          </div>
        )}

        {/* Alerta cronico */}
        {patient?.tieneAlertas && (
          <div className="mt-2 ml-9 bg-red-50 text-red-600 text-xs rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <AlertTriangle size={11} /> Revisar alergias en ficha clinica
          </div>
        )}

        {/* Botones de accion */}
        {selected && (
          <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: flow.border }}>
            {(status === "EN_ESPERA" || status === "AGENDADA") && (
              <button
                onClick={(e) => { e.stopPropagation(); onStart(); }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Iniciar consulta
              </button>
            )}
            {status === "EN_CONSULTA" && (
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                className="flex-1 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                Ir a consulta activa
              </button>
            )}
            {status === "COMPLETADA" && (
              <div className="flex-1 px-3 py-2 bg-gray-100 text-gray-500 text-xs rounded-lg text-center">
                Consulta completada
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Ver ficha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}