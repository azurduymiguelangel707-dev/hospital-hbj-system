// src/app/superadmin/components/GlobalUserManager.tsx
'use client';
import { useState } from 'react';
import { Power, Key, Trash2, X, Check, Shield, Search, Users } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) } });
}

const ALL_ROLES = ['MEDICO', 'ENFERMERIA', 'ADMIN', 'SUPERADMIN', 'PACIENTE'];

const ROLE_CFG: Record<string, { color: string; bg: string; border: string; icono: string; label: string }> = {
  MEDICO:     { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icono: '🩺', label: 'Medico' },
  ENFERMERIA: { color: '#0d9488', bg: '#f0fdf4', border: '#99f6e4', icono: '💉', label: 'Enfermeria' },
  ADMIN:      { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icono: '⚙️', label: 'Admin' },
  SUPERADMIN: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icono: '🔐', label: 'Superadmin' },
  PACIENTE:   { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icono: '👤', label: 'Paciente' },
};

interface User { id: string; email: string; first_name: string; last_name: string; role: string; is_active: boolean; created_at: string; codigo?: string; }
interface Props { users: User[]; onRefresh: () => void; }

export function GlobalUserManager({ users, onRefresh }: Props) {
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editRole, setEditRole]     = useState<{ id: string; current: string } | null>(null);
  const [newRole, setNewRole]       = useState('');
  const [resetResult, setResetResult] = useState<{ id: string; nombre: string; password: string } | null>(null);
  const [loading, setLoading]       = useState<string | null>(null);
  const [sortBy, setSortBy]         = useState<'nombre'|'rol'|'fecha'>('rol');

  const filtered = users
    .filter(u => {
      const matchSearch = search === '' || `${u.first_name} ${u.last_name} ${u.email} ${u.codigo ?? ''}`.toLowerCase().includes(search.toLowerCase());
      const matchRole   = filterRole === '' || u.role === filterRole;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === 'nombre') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      if (sortBy === 'rol')    return a.role.localeCompare(b.role);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const statsByRole = ALL_ROLES.map(r => ({
    role: r,
    count: users.filter(u => u.role === r).length,
    active: users.filter(u => u.role === r && u.is_active).length,
  })).filter(s => s.count > 0);

  async function handleToggle(id: string) {
    setLoading(id);
    await authFetch(`/api/superadmin/users/${id}/toggle-active`, { method: 'PATCH' });
    onRefresh(); setLoading(null);
  }

  async function handleResetPassword(id: string, nombre: string) {
    setLoading(id);
    const res  = await authFetch(`/api/superadmin/users/${id}/reset-password`, { method: 'PATCH' });
    const data = await res.json();
    setResetResult({ id, nombre, password: data.newPassword });
    setLoading(null);
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`ELIMINAR permanentemente a ${nombre}?\nEsta accion no se puede deshacer.`)) return;
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
    <div className="flex gap-5 h-full">
      {/* Columna principal */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Reset password result */}
        {resetResult && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start justify-between flex-shrink-0">
            <div>
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <Key size={14} /> Nueva contrasena para {resetResult.nombre}
              </p>
              <p className="text-xs text-amber-600 mt-1">Comparte esto con el usuario de forma segura y privada</p>
              <p className="font-mono text-xl font-bold text-amber-900 mt-2 bg-amber-100 px-3 py-1.5 rounded-lg inline-block">{resetResult.password}</p>
            </div>
            <button onClick={() => setResetResult(null)} className="text-amber-400 hover:text-amber-600 ml-4">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Buscador y filtros */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-300" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o codigo..."
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs px-1">✕</button>}
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="rol">Ordenar por rol</option>
            <option value="nombre">Ordenar por nombre</option>
            <option value="fecha">Ordenar por fecha</option>
          </select>
        </div>

        {/* Pills de rol activo */}
        <div className="flex gap-1.5 mb-3 flex-wrap flex-shrink-0">
          <button onClick={() => setFilterRole('')}
            className={"px-3 py-1.5 rounded-full text-xs font-medium border transition " +
              (filterRole === '' ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}>
            Todos ({users.length})
          </button>
          {statsByRole.map(s => {
            const cfg = ROLE_CFG[s.role];
            return (
              <button key={s.role} onClick={() => setFilterRole(filterRole === s.role ? '' : s.role)}
                className={"px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5 " +
                  (filterRole === s.role ? "text-white" : "bg-white hover:opacity-80")}
                style={filterRole === s.role
                  ? { backgroundColor: cfg.color, borderColor: cfg.color, color: 'white' }
                  : { color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
                <span>{cfg.icono}</span>
                {cfg.label} ({s.count})
              </button>
            );
          })}
        </div>

        {/* Tabla con scroll interno */}
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0">
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  {['Usuario', 'Codigo / Email', 'Rol', 'Estado', 'Alta', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => {
                  const cfg = ROLE_CFG[u.role] ?? ROLE_CFG.PACIENTE;
                  const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition ${!u.is_active ? 'opacity-50' : ''}`}>
                      {/* Usuario */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: cfg.bg, color: cfg.color, border: '1px solid ' + cfg.border }}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{u.first_name} {u.last_name}</p>
                            {!u.is_active && <p className="text-xs text-red-400">Cuenta desactivada</p>}
                          </div>
                        </div>
                      </td>
                      {/* Codigo / Email */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-gray-600">{u.email}</p>
                      </td>
                      {/* Rol */}
                      <td className="px-4 py-3">
                        {editRole?.id === u.id ? (
                          <div className="flex items-center gap-1">
                            <select value={newRole || u.role} onChange={e => setNewRole(e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>)}
                            </select>
                            <button onClick={() => handleChangeRole(u.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setEditRole(null)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"
                            style={{ color: cfg.color, backgroundColor: cfg.bg, border: '1px solid ' + cfg.border }}>
                            <span>{cfg.icono}</span> {cfg.label}
                          </span>
                        )}
                      </td>
                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {u.is_active ? '● Activo' : '○ Inactivo'}
                        </span>
                      </td>
                      {/* Fecha */}
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditRole({ id: u.id, current: u.role }); setNewRole(u.role); }}
                            title="Cambiar rol" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition">
                            <Shield size={13} />
                          </button>
                          <button onClick={() => handleToggle(u.id)} disabled={loading === u.id}
                            title={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                            className={`p-1.5 rounded-lg transition ${u.is_active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`}>
                            <Power size={13} />
                          </button>
                          <button onClick={() => handleResetPassword(u.id, `${u.first_name} ${u.last_name}`)} disabled={loading === u.id}
                            title="Resetear contrasena" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition">
                            <Key size={13} />
                          </button>
                          <button onClick={() => handleDelete(u.id, `${u.first_name} ${u.last_name}`)} disabled={loading === u.id}
                            title="Eliminar permanentemente" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer tabla */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-gray-400">{filtered.length} de {users.length} usuarios</span>
            <span className="text-xs text-gray-400">{users.filter(u => u.is_active).length} activos · {users.filter(u => !u.is_active).length} inactivos</span>
          </div>
        </div>
      </div>

      {/* Panel lateral - stats */}
      <div className="w-56 flex-shrink-0 space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Users size={12} /> Distribucion
          </p>
          <div className="space-y-2">
            {statsByRole.map(s => {
              const cfg = ROLE_CFG[s.role];
              const pct = users.length > 0 ? Math.round((s.count / users.length) * 100) : 0;
              return (
                <div key={s.role}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs flex items-center gap-1" style={{ color: cfg.color }}>
                      <span>{cfg.icono}</span> {cfg.label}
                    </span>
                    <span className="text-xs font-bold" style={{ color: cfg.color }}>{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full" style={{ width: pct + '%', backgroundColor: cfg.color }} />
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">{s.active} activos</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Acciones</p>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-lg">
              <Shield size={11} className="text-blue-500" /> Cambiar rol del usuario
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-red-50 rounded-lg">
              <Power size={11} className="text-red-400" /> Activar / Desactivar cuenta
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 rounded-lg">
              <Key size={11} className="text-amber-500" /> Resetear contrasena
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
              <Trash2 size={11} className="text-gray-400" /> Eliminar permanentemente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
