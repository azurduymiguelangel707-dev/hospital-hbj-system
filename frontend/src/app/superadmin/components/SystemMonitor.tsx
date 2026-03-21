// src/app/superadmin/components/SystemMonitor.tsx
'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Server, ShieldCheck, ShieldAlert } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string) {
  return fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

interface DbStat { table: string; count: number; }
interface SysInfo {
  version: string; uptime: number; totalRecords: number;
  dbStats: DbStat[]; nodeVersion: string;
  memoryUsage: { rss: number; heapTotal: number; heapUsed: number; };
}

const TABLE_LABELS: Record<string, string> = {
  patients: 'Pacientes', appointments: 'Citas', doctors: 'Medicos', users: 'Usuarios',
  medical_records: 'Historiales', vital_signs: 'Signos vitales', documents: 'Documentos',
  blockchain_audit: 'Audit blockchain',
};

const EVENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  CREATE: { label: 'Creaciones', color: 'bg-green-500', bg: 'bg-green-50' },
  UPDATE: { label: 'Modificaciones', color: 'bg-blue-500', bg: 'bg-blue-50' },
  DELETE: { label: 'Eliminaciones', color: 'bg-red-500', bg: 'bg-red-50' },
  ACCESS: { label: 'Accesos', color: 'bg-purple-500', bg: 'bg-purple-50' },
};

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}
function formatBytes(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

export function SystemMonitor() {
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [auditBlocks, setAuditBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  async function checkService(name: string, url: string, detail: string) {
    try {
      const t0 = Date.now();
      const res = await authFetch(url);
      const latency = Date.now() - t0;
      const status = res.status >= 500 ? 'error' : latency > 200 ? 'warn' : 'ok'; return { name, status, latency, detail };
    } catch {
      return { name, status: 'error', latency: null, detail };
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const [infoRes, auditRes] = await Promise.all([
        authFetch('/api/superadmin/system-info').then(r => r.json()).catch(() => null),
        authFetch('/api/audit?page=1&limit=1000').then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setSysInfo(infoRes);
      setAuditBlocks(auditRes.data ?? []);
      const checks = await Promise.all([
        checkService('API Backend', '/api/users/stats', 'Puerto 3001'),
        checkService('Base de datos', '/api/appointments/stats/dashboard', 'PostgreSQL 15'),
        checkService('Modulo Vitales', '/api/vital-signs', 'vital-signs'),
        checkService('Blockchain Audit', '/api/audit?page=1&limit=1', 'SHA-256'),
        checkService('Superadmin Guard', '/api/superadmin/db-stats', 'RBAC Guard'),
      ]);
      setServices(checks);
      setLastCheck(new Date());
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  // Calcular estadisticas de eventos
  const eventCounts: Record<string, number> = { CREATE: 0, UPDATE: 0, DELETE: 0, ACCESS: 0 };
  auditBlocks.forEach(b => { if (eventCounts[b.eventType] !== undefined) eventCounts[b.eventType]++; });
  const totalEvents = auditBlocks.length;
  const lastBlock = auditBlocks[0];
  const invalidBlocks = auditBlocks.filter(b => !b.isValid);
  const chainIntegrity = invalidBlocks.length === 0;


  return (
    <div className="flex gap-5">
      {/* Columna principal */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400" suppressHydrationWarning>
              {lastCheck ? "Ultima verificacion: " + lastCheck.toLocaleTimeString("es-ES") : "Sin verificar"}
            </p>
          </div>
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        {/* Estado servicios */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado de servicios</p>
          </div>
          <div className="divide-y divide-gray-50">
            {services.map(s => {
              const statusCfg = {
                ok:    { color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", label: "Operativo",  dot: "bg-emerald-500" },
                warn:  { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Lento",       dot: "bg-amber-400" },
                error: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", label: "Error",       dot: "bg-red-500" },
              }[s.status as string] ?? { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", label: "Desconocido", dot: "bg-gray-400" };
              return (
                <div key={s.name} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3">
                    <div className={"w-2 h-2 rounded-full " + statusCfg.dot} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.latency && (
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold" style={{ color: statusCfg.color }}>{s.latency}ms</span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                          <div className="h-1 rounded-full" style={{ width: Math.min((s.latency / 1000) * 100, 100) + "%", backgroundColor: statusCfg.color }} />
                        </div>
                      </div>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: statusCfg.color, backgroundColor: statusCfg.bg, border: "1px solid " + statusCfg.border }}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actividad auditoria */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actividad de auditoria</p>
            <span className="text-xs text-gray-400">{totalEvents} eventos totales</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(EVENT_LABELS).map(([key, { label, color, bg }]) => {
              const count = eventCounts[key] ?? 0;
              const pct = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
              return (
                <div key={key} className="rounded-xl p-3 border" style={{ backgroundColor: bg, borderColor: "#e5e7eb" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-lg font-bold text-gray-800">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                    <div className={"h-1.5 rounded-full transition-all " + color} style={{ width: pct + "%" }} />
                  </div>
                  <span className="text-xs text-gray-500">{pct}% del total</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registros por tabla */}
        {sysInfo && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registros en base de datos</p>
              <span className="text-xs text-gray-400">{(sysInfo?.dbStats ?? []).reduce((a: number, s: DbStat) => a + s.count, 0)} total</span>
            </div>
            <div className="divide-y divide-gray-50">
              {(sysInfo?.dbStats ?? []).map((s: DbStat) => {
                const total = (sysInfo?.dbStats ?? []).reduce((a: number, x: DbStat) => a + x.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                const tableColors: Record<string, string> = {
                  patients: "#3b82f6", appointments: "#10b981", doctors: "#8b5cf6",
                  users: "#f59e0b", medical_records: "#ec4899", vital_signs: "#06b6d4",
                  documents: "#f97316", blockchain_audit: "#ef4444",
                };
                const color = tableColors[s.table] ?? "#6b7280";
                return (
                  <div key={s.table} className="flex items-center gap-4 px-4 py-2.5 hover:bg-gray-50 transition">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-700">{TABLE_LABELS[s.table] ?? s.table}</span>
                        <span className="text-xs font-bold" style={{ color }}>{s.count}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1 rounded-full" style={{ width: pct + "%", backgroundColor: color }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral */}
      <div className="w-64 flex-shrink-0 space-y-4">

        {/* Integridad blockchain */}
        <div className={"rounded-xl border p-4 " + (chainIntegrity ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
          <div className="flex items-center gap-2 mb-2">
            {chainIntegrity
              ? <ShieldCheck size={16} className="text-emerald-600" />
              : <ShieldAlert size={16} className="text-red-600" />}
            <p className={"text-sm font-bold " + (chainIntegrity ? "text-emerald-800" : "text-red-800")}>
              Blockchain {chainIntegrity ? "INTEGRA ✓" : "COMPROMETIDA ✕"}
            </p>
          </div>
          <p className="text-xs text-gray-500">{totalEvents} bloques registrados</p>
          <p className={"text-xs font-medium mt-0.5 " + (invalidBlocks.length > 0 ? "text-red-600" : "text-emerald-600")}>
            {invalidBlocks.length === 0 ? "Sin bloques invalidos" : invalidBlocks.length + " bloque(s) invalido(s)"}
          </p>
          {lastBlock && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-400 mb-1">Ultimo hash</p>
              <p className="text-xs font-mono text-gray-600 break-all">{lastBlock.currentHash?.substring(0,20)}...</p>
            </div>
          )}
        </div>

        {/* Ultimo evento */}
        {lastBlock && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ultimo evento</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Tipo</span>
                <span className={"px-2 py-0.5 rounded-full text-xs font-semibold " + (EVENT_LABELS[lastBlock.eventType]?.bg ?? "")} style={{ color: lastBlock.eventType === "CREATE" ? "#10b981" : lastBlock.eventType === "ACCESS" ? "#8b5cf6" : lastBlock.eventType === "DELETE" ? "#ef4444" : "#3b82f6" }}>
                  {EVENT_LABELS[lastBlock.eventType]?.label ?? lastBlock.eventType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Recurso</span>
                <span className="text-xs font-medium text-gray-700">
                  {lastBlock.resourceType === "AUTH" ? "Autenticacion" : lastBlock.resourceType === "MEDICAL_RECORD" ? "Historial" : lastBlock.resourceType}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Bloque</span>
                <span className="text-xs font-mono font-bold text-gray-700">#{lastBlock.blockIndex}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Hora</span>
                <span className="text-xs text-gray-600">{new Date(lastBlock.timestamp).toLocaleTimeString("es-ES")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Runtime */}
        {sysInfo && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Runtime del servidor</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">⏱️</span>
                  <span className="text-xs text-gray-500">Tiempo activo</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">{formatUptime(sysInfo?.uptime ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧠</span>
                  <span className="text-xs text-gray-500">Memoria usada</span>
                </div>
                <span className="text-xs font-bold text-blue-600">{formatBytes(sysInfo?.memoryUsage?.heapUsed ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">💻</span>
                  <span className="text-xs text-gray-500">Node.js</span>
                </div>
                <span className="text-xs font-bold text-gray-600">{sysInfo?.nodeVersion ?? ""}</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Heap usado</span>
                  <span className="text-xs text-gray-600">{formatBytes(sysInfo?.memoryUsage?.heapUsed ?? 0)} / {formatBytes(sysInfo?.memoryUsage?.heapTotal ?? 0)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: sysInfo?.memoryUsage?.heapTotal > 0 ? Math.round((sysInfo.memoryUsage.heapUsed / sysInfo.memoryUsage.heapTotal) * 100) + "%" : "0%" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
