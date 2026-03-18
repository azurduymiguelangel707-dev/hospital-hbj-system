// frontend/src/app/dashboard/medical-records/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Search, User, Stethoscope, Calendar, Heart, Activity, X, Save } from 'lucide-react';

interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: string;
  symptoms: string;
  diagnosis: string;
  treatment?: string;
  prescriptions?: string;
  notes?: string;
  vitalSigns?: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  followUpDate?: string;
  patient?: {
    nombre: string;
    edad: number;
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

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    visitDate: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    notes: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    followUpDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, patientsRes, doctorsRes] = await Promise.all([
        fetch('http://localhost:3001/api/medical-records'),
        fetch('http://localhost:3001/api/patients'),
        fetch('http://localhost:3001/api/doctors')
      ]);
      
      setRecords(await recordsRes.json());
      setPatients(await patientsRes.json());
      setDoctors(await doctorsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const vitalSigns: any = {};
      if (formData.bloodPressure) vitalSigns.blood_pressure = formData.bloodPressure;
      if (formData.heartRate) vitalSigns.heart_rate = parseInt(formData.heartRate);
      if (formData.temperature) vitalSigns.temperature = parseFloat(formData.temperature);
      if (formData.weight) vitalSigns.weight = parseFloat(formData.weight);
      if (formData.height) vitalSigns.height = parseFloat(formData.height);

      const response = await fetch('http://localhost:3001/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          visitDate: formData.visitDate,
          symptoms: formData.symptoms,
          diagnosis: formData.diagnosis,
          treatment: formData.treatment,
          prescriptions: formData.prescriptions,
          notes: formData.notes,
          vitalSigns: Object.keys(vitalSigns).length > 0 ? vitalSigns : null,
          followUpDate: formData.followUpDate || null
        })
      });
      
      if (response.ok) {
        await fetchData();
        closeModal();
        alert('Historial médico registrado exitosamente');
      }
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const openCreateModal = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      visitDate: new Date().toISOString().split('T')[0],
      symptoms: '',
      diagnosis: '',
      treatment: '',
      prescriptions: '',
      notes: '',
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      followUpDate: ''
    });
    setViewingRecord(null);
    setShowModal(true);
  };

  const openViewModal = (record: MedicalRecord) => {
    setViewingRecord(record);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setViewingRecord(null);
  };

  const filteredRecords = records.filter(record => {
    const patientName = record.patient?.nombre || '';
    const doctorName = record.doctor?.user 
      ? `${record.doctor.user.first_name} ${record.doctor.user.last_name}` 
      : '';
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPatient = !selectedPatient || record.patientId === selectedPatient;
    
    return matchesSearch && matchesPatient;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Cargando registros médicos...</div>
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
                <FileText className="mr-3 text-blue-600" size={32} />
                Historial Clínico Electrónico
              </h1>
              <p className="text-gray-600 mt-1">Total: {records.length} registros médicos</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition"
            >
              <Plus className="mr-2" size={20} />
              Nuevo Registro
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por paciente, médico o diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los pacientes</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Registros</p>
                <p className="text-3xl font-bold text-blue-600">{records.length}</p>
              </div>
              <FileText className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pacientes</p>
                <p className="text-3xl font-bold text-green-600">
                  {new Set(records.map(r => r.patientId)).size}
                </p>
              </div>
              <User className="text-green-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Este Mes</p>
                <p className="text-3xl font-bold text-purple-600">
                  {records.filter(r => {
                    const date = new Date(r.visitDate);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="text-purple-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Seguimientos</p>
                <p className="text-3xl font-bold text-orange-600">
                  {records.filter(r => r.followUpDate).length}
                </p>
              </div>
              <Activity className="text-orange-600" size={40} />
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Registros Médicos</h2>
          
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <p>No se encontraron registros médicos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map(record => (
                <div 
                  key={record.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => openViewModal(record)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(record.visitDate).toLocaleDateString('es-ES')}
                        </span>
                        {record.followUpDate && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Requiere seguimiento
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center text-gray-700">
                          <User className="mr-2 text-gray-400" size={16} />
                          <span className="font-semibold">Paciente:</span>
                          <span className="ml-2">{record.patient?.nombre || 'No especificado'}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-700">
                          <Stethoscope className="mr-2 text-gray-400" size={16} />
                          <span className="font-semibold">Doctor:</span>
                          <span className="ml-2">
                            {record.doctor?.user 
                              ? `Dr(a). ${record.doctor.user.first_name} ${record.doctor.user.last_name}` 
                              : 'No especificado'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold">Diagnóstico:</span> {record.diagnosis}
                      </div>
                      
                      {record.vitalSigns && (
                        <div className="flex gap-4 text-xs text-gray-500 mt-2">
                          {record.vitalSigns.blood_pressure && (
                            <span className="flex items-center">
                              <Heart size={14} className="mr-1 text-red-500" />
                              PA: {record.vitalSigns.blood_pressure}
                            </span>
                          )}
                          {record.vitalSigns.heart_rate && (
                            <span>FC: {record.vitalSigns.heart_rate} bpm</span>
                          )}
                          {record.vitalSigns.temperature && (
                            <span>Temp: {record.vitalSigns.temperature}°C</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {viewingRecord ? 'Ver Registro Médico' : 'Nuevo Registro Médico'}
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              {viewingRecord ? (
                /* View Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Fecha de Visita</label>
                      <p className="text-gray-800">{new Date(viewingRecord.visitDate).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Paciente</label>
                      <p className="text-gray-800">{viewingRecord.patient?.nombre}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Doctor</label>
                      <p className="text-gray-800">
                        {viewingRecord.doctor?.user 
                          ? `Dr(a). ${viewingRecord.doctor.user.first_name} ${viewingRecord.doctor.user.last_name}` 
                          : 'No especificado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Especialidad</label>
                      <p className="text-gray-800">{viewingRecord.doctor?.specialty}</p>
                    </div>
                  </div>

                  {viewingRecord.vitalSigns && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                        <Activity className="mr-2 text-blue-600" size={20} />
                        Signos Vitales
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {viewingRecord.vitalSigns.blood_pressure && (
                          <div>
                            <span className="text-xs text-gray-600">Presión Arterial</span>
                            <p className="font-semibold">{viewingRecord.vitalSigns.blood_pressure}</p>
                          </div>
                        )}
                        {viewingRecord.vitalSigns.heart_rate && (
                          <div>
                            <span className="text-xs text-gray-600">Frecuencia Cardíaca</span>
                            <p className="font-semibold">{viewingRecord.vitalSigns.heart_rate} bpm</p>
                          </div>
                        )}
                        {viewingRecord.vitalSigns.temperature && (
                          <div>
                            <span className="text-xs text-gray-600">Temperatura</span>
                            <p className="font-semibold">{viewingRecord.vitalSigns.temperature}°C</p>
                          </div>
                        )}
                        {viewingRecord.vitalSigns.weight && (
                          <div>
                            <span className="text-xs text-gray-600">Peso</span>
                            <p className="font-semibold">{viewingRecord.vitalSigns.weight} kg</p>
                          </div>
                        )}
                        {viewingRecord.vitalSigns.height && (
                          <div>
                            <span className="text-xs text-gray-600">Altura</span>
                            <p className="font-semibold">{viewingRecord.vitalSigns.height} cm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Síntomas</label>
                    <p className="text-gray-800 mt-1">{viewingRecord.symptoms}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Diagnóstico</label>
                    <p className="text-gray-800 mt-1">{viewingRecord.diagnosis}</p>
                  </div>

                  {viewingRecord.treatment && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Tratamiento</label>
                      <p className="text-gray-800 mt-1">{viewingRecord.treatment}</p>
                    </div>
                  )}

                  {viewingRecord.prescriptions && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Prescripciones</label>
                      <p className="text-gray-800 mt-1">{viewingRecord.prescriptions}</p>
                    </div>
                  )}

                  {viewingRecord.notes && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Notas Adicionales</label>
                      <p className="text-gray-800 mt-1">{viewingRecord.notes}</p>
                    </div>
                  )}

                  {viewingRecord.followUpDate && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <label className="text-sm font-semibold text-orange-800">Fecha de Seguimiento</label>
                      <p className="text-orange-900 mt-1">
                        {new Date(viewingRecord.followUpDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Create Mode */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                    <select
                      value={formData.patientId}
                      onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar paciente...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Médico *</label>
                    <select
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccionar médico...</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.user ? `Dr(a). ${d.user.first_name} ${d.user.last_name}` : 'Sin nombre'} - {d.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Visita *</label>
                    <input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Seguimiento</label>
                    <input
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Signos Vitales</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Presión Arterial</label>
                        <input
                          type="text"
                          value={formData.bloodPressure}
                          onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})}
                          placeholder="120/80"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Frecuencia Cardíaca (bpm)</label>
                        <input
                          type="number"
                          value={formData.heartRate}
                          onChange={(e) => setFormData({...formData, heartRate: e.target.value})}
                          placeholder="72"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Temperatura (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.temperature}
                          onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                          placeholder="36.5"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Peso (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.weight}
                          onChange={(e) => setFormData({...formData, weight: e.target.value})}
                          placeholder="70"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Altura (cm)</label>
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => setFormData({...formData, height: e.target.value})}
                          placeholder="170"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas *</label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describa los síntomas del paciente..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico *</label>
                    <textarea
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Diagnóstico médico..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento</label>
                    <textarea
                      value={formData.treatment}
                      onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Plan de tratamiento..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prescripciones</label>
                    <textarea
                      value={formData.prescriptions}
                      onChange={(e) => setFormData({...formData, prescriptions: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Medicamentos recetados..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {viewingRecord ? 'Cerrar' : 'Cancelar'}
                </button>
                {!viewingRecord && (
                  <button
                    onClick={handleCreate}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <Save className="mr-2" size={18} />
                    Guardar Registro
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}