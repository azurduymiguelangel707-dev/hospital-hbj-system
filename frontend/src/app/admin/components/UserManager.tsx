// src/app/admin/components/UserManager.tsx
'use client';
import { useState } from 'react';
import { Plus, Edit2, Power, Key, Trash2, X, Check, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

const ROLES = ['MEDICO', 'ENFERMERIA', 'ADMIN'];
const ROLE_COLORS: Record<string, string> = {
  MEDICO: 'bg-blue-100 text-blue-800', ENFERMERIA: 'bg-teal-100 text-teal-800',
  ADMIN: 'bg-purple-100 text-purple-800', SUPERADMIN: 'bg-red-100 text-red-800',
  FARMACIA: 'bg-amber-100 text-amber-800', LABORATORIO: 'bg-green-100 text-green-800',
  PACIENTE: 'bg-gray-100 text-gray-600',
};

interface User { id: string; email: string; first_name: string; last_name: string; role: string; is_active: boolean; created_at: string; }
interface NewUserForm { firstName: string; lastName: string; role: string; email: string; password: string; especialidad: string; }

const EMPTY_FORM: NewUserForm = { firstName: '', lastName: '', role: 'MEDICO', email: '', password: '', especialidad: '' };

interface Props { users: User[]; onRefresh: () => void; }

export function UserManager({ users, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ codigoAcceso: string; passwordTemporal: string } | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [resetInfo, setResetInfo] = useState<{ id: string; nombre: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const filtered = users.filter(u => {
    const matchSearch = search === '' || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === '' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.role) { setError('Nombre, apellido y rol son requeridos'); return; }
    setSaving(true); setError('');
    try {
      const res = await authFetch('/api/users/create-full', {
        method: 'POST',
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, role: form.role, email: form.email || undefined, password: form.password || undefined, especialidad: form.especialidad }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message ?? 'Error'); }
      const data = await res.json();
      setResult({ codigoAcceso: data.codigoAcceso, passwordTemporal: data.passwordTemporal });
      setForm(EMPTY_FORM);
      onRefresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleToggle(id: string) {
    await authFetch(`/api/users/${id}/toggle-active`, { method: 'PATCH' });
    onRefresh();
  }

  async function handleResetPassword(id: string) {
    const res = await authFetch(`/api/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({}) });
    const data = await res.json();
    alert(`Nueva contrasena: ${data.newPassword}`);
    onRefresh();
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`Eliminar a ${nombre}? Esta accion no se puede deshacer.`)) return;
    await authFetch(`/api/users/${id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-1 mr-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o codigo..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
            <option value="">Todos los roles</option>
            {[...ROLES, 'PACIENTE'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={() => { setShowModal(true); setResult(null); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium">
          <Plus size={14} /> Nuevo usuario
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Usuario', 'Codigo / Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Sin usuarios</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 transition ${!u.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-800">{u.first_name} {u.last_name}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleToggle(u.id)} title={u.is_active ? 'Desactivar' : 'Activar'}
                      className={`p-1.5 rounded-lg transition ${u.is_active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`}>
                      <Power size={13} />
                    </button>
                    <button onClick={() => handleResetPassword(u.id)} title="Reset contrasena"
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition">
                      <Key size={13} />
                    </button>
                    <button onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)} title="Eliminar"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-800">Crear nuevo usuario</h3>
              <button onClick={() => { setShowModal(false); setResult(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {result ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 text-green-700 mb-4">
                  <Check size={18} /> <span className="font-semibold">Usuario creado exitosamente</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                    <span className="text-gray-500">Codigo de acceso:</span>
                    <span className="font-mono font-bold text-gray-800">{result.codigoAcceso}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                    <span className="text-gray-500">Contrasena temporal:</span>
                    <span className="font-mono font-bold text-gray-800">{result.passwordTemporal}</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-3 flex items-center gap-1">
                  <AlertTriangle size={11} /> Guarda estas credenciales â€” no se mostraran de nuevo
                </p>
                <button onClick={() => { setShowModal(false); setResult(null); }}
                  className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                    <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Juan" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Apellido *</label>
                    <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Perez" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Rol *</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {form.role === 'MEDICO' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Especialidad</label>
                    <input value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Cardiologia" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Codigo de acceso <span className="text-gray-400">(opcional â€” se genera automaticamente)</span></label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono" placeholder="MED-123456" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Contrasena <span className="text-gray-400">(opcional â€” se genera automaticamente)</span></label>
                  <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Dejar vacio para generar" />
                </div>
                {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCreate} disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium text-sm">
                    {saving ? 'Creando...' : 'Crear usuario'}
                  </button>
                  <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

