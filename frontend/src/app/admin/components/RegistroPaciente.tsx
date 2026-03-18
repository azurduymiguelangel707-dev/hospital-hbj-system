// src/app/admin/components/RegistroPaciente.tsx
'use client';
import { useState } from 'react';
import { Search, UserPlus, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const API = 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

const ESPECIALIDADES = ['Traumatologia', 'Otorrinolaringologia', 'Cardiologia', 'Gastroenterologia', 'Neurologia'];
const GENEROS = ['Masculino', 'Femenino'];
const SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface Props { onPatientReady: (patient: any) => void; }

export function RegistroPaciente({ onPatientReady }: Props) {
  const [ciSearch, setCiSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPatient, setSavedPatient] = useState<any>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '', ci: '', edad: '', genero: 'Masculino', tipoSangre: 'O+',
    telefono: '', email: '', direccion: '',
    especialidadRequerida: 'Cardiologia',
    anamnesis: '', diagnosticosPresuntivos: '',
    fc: '', fr: '', pa: '', temperatura: '', peso: '',
  });

  async function buscarCI() {
    if (!ciSearch.trim()) return;
    setSearching(true); setFound(null); setNotFound(false); setError('');
    try {
      const res = await authFetch(`/api/patients/buscar?ci=${ciSearch.trim()}`);
      const data = await res.json();
      if (data?.id) {
        setFound(data);
      } else {
        setNotFound(true);
        setForm(f => ({ ...f, ci: ciSearch.trim() }));
      }
    } catch { setNotFound(true); setForm(f => ({ ...f, ci: ciSearch.trim() })); }
    finally { setSearching(false); }
  }

  async function handleGuardar() {
    if (!form.nombre || !form.ci || !form.edad || !form.genero) {
      setError('Nombre, CI, edad y genero son requeridos'); return;
    }
    setSaving(true); setError('');
    try {
      // 1. Crear paciente
      const resP = await authFetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre.toUpperCase(),
          ci: form.ci,
          edad: parseInt(form.edad),
          genero: form.genero,
          tipoSangre: form.tipoSangre,
          telefono: form.telefono,
          email: form.email || `${form.ci}@hbj.bo`,
          direccion: form.direccion,
          especialidadRequerida: form.especialidadRequerida,
          anamnesis: form.anamnesis,
          diagnosticosPresuntivos: form.diagnosticosPresuntivos,
        }),
      });
      if (!resP.ok) { const e = await resP.json(); throw new Error(e.message ?? 'Error al crear paciente'); }
      const patient = await resP.json();

      // 2. Guardar vitales iniciales si se llenaron
      if (form.fc || form.fr || form.pa || form.temperatura || form.peso) {
        await authFetch('/api/vital-signs', {
          method: 'POST',
          body: JSON.stringify({
            patientId: patient.id,
            presionArterial: form.pa,
            frecuenciaCardiaca: form.fc ? Number(form.fc) : null,
            frecuenciaRespiratoria: form.fr ? Number(form.fr) : null,
            temperatura: form.temperatura ? Number(form.temperatura) : null,
            peso: form.peso ? Number(form.peso) : null,
            registeredBy: 'ADMIN',
          }),
        });
      }

      setSavedPatient(patient);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  // Paciente guardado exitosamente
  if (savedPatient) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={20} className="text-green-600" />
          <h3 className="text-base font-semibold text-green-800">Paciente registrado exitosamente</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'N° Historial', value: savedPatient.numeroHistorial, highlight: true },
            { label: 'Nombre', value: savedPatient.nombre },
            { label: 'CI', value: savedPatient.ci },
            { label: 'Especialidad', value: savedPatient.especialidadRequerida },
          ].map(item => (
            <div key={item.label} className={`rounded-lg px-4 py-3 border ${item.highlight ? 'bg-white border-green-300' : 'bg-white border-green-200'}`}>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`font-semibold ${item.highlight ? 'text-green-700 text-lg' : 'text-gray-800'}`}>{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onPatientReady(savedPatient)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <ChevronRight size={14} /> Agendar cita para este paciente
          </button>
          <button onClick={() => { setSavedPatient(null); setCiSearch(''); setFound(null); setNotFound(false); setForm({ nombre: '', ci: '', edad: '', genero: 'Masculino', tipoSangre: 'O+', telefono: '', email: '', direccion: '', especialidadRequerida: 'Cardiologia', anamnesis: '', diagnosticosPresuntivos: '', fc: '', fr: '', pa: '', temperatura: '', peso: '' }); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            Registrar otro paciente
          </button>
        </div>
      </div>
    );
  }

  // Paciente encontrado
  if (found) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-blue-600" />
          <p className="text-sm font-semibold text-blue-800">Paciente encontrado en el sistema</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'N° Historial', value: found.numeroHistorial ?? 'Sin asignar' },
            { label: 'Nombre', value: found.nombre },
            { label: 'CI', value: found.ci },
            { label: 'Edad', value: `${found.edad} anos` },
            { label: 'Genero', value: found.genero },
            { label: 'Especialidad previa', value: found.especialidadRequerida ?? '-' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-lg px-3 py-2 border border-blue-200">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onPatientReady(found)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            <ChevronRight size={14} /> Agendar cita para este paciente
          </button>
          <button onClick={() => { setFound(null); setCiSearch(''); }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
            Buscar otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Busqueda por CI */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Buscar paciente por Cedula de Identidad</p>
        <div className="flex gap-2">
          <input value={ciSearch} onChange={e => setCiSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscarCI()}
            placeholder="Ej: 7075807"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={buscarCI} disabled={searching}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium">
            <Search size={14} /> {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {notFound && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle size={11} /> Paciente no encontrado. Complete el formulario para registrarlo.
          </p>
        )}
      </div>

      {/* Formulario nuevo paciente */}
      {notFound && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <UserPlus size={15} /> Registro de nuevo paciente
          </h3>

          {/* Datos personales */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Nombre completo *</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase" placeholder="NOMBRE APELLIDO APELLIDO" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">C.I. *</label>
                <input value={form.ci} onChange={e => setForm(f => ({ ...f, ci: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Edad *</label>
                <input type="number" value={form.edad} onChange={e => setForm(f => ({ ...f, edad: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sexo *</label>
                <select value={form.genero} onChange={e => setForm(f => ({ ...f, genero: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  {GENEROS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tipo de sangre</label>
                <select value={form.tipoSangre} onChange={e => setForm(f => ({ ...f, tipoSangre: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                  {SANGRE.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefono</label>
                <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Domicilio</label>
                <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Zona, calle, numero" />
              </div>
            </div>
          </div>

          {/* Datos clinicos */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos clinicos iniciales</p>
            <div className="grid grid-cols-5 gap-3 mb-3">
              {[
                { label: 'F.C. (lpm)', key: 'fc', placeholder: '72' },
                { label: 'F.R. (rpm)', key: 'fr', placeholder: '16' },
                { label: 'P.A. (mmHg)', key: 'pa', placeholder: '120/80', text: true },
                { label: 'Temp. (°C)', key: 'temperatura', placeholder: '36.5' },
                { label: 'Peso (kg)', key: 'peso', placeholder: '70' },
              ].map(({ label, key, placeholder, text }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input type={text ? 'text' : 'number'} step="0.1"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Especialidad requerida *</label>
              <select value={form.especialidadRequerida} onChange={e => setForm(f => ({ ...f, especialidadRequerida: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Anamnesis */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen clinico</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Resumen de anamnesis clinico</label>
                <textarea value={form.anamnesis} onChange={e => setForm(f => ({ ...f, anamnesis: e.target.value }))}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Descripcion del motivo de consulta, historia clinica relevante..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Diagnosticos presuntivos</label>
                <textarea value={form.diagnosticosPresuntivos} onChange={e => setForm(f => ({ ...f, diagnosticosPresuntivos: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Posibles diagnosticos basados en la hoja de referencia..." />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}

          <button onClick={handleGuardar} disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm">
            {saving ? 'Registrando paciente...' : 'Registrar paciente y generar numero de historial'}
          </button>
        </div>
      )}
    </div>
  );
}
