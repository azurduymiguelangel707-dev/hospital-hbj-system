// src/app/superadmin/components/GlobalUserManager.tsx
'use client';
import { useState } from 'react';
import { Power, Key, Trash2, X, Check, Shield, Search, Users, UserPlus } from 'lucide-react';

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
  const [modalUser, setModalUser]   = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createResult, setCreateResult] = useState<{ codigo: string; password: string; nombre: string } | null>(null);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', role: 'MEDICO', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const filtered = users
    .filter(u => u && u.role)
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
    role: r, count: users.filter(u => u.role === r).length, active: users.filter(u => u.role === r && u.is_active).length,
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

  async function handleCreateUser() {
    if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
      alert('Nombre y apellido son obligatorios');
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch('/api/users/create-full', {
        method: 'POST',
        body: JSON.stringify({
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          role: createForm.role,
          email: createForm.email.trim() || undefined,
          password: createForm.password.trim() || undefined,
        }),
      });
      const data = await res.json();
      setCreateResult({ codigo: data.codigoAcceso, password: data.passwordTemporal, nombre: `${createForm.firstName} ${createForm.lastName}` });
      setCreateForm({ firstName: '', lastName: '', role: 'MEDICO', email: '', password: '' });
      setShowCreateModal(false);
      onRefresh();
    } catch (e) {
      alert('Error al crear usuario');
    }
    setCreating(false);
  }

  return (
    <div className="flex gap-5 h-full">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Resultado creacion */}
        {createResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-start justify-between flex-shrink-0">
            <div>
              <p className="text-sm font-semibold text-emerald-800">✅ Usuario creado: {createResult.nombre}</p>
              <p className="text-xs text-emerald-600 mt-1">Comparte estas credenciales de forma segura</p>
              <div className="flex gap-3 mt-2">
                <div className="bg-emerald-100 px-3 py-1.5 rounded-lg">
                  <p className="text-xs text-emerald-600">Codigo</p>
                  <p className="font-mono text-sm font-bold text-emerald-900">{createResult.codigo}</p>
                </div>
                <div className="bg-emerald-100 px-3 py-1.5 rounded-lg">
                  <p className="text-xs text-emerald-600">Contrasena</p>
                  <p className="font-mono text-sm font-bold text-emerald-900">{createResult.password}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setCreateResult(null)} className="text-emerald-400 hover:text-emerald-600 ml-4"><X size={16} /></button>
          </div>
        )}

        {/* Reset password result */}
        {resetResult && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start justify-between flex-shrink-0">
            <div>
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">🔑 Nueva contrasena para {resetResult.nombre}</p>
              <p className="text-xs text-amber-600 mt-1">Comparte esto con el usuario de forma segura y privada</p>
              <p className="font-mono text-xl font-bold text-amber-900 mt-2 bg-amber-100 px-3 py-1.5 rounded-lg inline-block">{resetResult.password}</p>
            </div>
            <button onClick={() => setResetResult(null)} className="text-amber-400 hover:text-amber-600 ml-4"><X size={16} /></button>
          </div>
        )}

        {/* Buscador, filtros y boton crear */}
        <div className="flex gap-2 mb-4 flex-shrink-0">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-gray-300 text-sm">🔍</span>
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
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-sm flex-shrink-0">
            <UserPlus size={15} /> Nuevo Usuario
          </button>
        </div>

        {/* Pills de rol */}
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
                <span>{cfg.icono}</span>{cfg.label} ({s.count})
              </button>
            );
          })}
        </div>

        {/* Tabla */}
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
                    <tr key={u.id} onClick={() => setModalUser(u)} className={`hover:bg-gray-50 transition cursor-pointer ${!u.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: cfg.bg, color: cfg.color, border: '1px solid ' + cfg.border }}>{initials}</div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{u.first_name} {u.last_name}</p>
                            {!u.is_active && <p className="text-xs text-red-400">Cuenta desactivada</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><p className="text-xs font-mono text-gray-600">{u.email}</p></td>
                      <td className="px-4 py-3">
                        {editRole?.id === u.id ? (
                          <div className="flex items-center gap-1">
                            <select value={newRole || u.role} onChange={e => setNewRole(e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>)}
                            </select>
                            <button onClick={() => handleChangeRole(u.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"><Check size={12} /></button>
                            <button onClick={() => setEditRole(null)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"><X size={12} /></button>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"
                            style={{ color: cfg.color, backgroundColor: cfg.bg, border: '1px solid ' + cfg.border }}>
                            <span>{cfg.icono}</span> {cfg.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {u.is_active ? '● Activo' : '○ Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <div className="flex flex-col items-center gap-1.5 px-3 py-3 bg-blue-50 rounded-xl">
  <Shield size={16} className="text-blue-700" />
  <select
    defaultValue={modalUser.role}
    onChange={async e => {
  e.stopPropagation();
  const newRoleVal = e.target.value;
  const userId = modalUser!.id;
  await authFetch(`/api/superadmin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRoleVal }) });
  setModalUser(null);
  setTimeout(() => onRefresh(), 300);
}}
    className="text-xs text-blue-700 font-medium bg-transparent border-none outline-none cursor-pointer">
    {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>)}
  </select>
</div>
                          <button onClick={e => { e.stopPropagation(); handleToggle(u.id); }} disabled={loading === u.id}
                            title={u.is_active ? 'Desactivar' : 'Activar'}
                            className={`p-1.5 rounded-lg transition ${u.is_active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`}>
                            <Power size={12} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleResetPassword(u.id, `${u.first_name} ${u.last_name}`); }} disabled={loading === u.id}
                            title="Resetear contrasena" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition"><Key size={12} /></button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(u.id, `${u.first_name} ${u.last_name}`); }} disabled={loading === u.id}
                            title="Eliminar" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No se encontraron usuarios</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-gray-400">{filtered.length} de {users.length} usuarios</span>
            <span className="text-xs text-gray-400">{users.filter(u => u.is_active).length} activos · {users.filter(u => !u.is_active).length} inactivos</span>
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="w-56 flex-shrink-0 space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            👥 Distribucion
          </p>
          <div className="space-y-2">
            {statsByRole.map(s => {
              const cfg = ROLE_CFG[s.role];
              const pct = users.length > 0 ? Math.round((s.count / users.length) * 100) : 0;
              return (
                <div key={s.role}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs flex items-center gap-1" style={{ color: cfg.color }}><span>{cfg.icono}</span> {cfg.label}</span>
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
            <button onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition font-medium">
              <UserPlus size={12} /> Crear nuevo usuario
            </button>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-lg">🛡️ Cambiar r ol del usuario</div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-red-50 rounded-lg"><Power size={12} /> Activar / Desactivar cuenta</div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 rounded-lg">🔑 Resetear contrasena</div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">🗑️ Eliminar  permanentemente</div>
          </div>
        </div>
      </div>

      {/* Modal crear usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><UserPlus size={18} className="text-blue-600" /> Crear nuevo usuario</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X size={16} className="text-gray-500" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre *</label>
                  <input value={createForm.firstName} onChange={e => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Ej: Juan" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Apellido *</label>
                  <input value={createForm.lastName} onChange={e => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Ej: Perez" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Rol *</label>
                <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Codigo de acceso <span className="text-gray-400 font-normal">(opcional — se genera automático)</span></label>
                <input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Ej: MED-123456" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Contrasena <span className="text-gray-400 font-normal">(opcional — se genera automático)</span></label>
                <input value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Dejar vacío para generar" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                💡 Si no especificas codigo ni contrasena, el sistema los generará automáticamente. Guarda las credenciales que aparecerán al crear el usuario.
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button onClick={handleCreateUser} disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? 'Creando...' : <><UserPlus size={14} /> Crear usuario</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle usuario */}
      {modalUser && (() => {
        const cfg = ROLE_CFG[modalUser.role] ?? ROLE_CFG.PACIENTE;
        const initials = `${modalUser.first_name?.[0] ?? ''}${modalUser.last_name?.[0] ?? ''}`.toUpperCase();
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalUser(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Detalle de usuario</h3>
                <button onClick={() => setModalUser(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><X size={16} className="text-gray-500" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
                    style={{ backgroundColor: cfg.bg, color: cfg.color, border: '2px solid ' + cfg.border }}>{initials}</div>
                  <div>
                    <p className="text-xl font-bold text-gray-800">{modalUser.first_name} {modalUser.last_name}</p>
                    <p className="text-sm text-gray-400">{modalUser.email}</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold mt-1"
                      style={{ color: cfg.color, backgroundColor: cfg.bg, border: '1px solid ' + cfg.border }}>
                      {cfg.icono} {cfg.label}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Estado", val: modalUser.is_active ? "Activo" : "Inactivo", color: modalUser.is_active ? "#10b981" : "#ef4444" },
                    { label: "Codigo", val: modalUser.email, color: "#6b7280" },
                    { label: "Alta", val: new Date(modalUser.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), color: "#6b7280" },
                    { label: "Rol", val: cfg.label, color: cfg.color },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
                      <p className="text-sm font-semibold" style={{ color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                  <button onClick={e => { e.stopPropagation(); setEditRole({ id: modalUser.id, current: modalUser.role }); setNewRole(modalUser.role); setModalUser(null); }}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition">
                    <Shield size={16} /><span className="text-xs font-medium">Cambiar rol</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleToggle(modalUser.id); setModalUser(null); }}
                    className={"flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl transition " + (modalUser.is_active ? "bg-red-50 hover:bg-red-100 text-red-600" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600")}>
                    <Power size={16} /><span className="text-xs font-medium">{modalUser.is_active ? "Desactivar" : "Activar"}</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleResetPassword(modalUser.id, modalUser.first_name + ' ' + modalUser.last_name); setModalUser(null); }}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition">
                    <Key size={16} /><span className="text-xs font-medium">Reset pass</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
