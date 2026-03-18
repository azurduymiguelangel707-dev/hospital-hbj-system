// src/app/superadmin/components/GlobalUserManager.tsx
'use client';
import { useState } from 'react';
import { Power, Key, Trash2, Edit2, X, Check, AlertTriangle, Shield } from 'lucide-react';

const API = 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

const ALL_ROLES = ['MEDICO', 'ENFERMERIA', 'ADMIN', 'SUPERADMIN', 'PACIENTE'];
const ROLE_COLORS: Record<string, string> = {
  MEDICO: 'bg-blue-100 text-blue-800', ENFERMERIA: 'bg-teal-100 text-teal-800',
  ADMIN: 'bg-purple-100 text-purple-800', SUPERADMIN: 'bg-red-100 text-red-800',
  PACIENTE: 'bg-gray-100 text-gray-600',
};

interface User { id: string; email: string; first_name: string; last_name: string; role: string; is_active: boolean; created_at: string; }
interface Props { users: User[]; onRefresh: () => void; }

export function GlobalUserManager({ users, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editRole, setEditRole] = useState<{ id: string; current: string } | null>(null);
  const [newRole, setNewRole] = useState('');
  const [resetResult, setResetResult] = useState<{ id: string; password: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = search === '' || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === '' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  async function handleToggle(id: string) {
    setLoading(id);
    await authFetch(`/api/superadmin/users/${id}/toggle-active`, { method: 'PATCH' });
    onRefresh(); setLoading(null);
  }

  async function handleResetPassword(id: string, nombre: string) {
    setLoading(id);
    const res = await authFetch(`/api/superadmin/users/${id}/reset-password`, { method: 'PATCH' });
    const data = await res.json();
    setResetResult({ id, password: data.newPassword });
    setLoading(null);
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`ELIMINAR permanentemente a ${nombre}?`)) return;
    setLoading(id);
    await authFetch(`/api/superadmin/users/${id}`, { method: 'DELETE' });
    onRefresh(); setLoading(null);
  }

  async function handleChangeRole(id: string) {
    if (!newRole) return;
    setLoading(id);
    await authFetch(`/api/superadmin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
    setEditRole(null); setNewRole('');
    onRefresh(); setLoading(null);
  }

  return (
    <div>
      {/* Reset password result */}
      {resetResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><Key size={14} /> Nueva contrasena generada</p>
            <p className="text-xs text-amber-700 mt-1">Comparte esto con el usuario de forma segura</p>
            <p className="font-mono text-lg font-bold text-amber-900 mt-2">{resetResult.password}</p>
          </div>
          <button onClick={() => setResetResult(null)} className="text-amber-400 hover:text-amber-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
          <option value="">Todos los roles</option>
          {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Usuario', 'Codigo', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(u => (
              <>
                <tr key={u.id} className={`hover:bg-gray-50 transition ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{u.first_name} {u.last_name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {editRole?.id === u.id ? (
                      <div className="flex items-center gap-1">
                        <select value={newRole || u.role} onChange={e => setNewRole(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
                          {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                        <button onClick={() => handleChangeRole(u.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setEditRole(null)} className="p-1 text-red-400 hover:bg-red-50 rounded">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditRole({ id: u.id, current: u.role }); setNewRole(u.role); }}
                        title="Cambiar rol" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition">
                        <Shield size={13} />
                      </button>
                      <button onClick={() => handleToggle(u.id)} disabled={loading === u.id}
                        title={u.is_active ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded-lg transition ${u.is_active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`}>
                        <Power size={13} />
                      </button>
                      <button onClick={() => handleResetPassword(u.id, `${u.first_name} ${u.last_name}`)} disabled={loading === u.id}
                        title="Reset contrasena" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition">
                        <Key size={13} />
                      </button>
                      <button onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)} disabled={loading === u.id}
                        title="Eliminar permanentemente" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">{filtered.length} de {users.length} usuarios</p>
    </div>
  );
}
