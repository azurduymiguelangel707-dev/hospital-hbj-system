// src/lib/types/doctor.types.ts

export type AppointmentStatus = 'AGENDADA' | 'EN_ESPERA' | 'EN_CONSULTA' | 'COMPLETADA' | 'ANULADA';
export type FlowStatus = 'waiting_vitals' | 'ready' | 'in_progress' | 'completed';
export type DocType =
  | 'RADIOGRAFIA'
  | 'ECOGRAFIA'
  | 'TOMOGRAFIA'
  | 'RESONANCIA'
  | 'ECG'
  | 'LABORATORIO'
  | 'RECETA'
  | 'ORDEN'
  | 'FOTO_CLINICA'
  | 'OTRO';

export interface VitalSigns {
  presionArterial?: string;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  temperatura?: number;
  peso?: number;
  talla?: number;
  saturacionOxigeno?: number;
}

export interface ClinicalAlert {
  tipo: 'danger' | 'warning' | 'info';
  mensaje: string;
}

export interface MedicalRecord {
  id: string;
  fecha: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos?: string;
  notasInternas?: string;
  medicoNombre?: string;
  docsCount?: number;
}

export interface ActiveMedication {
  nombre: string;
  dosis: string;
  frecuencia: string;
}

export interface UpcomingControl {
  titulo: string;
  tipo: string;
  fecha: string;
}

export interface ClinicalDocument {
  id: string;
  appointmentId: string;
  tipo: DocType;
  descripcion: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fechaConsulta?: string;
  diagnosticoConsulta?: string;
  creadoEn: string;
}

export interface PatientDetail {
  id: string;
  nombre: string;
  historialNumero: string;
  ci: string;
  edad: number;
  genero: string;
  tipoSangre: string;
  telefono?: string;
  email?: string;
  vitalSigns?: VitalSigns;
  alerts: ClinicalAlert[];
  recentRecords: MedicalRecord[];
  activeMedications: ActiveMedication[];
  upcomingControls: UpcomingControl[];
  documents?: ClinicalDocument[];
  condicionesCronicas?: string[];
}

export interface AppointmentWithPatient {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  flowStatus: FlowStatus;
  reason: string;
  durationMinutes: number;
  isUrgent?: boolean;
  patient?: {
    id: string;
    nombre: string;
    historialNumero?: string;
    edad?: number;
    condicionesCronicas?: string[];
    tieneAlertas?: boolean;
  };
}

export interface ConsultaForm {
  motivoConsulta: string;
  diagnostico: string;
  codigosCIE10: string[];
  tratamiento: string;
  prescripciones: { medicamento: string; dosis: string; duracion: string }[];
  estudiosSolicitados: string[];
  fechaControl?: string;
  notasInternas: string;
}

export interface FollowUpPatient {
  id: string;
  nombre: string;
  diagnostico: string;
  motivo: string;
  diasVencido?: number;
  severidad: 'danger' | 'warning';
  tieneDocsNuevos?: boolean;
}

export interface WeeklyReportData {
  semana: string;
  consultasPorDia: { dia: string; count: number; max: number }[];
  diagnosticosFrecuentes: { nombre: string; count: number; max: number }[];
  pacientesCriticos: { nombre: string; diagnostico: string; estado: string }[];
  documentosSubidos: { imagenes: number; labs: number; recetas: number; ordenes: number };
  totalConsultas: number;
  pacientesCriticosCount: number;
  controlesPendientes: number;
  docsTotal: number;
}
