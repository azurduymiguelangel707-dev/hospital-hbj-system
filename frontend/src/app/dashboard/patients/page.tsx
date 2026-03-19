// frontend/src/app/dashboard/patients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Search, Plus, Edit, Trash2, X, Save } from 'lucide-react';

interface Patient {
  id: string;
  nombre: string;
  ci: string;
  edad: number;
  genero: string;
  tipoSangre: string;
  telefono: string;
  email: string;
  direccion: string;
  alergias?: string;
  medicamentos?: string;
  condiciones?: string;
  cirugias?: string;
  contactoEmergencia?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ci: '',
    edad: '',
    genero: 'Masculino',
    tipoSangre: '',
    telefono: '',
    email: '',
    direccion: '',
    alergias: '',
    medicamentos: '',
    condiciones: '',
    cirugias: '',
    contactoEmergencia: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/patients');
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          edad: parseInt(formData.edad)
        })
      });
      
      if (response.ok) {
        await fetchPatients();
        closeModal();
      }
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingPatient) return;
    
    try {
      const response = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/patients/${editingPatient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          edad: parseInt(formData.edad)
        })
      });
      
      if (response.ok) {
        await fetchPatients();
        closeModal();
      }
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ãƒâ€šÃ‚Â¿EstÃƒÆ’Ã‚Â¡s seguro de eliminar este paciente?')) return;
    
    try {
      const response = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/patients/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchPatients();
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const openCreateModal = () => {
    setEditingPatient(null);
    setFormData({
      nombre: '',
      ci: '',
      edad: '',
      genero: 'Masculino',
      tipoSangre: '',
      telefono: '',
      email: '',
      direccion: '',
      alergias: '',
      medicamentos: '',
      condiciones: '',
      cirugias: '',
      contactoEmergencia: ''
    });
    setShowModal(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      nombre: patient.nombre,
      ci: patient.ci,
      edad: patient.edad.toString(),
      genero: patient.genero,
      tipoSangre: patient.tipoSangre,
      telefono: patient.telefono,
      email: patient.email,
      direccion: patient.direccion,
      alergias: patient.alergias || '',
      medicamentos: patient.medicamentos || '',
      condiciones: patient.condiciones || '',
      cirugias: patient.cirugias || '',
      contactoEmergencia: patient.contactoEmergencia || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPatient(null);
  };

  const filteredPatients = patients.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ci.includes(searchTerm) ||
    p.telefono.includes(searchTerm) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Cargando pacientes...</div>
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
                <User className="mr-3 text-blue-600" size={32} />
                GestiÃƒÆ’Ã‚Â³n de Pacientes
              </h1>
              <p className="text-gray-600 mt-1">Total: {patients.length} pacientes registrados</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition"
            >
              <Plus className="mr-2" size={20} />
              Nuevo Paciente
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, CI, telÃƒÆ’Ã‚Â©fono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TelÃƒÆ’Ã‚Â©fono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Sangre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron pacientes
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{patient.nombre}</div>
                        <div className="text-sm text-gray-500">{patient.genero}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {patient.ci}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {patient.edad} aÃƒÆ’Ã‚Â±os
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {patient.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {patient.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {patient.tipoSangre}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openEditModal(patient)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Juan Perez Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carnet de Identidad</label>
                  <input
                    type="text"
                    value={formData.ci}
                    onChange={(e) => setFormData({...formData, ci: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="LP-1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                  <input
                    type="number"
                    value={formData.edad}
                    onChange={(e) => setFormData({...formData, edad: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GÃƒÆ’Ã‚Â©nero</label>
                  <select
                    value={formData.genero}
                    onChange={(e) => setFormData({...formData, genero: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sangre</label>
                  <select
                    value={formData.tipoSangre}
                    onChange={(e) => setFormData({...formData, tipoSangre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TelÃƒÆ’Ã‚Â©fono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+591 71234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">DirecciÃƒÆ’Ã‚Â³n</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Av. 6 de Agosto 1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                  <input
                    type="text"
                    value={formData.alergias}
                    onChange={(e) => setFormData({...formData, alergias: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Penicilina, mariscos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de Emergencia</label>
                  <input
                    type="text"
                    value={formData.contactoEmergencia}
                    onChange={(e) => setFormData({...formData, contactoEmergencia: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre y telÃƒÆ’Ã‚Â©fono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medicamentos Actuales</label>
                  <textarea
                    value={formData.medicamentos}
                    onChange={(e) => setFormData({...formData, medicamentos: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Lista de medicamentos que toma actualmente..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones MÃƒÆ’Ã‚Â©dicas</label>
                  <textarea
                    value={formData.condiciones}
                    onChange={(e) => setFormData({...formData, condiciones: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="HipertensiÃƒÆ’Ã‚Â³n, diabetes..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">CirugÃƒÆ’Ã‚Â­as Previas</label>
                  <textarea
                    value={formData.cirugias}
                    onChange={(e) => setFormData({...formData, cirugias: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Detalle de cirugÃƒÆ’Ã‚Â­as anteriores..."
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
                  onClick={editingPatient ? handleUpdate : handleCreate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition"
                >
                  <Save className="mr-2" size={18} />
                  {editingPatient ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}