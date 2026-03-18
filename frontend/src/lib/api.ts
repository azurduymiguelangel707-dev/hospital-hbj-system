const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Doctor {
  id: string;
  specialty: string;
  license_number: string;
  phone: string;
  consultation_fee: string;
  biography: string;
  años_de_experiencia: number;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface Patient {
  id: string;
  nombre: string;
  ci: string;
  edad: number;
  genero: string;
  tipoSangre: string;
  telefono: string;
  email: string;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string;
  patient_id: string;
  doctor_id: string;
}

export const api = {
  async getDoctors(): Promise<Doctor[]> {
    const res = await fetch(`${API_URL}/api/doctors`);
    if (!res.ok) throw new Error('Error al obtener médicos');
    return res.json();
  },

  async getPatients(): Promise<Patient[]> {
    const res = await fetch(`${API_URL}/api/patients`);
    if (!res.ok) throw new Error('Error al obtener pacientes');
    return res.json();
  },

  async getAppointments(): Promise<Appointment[]> {
    const res = await fetch(`${API_URL}/api/appointments`);
    if (!res.ok) throw new Error('Error al obtener citas');
    return res.json();
  },
};