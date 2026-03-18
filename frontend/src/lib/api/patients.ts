import { api } from './client';

export interface Patient {
  id: string;
  ci: string;
  birth_date: string;
  gender: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  blood_type?: string;
  allergies?: string[];
  insurance_number?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export const patientsAPI = {
  getAll: () => api.get('/api/patients'),
  getOne: (id: string) => api.get(`/api/patients/${id}`),
  create: (data: Partial<Patient>) => api.post('/api/patients', data),
  update: (id: string, data: Partial<Patient>) => api.patch(`/api/patients/${id}`, data),
  delete: (id: string) => api.delete(`/api/patients/${id}`),
};