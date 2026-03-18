// frontend/src/app/dashboard/nurse/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Activity, Users, Calendar, Clock, Heart, Thermometer, AlertCircle, CheckCircle } from 'lucide-react';

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  patient?: {
    nombre: string;
    edad: number;
  };
  doctor?: {
    user?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface MedicalRecord {
  id: string;
  visitDate: string;
  vitalSigns?: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
  };
  patient?: {
    nombre: string;
  };
}

export default function NurseDashboard() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    inProgress: 0,
    completed: 0,
    pending: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, recordsRes] = await Promise.all([
        fetch('http://localhost:3001/api/appointments'),
        fetch('http://localhost:3001/api/medical-records')
      ]);
      
      const appointments = await appointmentsRes.json();
      const records = await recordsRes.json();
      
      const today = new Date().toISOString().split('T')[0];
      const todayApps = appointments.filter((app: Appointment) => 
        app.appointmentDate.split('T')[0] === today
      );
      
      setTodayAppointments(todayApps);
      setRecentRecords(records.slice(0, 10));
      
      setStats({
        today: todayApps.length,
        inProgress: todayApps.filter((a: Appointment) => a.status === 'EN_CONSULTA').length,
        completed: todayApps.filter((a: Appointment) => a.status === 'COMPLETADA').length,
        pending: todayApps.filter((a: Appointment) => a.status === 'AGENDADA' || a.status === 'EN_ESPERA').length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'EN_ESPERA': return 'bg-green-100 text-green-800';
      case 'AGENDADA': return 'bg-yellow-100 text-yellow-800';
      case 'EN_CONSULTA': return 'bg-purple-100 text-purple-800';
      case 'COMPLETADA': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVitalSignStatus = (vitalSign: any) => {
    if (!vitalSign) return { color: 'text-gray-400', icon: AlertCircle };
    return { color: 'text-green-600', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Activity className="mr-3 text-blue-600" size={32} />
            Dashboard de Enfermería
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Citas Hoy</p>
                <p className="text-3xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <Calendar className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En Consulta</p>
                <p className="text-3xl font-bold text-purple-600">{stats.inProgress}</p>
              </div>
              <Activity className="text-purple-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-600" size={40} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pacientes en Sala */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="mr-2 text-blue-600" size={24} />
              Pacientes en Sala
            </h2>
            
            {todayAppointments.filter(a => a.status === 'EN_CONSULTA' || a.status === 'EN_ESPERA').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto mb-3 text-gray-400" size={40} />
                <p>No hay pacientes en sala actualmente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments
                  .filter(app => app.status === 'EN_CONSULTA' || app.status === 'EN_ESPERA')
                  .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                  .map(app => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800">{app.patient?.nombre || 'Paciente'}</h3>
                          <p className="text-sm text-gray-600">
                            {app.patient?.edad ? `${app.patient.edad} años` : 'Edad no especificada'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Hora:</span> {app.appointmentTime.substring(0, 5)}
                      </div>
                      
                      {app.doctor?.user && (
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Con:</span> Dr(a). {app.doctor.user.first_name} {app.doctor.user.last_name}
                        </div>
                      )}
                      
                      {app.status === 'EN_ESPERA' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                            Registrar Signos Vitales
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Signos Vitales Recientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Heart className="mr-2 text-red-600" size={24} />
              Signos Vitales Recientes
            </h2>
            
            {recentRecords.filter(r => r.vitalSigns).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto mb-3 text-gray-400" size={40} />
                <p>No hay registros de signos vitales recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRecords
                  .filter(record => record.vitalSigns)
                  .map(record => {
                    const vs = record.vitalSigns!;
                    return (
                      <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800">{record.patient?.nombre || 'Paciente'}</h3>
                          <span className="text-xs text-gray-500">
                            {new Date(record.visitDate).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {vs.blood_pressure && (
                            <div className="flex items-center">
                              <Heart className="mr-2 text-red-500" size={16} />
                              <div>
                                <p className="text-xs text-gray-600">Presión</p>
                                <p className="font-semibold text-sm">{vs.blood_pressure}</p>
                              </div>
                            </div>
                          )}
                          
                          {vs.heart_rate && (
                            <div className="flex items-center">
                              <Activity className="mr-2 text-blue-500" size={16} />
                              <div>
                                <p className="text-xs text-gray-600">Pulso</p>
                                <p className="font-semibold text-sm">{vs.heart_rate} bpm</p>
                              </div>
                            </div>
                          )}
                          
                          {vs.temperature && (
                            <div className="flex items-center">
                              <Thermometer className="mr-2 text-orange-500" size={16} />
                              <div>
                                <p className="text-xs text-gray-600">Temperatura</p>
                                <p className="font-semibold text-sm">{vs.temperature}°C</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Agenda del Día */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2 text-blue-600" size={24} />
            Agenda Completa del Día
          </h2>
          
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay citas programadas para hoy
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayAppointments
                    .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                    .map(app => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          {app.appointmentTime.substring(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {app.patient?.nombre || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {app.doctor?.user 
                            ? `Dr(a). ${app.doctor.user.first_name} ${app.doctor.user.last_name}` 
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {app.status === 'EN_ESPERA' && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                              Preparar
                            </button>
                          )}
                          {app.status === 'EN_CONSULTA' && (
                            <span className="text-purple-600 text-sm font-semibold">En consulta</span>
                          )}
                          {app.status === 'COMPLETADA' && (
                            <span className="text-green-600 text-sm">✓ Completada</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}