'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Stethoscope, Phone, Mail, Award } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Doctor {
  id: string;
  userId: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  consultationFee?: number;
  yearsExperience?: number;
  user?: User;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialty: '',
    licenseNumber: '',
    phone: '',
    consultationFee: '',
    yearsExperience: ''
  });

  const especialidades = [
    "Medicina General",
    "PediatrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "CardiologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "DermatologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "GinecologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "TraumatologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "NeurologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "OftalmologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "OtorrinolaringologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "PsiquiatrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "UrologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "OncologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "EndocrinologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "NeumologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a",
    "GastroenterologÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a"
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/doctors');
      const data = await response.json();
      setDoctors(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Crear usuario
      const userResponse = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: 'MEDICO',
          keycloakId: `keycloak-${Date.now()}`
        })
      });

      if (!userResponse.ok) {
        throw new Error('Error al crear usuario');
      }

      const userData = await userResponse.json();

      // 2. Crear mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico
      const doctorResponse = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          phone: formData.phone,
          consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : undefined,
          yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined
        })
      });

      if (!doctorResponse.ok) {
        throw new Error('Error al crear mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico');
      }

      // Resetear formulario y recargar lista
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        specialty: '',
        licenseNumber: '',
        phone: '',
        consultationFee: '',
        yearsExperience: ''
      });
      setShowForm(false);
      fetchDoctors();
      alert('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico creado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Error al crear mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿EstÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ seguro de eliminar este mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico?')) return;

    try {
      await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/doctors/${id}`, {
        method: 'DELETE'
      });
      fetchDoctors();
      alert('ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico eliminado');
    } catch (error) {
      console.error('Error:', error);
      alert('ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ Error al eliminar mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Cargando mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dicos...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">GestiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dicos</h1>
          <p className="text-gray-600 mt-1">Total: {doctors.length} mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dicos registrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus size={20} />
          {showForm ? 'Cancelar' : 'Nuevo MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Agregar Nuevo MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Roberto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: SÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡nchez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="dr.sanchez@hospital.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad *
              </label>
              <select
                required
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccione una especialidad</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºmero de Licencia *
              </label>
              <input
                type="text"
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: LIC-003"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TelÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©fono *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+591-70009999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarifa de Consulta (Bs) - Opcional
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.consultationFee}
                onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="200.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±os de Experiencia - Opcional
              </label>
              <input
                type="number"
                value={formData.yearsExperience}
                onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5"
              />
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Guardar MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    Dr(a). {doctor.user?.firstName} {doctor.user?.lastName}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">{doctor.specialty}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} />
                <span className="text-sm">{doctor.user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <span className="text-sm">{doctor.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Award size={16} />
                <span className="text-sm">Lic: {doctor.licenseNumber}</span>
              </div>
            </div>

            {(doctor.consultationFee || doctor.yearsExperience) && (
              <div className="border-t pt-3 mb-3">
                {doctor.consultationFee && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tarifa:</span> Bs {doctor.consultationFee}
                  </p>
                )}
                {doctor.yearsExperience && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Experiencia:</span> {doctor.yearsExperience} aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±os
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition">
                <Edit size={16} />
                Editar
              </button>
              <button
                onClick={() => handleDelete(doctor.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {doctors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Stethoscope size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No hay mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dicos registrados</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:underline"
          >
            Agregar el primer mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dico
          </button>
        </div>
      )}
    </div>
  );
}