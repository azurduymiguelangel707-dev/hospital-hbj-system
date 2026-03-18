// frontend/src/app/dashboard/appointments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Search, Filter, CheckCircle, XCircle, User, Stethoscope } from 'lucide-react';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  notes?: string;
  durationMinutes: number;
  patient?: {
    nombre: string;
    telefono: string;
  };
  doctor?: {
    user?: {
      first_name: string;
      last_name: string;
    };
    specialty: string;
  };
}

interface Patient {
  id: string;
  nombre: string;
}

interface Doctor {
  id: string;
  specialty: string;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    notes: '',
    durationMinutes: 30
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, patientsRes, doctorsRes] = await Promise.all([
        fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/appointments'),
        fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/patients'),
        fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/doctors')
      ]);
      
      const appsData = await appsRes.json();
      const patientsData = await patientsRes.json();
      const doctorsData = await doctorsRes.json();
      
      setAppointments(appsData);
      setPatients(patientsData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'AGENDADA'
        })
      });
      
      if (response.ok) {
        await fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Â¿EstÃ¡s seguro de cancelar esta cita?')) return;
    
    try {
      const response = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: 'Cancelada por el usuario' })
      });
      
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      reason: '',
      notes: '',
      durationMinutes: 30
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
      case 'COMPLETADA': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ANULADA': return 'bg-red-100 text-red-800 border-red-300';
      case 'NO_ASISTIO': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'EN_CONSULTA': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'EN_ESPERA': return <CheckCircle size={16} className="text-green-600" />;
      case 'COMPLETADA': return <CheckCircle size={16} className="text-blue-600" />;
      case 'ANULADA': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-yellow-600" />;
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const patientName = app.patient?.nombre || '';
    const doctorName = app.doctor?.user ? `${app.doctor.user.first_name} ${app.doctor.user.last_name}` : '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Agrupar citas por fecha
  const groupedByDate = filteredAppointments.reduce((acc, app) => {
    const date = app.appointmentDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(groupedByDate).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Cargando citas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Calendar className="mr-3 text-blue-600" size={32} />
                GestiÃ³n de Citas
              </h1>
              <p className="text-gray-600 mt-1">Total: {appointments.length} citas registradas</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition"
            >
              <Plus className="mr-2" size={20} />
              Nueva Cita
            </button>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por paciente, mÃ©dico o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="AGENDADA">Agendada</option>
              <option value="EN_ESPERA">En espera</option>
              <option value="EN_CONSULTA">En consulta</option>
              <option value="COMPLETADA">Completada</option>
              <option value="ANULADA">Anulada</option>
              <option value="NO_ASISTIO">No AsistiÃ³</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {['AGENDADA', 'EN_ESPERA', 'EN_CONSULTA', 'COMPLETADA', 'ANULADA', 'NO_ASISTIO'].map(status => {
            const count = appointments.filter(a => a.status === status).length;
            return (
              <div key={status} className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-xs text-gray-600 mt-1">{status.replace('_', ' ')}</div>
              </div>
            );
          })}
        </div>

        {/* Timeline de citas */}
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              No se encontraron citas
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Calendar className="mr-2 text-blue-600" size={20} />
                  {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    ({groupedByDate[date].length} citas)
                  </span>
                </h3>
                
                <div className="space-y-3">
                  {groupedByDate[date]
                    .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
                    .map(app => (
                      <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-bold text-blue-600">
                                {app.appointmentTime.substring(0, 5)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(app.status)}`}>
                                {getStatusIcon(app.status)}
                                {app.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center text-gray-700">
                                <User className="mr-2 text-gray-400" size={16} />
                                <span className="font-semibold">Paciente:</span>
                                <span className="ml-2">{app.patient?.nombre || 'No especificado'}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-700">
                                <Stethoscope className="mr-2 text-gray-400" size={16} />
                                <span className="font-semibold">Doctor:</span>
                                <span className="ml-2">
                                  {app.doctor?.user ? `Dr(a). ${app.doctor.user.first_name} ${app.doctor.user.last_name}` : 'No especificado'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-semibold">Motivo:</span> {app.reason}
                            </div>
                            
                            {app.notes && (
                              <div className="mt-2 text-xs text-gray-500 italic">
                                <span className="font-semibold">Notas:</span> {app.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            {app.status === 'AGENDADA' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(app.id, 'EN_ESPERA')}
                                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => handleCancel(app.id)}
                                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                            {app.status === 'EN_ESPERA' && (
                              <button
                                onClick={() => handleStatusChange(app.id, 'EN_CONSULTA')}
                                className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition"
                              >
                                Iniciar
                              </button>
                            )}
                            {app.status === 'EN_CONSULTA' && (
                              <button
                                onClick={() => handleStatusChange(app.id, 'COMPLETADA')}
                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
                              >
                                Completar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Nueva Cita */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Agendar Nueva Cita</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">MÃ©dico</label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar mÃ©dico...</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.user ? `Dr(a). ${d.user.first_name} ${d.user.last_name}` : 'Sin nombre'} - {d.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la Consulta</label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Control general, dolor abdominal..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="InformaciÃ³n adicional..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DuraciÃ³n (minutos)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="15"
                    step="15"
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
                  onClick={handleCreate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Agendar Cita
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}