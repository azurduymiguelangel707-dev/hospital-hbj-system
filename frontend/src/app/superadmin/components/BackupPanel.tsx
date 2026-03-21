'use client';
import { useState, useEffect, useCallback } from 'react';
import { Database, Download, Trash2, RefreshCw, Plus, Shield, Clock, HardDrive, Table, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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

  const DB_TABLES = [
    { name: "Pacientes",       table: "patients",         color: "#3b82f6", icono: "🏥", desc: "Datos demograficos y clinicos" },
    { name: "Citas",           table: "appointments",     color: "#10b981", icono: "📅", desc: "Agendamiento y estados" },
    { name: "Historiales",     table: "medical_records",  color: "#8b5cf6", icono: "📋", desc: "Diagnosticos y tratamientos" },
    { name: "Signos vitales",  table: "vital_signs",      color: "#06b6d4", icono: "💓", desc: "PA, FC, temperatura, SpO2" },
    { name: "Documentos",      table: "documents",        color: "#f97316", icono: "📄", desc: "Imagenes y archivos medicos" },
    { name: "Usuarios",        table: "users",            color: "#f59e0b", icono: "👥", desc: "Cuentas y roles del sistema" },
    { name: "Medicos",         table: "doctors",          color: "#6366f1", icono: "🩺", desc: "Perfil y especialidades" },
    { name: "Audit blockchain",table: "blockchain_audit", color: "#ef4444", icono: "🔗", desc: "Registro SHA-256 inmutable" },
  ];

  return (
    <div className="flex gap-5 h-full">
      {toast && <Toast {...toast} />}

      {/* Columna principal */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" /> Backup y Recuperacion
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Respaldo completo de PostgreSQL — Sistema HBJ</p>
          </div>
          <button onClick={cargarBackups} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { icono: "🗄️", label: "Total backups",  val: backups.length,              color: "#3b82f6", bg: "#eff6ff", sub: "archivos disponibles" },
            { icono: "💾", label: "Espacio total",   val: formatSize(totalSize),       color: "#8b5cf6", bg: "#f5f3ff", sub: "almacenado" },
            { icono: "📊", label: "Tablas",          val: lastBackup?.tablas ?? "—",   color: "#10b981", bg: "#f0fdf4", sub: "en ultimo backup" },
            { icono: "🕐", label: "Ultimo backup",   val: lastBackup ? diasDesde(lastBackup.fechaCreacion) : "Nunca", color: "#f59e0b", bg: "#fffbeb", sub: lastBackup ? formatFecha(lastBackup.fechaCreacion).split(",")[0] : "Sin backups" },
          ].map((m, i) => (
            <div key={i} className="rounded-xl p-3 text-center border" style={{ backgroundColor: m.bg, borderColor: m.color + "30" }}>
              <div className="text-2xl mb-1">{m.icono}</div>
              <div className="text-xl font-bold" style={{ color: m.color }}>{m.val}</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: m.color }}>{m.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Crear backup */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Crear nuevo backup
          </p>
          <div className="flex gap-3">
            <input type="text" placeholder="Descripcion del backup (opcional)" value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={crearBackup} disabled={creando}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
              {creando ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Creando...</> : <><Database className="w-3.5 h-3.5" /> Crear Backup</>}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Incluye {DB_TABLES.length} tablas del sistema — datos cifrados en transito
          </div>
        </div>

        {/* Historial backups con scroll */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Historial de backups</p>
            <span className="text-xs text-gray-400">{backups.length} backup{backups.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                <span className="text-sm text-gray-400">Cargando backups...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <div className="text-4xl mb-2">🗄️</div>
                <p className="text-sm font-medium text-gray-400">Sin backups disponibles</p>
                <p className="text-xs text-gray-300 mt-1">Crea tu primer backup con el formulario de arriba</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {backups.map((backup, i) => (
                  <div key={backup.filename} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                    <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 " + (i === 0 ? "bg-blue-100" : "bg-gray-100")}>
                      <Database className={"w-4 h-4 " + (i === 0 ? "text-blue-600" : "text-gray-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-800 truncate">{backup.descripcion}</span>
                        {i === 0 && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex-shrink-0">Ultimo</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{diasDesde(backup.fechaCreacion)}</span>
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{backup.tamanoLegible}</span>
                        <span className="flex items-center gap-1"><Table className="w-3 h-3" />{backup.tablas} tablas</span>
                      </div>
                      <p className="text-xs font-mono text-gray-300 mt-0.5 truncate">{backup.filename}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => descargarBackup(backup.filename)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition">
                        <Download className="w-3 h-3" /> Descargar
                      </button>
                      <button onClick={() => restaurarBackup(backup.filename)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition">
                        <RefreshCw className="w-3 h-3" /> Restaurar
                      </button>
                      <button onClick={() => setConfirmDelete(backup.filename)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="w-64 flex-shrink-0 space-y-4">

        {/* Diagrama tablas incluidas */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos incluidos en backup</p>
            <p className="text-xs text-gray-400 mt-0.5">Todas las tablas del sistema</p>
          </div>
          <div className="p-3 space-y-1.5">
            {DB_TABLES.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition"
                style={{ borderLeft: "3px solid " + t.color }}>
                <span className="text-sm flex-shrink-0">{t.icono}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-700">{t.name}</p>
                  <p className="text-xs text-gray-400 truncate">{t.desc}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs text-emerald-700 font-medium">Backup 100% completo</span>
          </div>
        </div>

        {/* Info ultimo backup */}
        {lastBackup && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ultimo backup</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Fecha</span>
                <span className="text-xs font-medium text-gray-700">{diasDesde(lastBackup.fechaCreacion)}</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Tamano</span>
                <span className="text-xs font-bold text-blue-600">{lastBackup.tamanoLegible}</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Tablas</span>
                <span className="text-xs font-bold text-emerald-600">{lastBackup.tablas}</span>
              </div>
            </div>
            <button onClick={() => descargarBackup(lastBackup.filename)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
              <Download className="w-3.5 h-3.5" /> Descargar ultimo backup
            </button>
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
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition">
                Cancelar
              </button>
              <button onClick={() => eliminarBackup(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
