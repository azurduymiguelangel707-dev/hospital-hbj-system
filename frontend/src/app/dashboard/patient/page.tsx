// frontend/src/app/dashboard/patient/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Stethoscope, Plus, XCircle, AlertCircle, CheckCircle } from 'lucide-react';

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  notes?: string;
  doctor?: {
    user?: {
      first_name: string;
      last_name: string;
    };
    specialty: string;
  };
}

interface Doctor {
  id: string;
  specialty: string;
  consultation_fee: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, doctorsRes] = await Promise.all([
        fetch('http://localhost:3001/api/appointments'),
        fetch('http://localhost:3001/api/doctors')
      ]);
      
      const appsData = await appsRes.json();
      const doctorsData = await doctorsRes.json();
      
      // En producción, esto filtraría por el ID del paciente autenticado
      setAppointments(appsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    try {
      // En producción, obtendría el patientId del usuario autenticado
      const patients = await fetch('http://localhost:3001/api/patients').then(r => r.json());
      const patientId = patients[0]?.id;

      if (!patientId) {
        alert('No se pudo obtener el ID del paciente');
        return;
      }

      const response = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          ...formData,
          status: 'AGENDADA',
          durationMinutes: 30
        })
      });
      
      if (response.ok) {
        await fetchData();
        closeModal();
        alert('¡Cita agendada exitosamente!');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error al agendar la cita');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: 'Cancelada por el paciente' })
      });
      
      if (response.ok) {
        await fetchData();
        alert('Cita cancelada exitosamente');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const openModal = () => {
    setFormData({
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      reason: '',
      notes: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'EN_ESPERA': return 'bg-green-100 text-green-800 border-green-300';
      case 'AGENDADA': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EN_CONSULTA': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMPLETADA': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ANULADA': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'EN_ESPERA': return <CheckCircle size={16} className="text-green-600" />;
      case 'COMPLETADA': return <CheckCircle size={16} className="text-blue-600" />;
      case 'ANULADA': return <XCircle size={16} className="text-red-600" />;
      case 'AGENDADA': return <Clock size={16} className="text-yellow-600" />;
      default: return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  // Separar citas próximas y pasadas
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments
    .filter(app => app.appointmentDate.split('T')[0] >= today && app.status !== 'ANULADA' && app.status !== 'COMPLETADA')
    .sort((a, b) => {
      const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return a.appointmentTime.localeCompare(b.appointmentTime);
    });

  const pastAppointments = appointments
    .filter(app => app.appointmentDate.split('T')[0] < today || app.status === 'COMPLETADA' || app.status === 'ANULADA')
    .sort((a, b) => {
      const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
      if (dateCompare !== 0) return dateCompare;
      return b.appointmentTime.localeCompare(a.appointmentTime);
    })
    .slice(0, 10); // Solo las últimas 10

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mi Portal de Paciente</h1>
          <p className="text-gray-600 mt-1">Gestiona tus citas médicas</p>
        </div>

        {/* Quick Action */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">¿Necesitas una consulta médica?</h2>
              <p className="text-blue-100">Agenda tu cita con nuestros especialistas</p>
            </div>
            <button
              onClick={openModal}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center"
            >
              <Plus className="mr-2" size={20} />
              Agendar Cita
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Próximas Citas</p>
                <p className="text-3xl font-bold text-blue-600">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Citas Completadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'COMPLETADA').length}
                </p>
              </div>
              <CheckCircle className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Citas</p>
                <p className="text-3xl font-bold text-purple-600">{appointments.length}</p>
              </div>
              <Stethoscope className="text-purple-600" size={40} />
            </div>
          </div>
        </div>

        {/* Próximas Citas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Mis Próximas Citas</h2>
          
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="mb-2">No tienes citas programadas</p>
              <button
                onClick={openModal}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Agendar una cita ahora
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map(app => (
                <div key={app.id} className="border-2 border-blue-100 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {new Date(app.appointmentDate).getDate()}
                          </div>
                          <div className="text-xs text-blue-600 uppercase">
                            {new Date(app.appointmentDate).toLocaleDateString('es-ES', { month: 'short' })}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="text-gray-400" size={16} />
                            <span className="font-bold text-lg text-gray-800">
                              {app.appointmentTime.substring(0, 5)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(app.status)}`}>
                              {getStatusIcon(app.status)}
                              {app.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-700 mb-1">
                            <Stethoscope className="mr-2 text-blue-500" size={18} />
                            <span className="font-semibold">
                              {app.doctor?.user 
                                ? `Dr(a). ${app.doctor.user.first_name} ${app.doctor.user.last_name}` 
                                : 'Médico no asignado'}
                            </span>
                          </div>
                          
                          {app.doctor?.specialty && (
                            <div className="text-sm text-gray-600 mb-1">
                              <span className="font-semibold">Especialidad:</span> {app.doctor.specialty}
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">Motivo:</span> {app.reason}
                          </div>
                          
                          {app.notes && (
                            <div className="text-xs text-gray-500 mt-2 italic">
                              {app.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {(app.status === 'AGENDADA' || app.status === 'EN_ESPERA') && (
                      <button
                        onClick={() => handleCancelAppointment(app.id)}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition ml-4"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial de Citas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Citas</h2>
          
          {pastAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tienes historial de citas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastAppointments.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(app.appointmentDate).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.appointmentTime.substring(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {app.doctor?.user 
                          ? `Dr(a). ${app.doctor.user.first_name} ${app.doctor.user.last_name}` 
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.doctor?.specialty || 'N/A'}
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

        {/* Modal Agendar Cita */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Agendar Nueva Cita</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona un Médico</label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar médico...</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.user ? `Dr(a). ${d.user.first_name} ${d.user.last_name}` : 'Sin nombre'} - {d.specialty} (Bs. {d.consultation_fee})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <input
                      type="time"
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData({...formData, appointmentTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la Consulta</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Control general, dolor abdominal..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales (Opcional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Información adicional que el médico deba saber..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBookAppointment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Confirmar Cita
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}