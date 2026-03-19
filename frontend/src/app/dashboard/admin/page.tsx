// frontend/src/app/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Users, Stethoscope, Calendar, FileText, TrendingUp, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Stats {
  patients: number;
  doctors: number;
  appointments: number;
  medicalRecords: number;
  appointmentsToday: number;
  appointmentsPending: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
}

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  patient?: { nombre: string };
  doctor?: { user?: { first_name: string; last_name: string } };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    patients: 0,
    doctors: 0,
    appointments: 0,
    medicalRecords: 0,
    appointmentsToday: 0,
    appointmentsPending: 0,
    appointmentsCompleted: 0,
    appointmentsCancelled: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [patientsRes, doctorsRes, appointmentsRes, recordsRes] = await Promise.all([
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/patients'),
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/doctors'),
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/appointments'),
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/medical-records')
      ]);

      const patients = await patientsRes.json();
      const doctors = await doctorsRes.json();
      const appointments = await appointmentsRes.json();
      const records = await recordsRes.json();

      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter((a: Appointment) => 
        a.appointmentDate.split('T')[0] === today
      );

      setStats({
        patients: patients.length,
        doctors: doctors.length,
        appointments: appointments.length,
        medicalRecords: records.length,
        appointmentsToday: todayAppointments.length,
        appointmentsPending: appointments.filter((a: Appointment) => a.status === 'AGENDADA' || a.status === 'EN_ESPERA').length,
        appointmentsCompleted: appointments.filter((a: Appointment) => a.status === 'COMPLETADA').length,
        appointmentsCancelled: appointments.filter((a: Appointment) => a.status === 'ANULADA').length
      });

      // ÃƒÆ’Ã…Â¡ltimas 10 citas
      const sorted = appointments
        .sort((a: Appointment, b: Appointment) => {
          const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
          if (dateCompare !== 0) return dateCompare;
          return b.appointmentTime.localeCompare(a.appointmentTime);
        })
        .slice(0, 10);
      
      setRecentAppointments(sorted);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      case 'ANULADA': return 'bg-red-100 text-red-800';
      case 'NO_ASISTIO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'EN_ESPERA':
      case 'COMPLETADA':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'ANULADA':
        return <XCircle size={16} className="text-red-600" />;
      case 'AGENDADA':
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
    }
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
          <h1 className="text-3xl font-bold text-gray-800">Panel de AdministraciÃƒÆ’Ã‚Â³n</h1>
          <p className="text-gray-600 mt-1">Vista general del sistema hospitalario</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div 
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push('/dashboard/patients')}
          >
            <div className="flex items-center justify-between mb-4">
              <Users size={40} className="opacity-80" />
              <TrendingUp size={24} className="opacity-60" />
            </div>
            <p className="text-blue-100 text-sm mb-1">Total Pacientes</p>
            <p className="text-4xl font-bold">{stats.patients}</p>
            <p className="text-blue-100 text-xs mt-2">Click para gestionar ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢</p>
          </div>

          <div 
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push('/dashboard/doctors')}
          >
            <div className="flex items-center justify-between mb-4">
              <Stethoscope size={40} className="opacity-80" />
              <Activity size={24} className="opacity-60" />
            </div>
            <p className="text-green-100 text-sm mb-1">MÃƒÆ’Ã‚Â©dicos Activos</p>
            <p className="text-4xl font-bold">{stats.doctors}</p>
            <p className="text-green-100 text-xs mt-2">Click para gestionar ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢</p>
          </div>

          <div 
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push('/dashboard/appointments')}
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar size={40} className="opacity-80" />
              <CheckCircle size={24} className="opacity-60" />
            </div>
            <p className="text-purple-100 text-sm mb-1">Citas Totales</p>
            <p className="text-4xl font-bold">{stats.appointments}</p>
            <p className="text-purple-100 text-xs mt-2">Click para gestionar ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢</p>
          </div>

          <div 
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push('/dashboard/medical-records')}
          >
            <div className="flex items-center justify-between mb-4">
              <FileText size={40} className="opacity-80" />
              <TrendingUp size={24} className="opacity-60" />
            </div>
            <p className="text-orange-100 text-sm mb-1">Registros MÃƒÆ’Ã‚Â©dicos</p>
            <p className="text-4xl font-bold">{stats.medicalRecords}</p>
            <p className="text-orange-100 text-xs mt-2">Click para ver ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢</p>
          </div>
        </div>

        {/* Appointment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Citas Hoy</p>
              <Calendar className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.appointmentsToday}</p>
            <div className="mt-2 h-1 bg-blue-100 rounded-full">
              <div className="h-1 bg-blue-600 rounded-full" style={{width: '75%'}}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Pendientes</p>
              <Clock className="text-yellow-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.appointmentsPending}</p>
            <div className="mt-2 h-1 bg-yellow-100 rounded-full">
              <div className="h-1 bg-yellow-600 rounded-full" style={{width: '60%'}}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Completadas</p>
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.appointmentsCompleted}</p>
            <div className="mt-2 h-1 bg-green-100 rounded-full">
              <div className="h-1 bg-green-600 rounded-full" style={{width: '85%'}}></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Canceladas</p>
              <XCircle className="text-red-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.appointmentsCancelled}</p>
            <div className="mt-2 h-1 bg-red-100 rounded-full">
              <div className="h-1 bg-red-600 rounded-full" style={{width: '25%'}}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones RÃƒÆ’Ã‚Â¡pidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/dashboard/patients')}
              className="flex flex-col items-center justify-center p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition"
            >
              <Users className="text-blue-600 mb-2" size={32} />
              <span className="text-sm font-semibold text-gray-700">Gestionar Pacientes</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/doctors')}
              className="flex flex-col items-center justify-center p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition"
            >
              <Stethoscope className="text-green-600 mb-2" size={32} />
              <span className="text-sm font-semibold text-gray-700">Gestionar MÃƒÆ’Ã‚Â©dicos</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/appointments')}
              className="flex flex-col items-center justify-center p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 transition"
            >
              <Calendar className="text-purple-600 mb-2" size={32} />
              <span className="text-sm font-semibold text-gray-700">Ver Citas</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/medical-records')}
              className="flex flex-col items-center justify-center p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-400 transition"
            >
              <FileText className="text-orange-600 mb-2" size={32} />
              <span className="text-sm font-semibold text-gray-700">Historiales</span>
            </button>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Actividad Reciente</h2>
          
          {recentAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay actividad reciente
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MÃƒÆ’Ã‚Â©dico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentAppointments.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(app.appointmentDate).toLocaleDateString('es-ES')}
                      </td>
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
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.reason.length > 30 ? app.reason.substring(0, 30) + '...' : app.reason}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg shadow-md p-6 mt-6 text-white">
          <h3 className="font-bold text-lg mb-3">ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â  Resumen del Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-300">OcupaciÃƒÆ’Ã‚Â³n</p>
              <p className="text-2xl font-bold">
                {stats.appointments > 0 ? Math.round((stats.appointmentsCompleted / stats.appointments) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-300">Tasa de ÃƒÆ’Ã¢â‚¬Â°xito</p>
              <p className="text-2xl font-bold">
                {stats.appointments > 0 ? Math.round(((stats.appointmentsCompleted) / stats.appointments) * 100) : 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-300">Promedio Diario</p>
              <p className="text-2xl font-bold">{Math.round(stats.appointments / 30)}</p>
            </div>
            <div>
              <p className="text-gray-300">Registros/Paciente</p>
              <p className="text-2xl font-bold">
                {stats.patients > 0 ? (stats.medicalRecords / stats.patients).toFixed(1) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}