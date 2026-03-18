'use client';
import { useState, useEffect, useCallback } from 'react';
import { Database, Download, Trash2, RefreshCw, Plus, Shield, Clock, HardDrive, Table, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const API = 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string, options: RequestInit = {}) {
  return fetch(`${API}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers ?? {}) }
  });
}

interface BackupInfo { filename: string; descripcion: string; fechaCreacion: string; tamanoBytes: number; tamanoLegible: string; tablas: number; }
interface ToastProps { message: string; type: 'success' | 'error' | 'info'; }

function Toast({ message, type }: ToastProps) {
  const colors = { success: 'bg-green-50 border-green-400 text-green-800', error: 'bg-red-50 border-red-400 text-red-800', info: 'bg-blue-50 border-blue-400 text-blue-800' };
  const icons = { success: <CheckCircle className="w-5 h-5 text-green-500" />, error: <XCircle className="w-5 h-5 text-red-500" />, info: <Shield className="w-5 h-5 text-blue-500" /> };
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl border-l-4 shadow-lg ${colors[type]}`}>
      {icons[type]}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
}

export function BackupPanel() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<BackupInfo | null>(null);

  const showToast = (message: string, type: ToastProps['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarBackups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/superadmin/backup/listar');
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setBackups(lista);
      setLastBackup(lista[0] ?? null);
    } catch {
      showToast('Error al cargar los backups', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarBackups(); }, [cargarBackups]);

  const crearBackup = async () => {
    try {
      setCreando(true);
      showToast('Creando backup... esto puede tardar unos segundos', 'info');
      const res = await authFetch('/api/superadmin/backup/crear', {
        method: 'POST',
        body: JSON.stringify({ descripcion: descripcion || 'Backup manual' }),
      });
      if (!res.ok) throw new Error('Error al crear backup');
      const data: BackupInfo = await res.json();
      showToast('Backup creado: ' + data.tamanoLegible + ' - ' + data.tablas + ' tablas', 'success');
      setDescripcion('');
      await cargarBackups();
    } catch (e: any) {
      showToast('Error al crear el backup: ' + e.message, 'error');
    } finally {
      setCreando(false);
    }
  };

  const descargarBackup = async (filename: string) => {
    try {
      const res = await fetch(`${API}/api/superadmin/backup/descargar/${filename}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Error al descargar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      showToast('Descarga iniciada', 'success');
    } catch {
      showToast('Error al descargar el backup', 'error');
    }
  };

  const eliminarBackup = async (filename: string) => {
    try {
      const res = await authFetch(`/api/superadmin/backup/${filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      showToast('Backup eliminado correctamente', 'success');
      setConfirmDelete(null);
      await cargarBackups();
    } catch {
      showToast('Error al eliminar el backup', 'error');
    }
  };

  const restaurarBackup = async (filename: string) => {
    try {
      showToast('Restaurando backup... esto puede tardar unos segundos', 'info');
      const res = await authFetch(`/api/superadmin/backup/restaurar/${filename}`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al restaurar');
      const data = await res.json();
      showToast(data.mensaje ?? 'Backup restaurado correctamente', 'success');
      await cargarBackups();
    } catch (e: any) {
      showToast('Error al restaurar: ' + e.message, 'error');
    }
  };

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const diasDesde = (iso: string) => {
    const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return 'Hace ' + dias + ' dias';
  };

  const totalSize = backups.reduce((s, b) => s + b.tamanoBytes, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="w-7 h-7 text-blue-600" />
            Backup y Recuperacion
          </h2>
          <p className="text-gray-500 mt-1 text-sm">Respaldo completo de la base de datos PostgreSQL del sistema HBJ</p>
        </div>
        <button onClick={cargarBackups} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Metricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: <Database className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-50', label: 'Total Backups', value: backups.length.toString(), sub: 'archivos disponibles' },
          { icon: <HardDrive className="w-6 h-6 text-purple-500" />, bg: 'bg-purple-50', label: 'Espacio Total', value: formatSize(totalSize), sub: 'almacenado' },
          { icon: <Table className="w-6 h-6 text-green-500" />, bg: 'bg-green-50', label: 'Tablas', value: lastBackup ? lastBackup.tablas.toString() : '12', sub: 'en ultimo backup' },
          { icon: <Clock className="w-6 h-6 text-orange-500" />, bg: 'bg-orange-50', label: 'Ultimo Backup', value: lastBackup ? diasDesde(lastBackup.fechaCreacion) : 'Nunca', sub: lastBackup ? formatFecha(lastBackup.fechaCreacion).split(' a las ')[0] : 'Sin backups' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-11 h-11 ${m.bg} rounded-xl flex items-center justify-center mb-3`}>{m.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            <div className="text-sm font-semibold text-gray-700 mt-0.5">{m.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Crear backup */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" /> Crear Nuevo Backup
        </h3>
        <div className="flex gap-3">
          <input type="text" placeholder="Descripcion del backup (opcional)" value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={crearBackup} disabled={creando}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
            {creando ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creando...</> : <><Database className="w-4 h-4" /> Crear Backup</>}
          </button>
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-gray-400">
          <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <span>El backup incluye todas las tablas del sistema: pacientes, citas, historiales, signos vitales, documentos, usuarios, medicos y registros blockchain.</span>
        </div>
      </div>

      {/* Lista de backups */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Historial de Backups</h3>
          <span className="text-sm text-gray-400">{backups.length} backup{backups.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-500">Cargando backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Database className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Sin backups disponibles</p>
            <p className="text-sm mt-1">Crea tu primer backup usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {backups.map((backup, i) => (
              <div key={backup.filename} className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-blue-50/40' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Database className={`w-5 h-5 ${i === 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 truncate">{backup.descripcion}</span>
                    {i === 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">ULTIMO</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{formatFecha(backup.fechaCreacion)}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><HardDrive className="w-3 h-3" />{backup.tamanoLegible}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Table className="w-3 h-3" />{backup.tablas} tablas</span>
                  </div>
                  <div className="text-xs text-gray-300 font-mono mt-0.5 truncate">{backup.filename}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => descargarBackup(backup.filename)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-colors">
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </button>
                  <button onClick={() => restaurarBackup(backup.filename)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Restaurar
                  </button>
                  <button onClick={() => setConfirmDelete(backup.filename)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmar eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar Backup</h3>
                <p className="text-sm text-gray-500">Esta accion no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-mono text-gray-600 break-all">{confirmDelete}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={() => eliminarBackup(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}