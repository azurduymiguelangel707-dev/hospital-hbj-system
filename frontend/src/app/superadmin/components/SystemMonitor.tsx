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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{lastCheck ? `Ultima verificacion: ${lastCheck.toLocaleTimeString('es-ES')}` : 'Verificando...'}</p>
        <button onClick={loadData} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 transition">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Estado de servicios */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Estado de servicios</p>
        <div className="space-y-2">
          {services.map(s => (
            <div key={s.name} className={`flex items-center justify-between border rounded-lg px-4 py-3 ${s.status === 'ok' ? 'bg-green-50 border-green-200' : s.status === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3">
                <Server size={14} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.latency && <span className="text-xs text-gray-400">{s.latency}ms</span>}
                {s.status === 'ok' ? <CheckCircle size={14} className="text-green-500" /> : s.status === 'warn' ? <AlertTriangle size={14} className="text-amber-500" /> : <XCircle size={14} className="text-red-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integridad del sistema */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Integridad del sistema</p>
        <div className={`border rounded-xl p-4 mb-3 flex items-start gap-3 ${chainIntegrity ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {chainIntegrity
            ? <ShieldCheck size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
            : <ShieldAlert size={18} className="text-red-600 mt-0.5 flex-shrink-0" />}
          <div className="flex-1">
            <p className={`text-sm font-semibold ${chainIntegrity ? 'text-green-800' : 'text-red-800'}`}>
              Cadena blockchain — {chainIntegrity ? 'INTEGRA' : 'COMPROMETIDA'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{totalEvents} bloques registrados — {invalidBlocks.length} bloques invalidos</p>
            {lastBlock && (
              <p className="text-xs font-mono text-gray-400 mt-1">Ultimo hash: {lastBlock.currentHash?.substring(0, 24)}...</p>
            )}
          </div>
        </div>

        {lastBlock && (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Ultimo evento registrado</p>
            <div className="flex items-center justify-between">
              <div>
<p className="text-sm font-medium text-gray-700">{lastBlock.resourceType==='AUTH'?'Autenticacion':lastBlock.resourceType==='MEDICAL_RECORD'?'Historial medico':lastBlock.resourceType==='VITAL_SIGNS'?'Signos vitales':lastBlock.resourceType==='DOCUMENTS'?'Documentos':lastBlock.resourceType==='USERS'?'Usuarios':lastBlock.resourceType} — {lastBlock.eventType==='CREATE'?'Creacion':lastBlock.eventType==='UPDATE'?'Modificacion':lastBlock.eventType==='DELETE'?'Eliminacion':lastBlock.eventType==='ACCESS'?'Acceso':lastBlock.eventType}</p>
                <p className="text-xs text-gray-400">{new Date(lastBlock.timestamp).toLocaleString('es-ES')}</p>
              </div>
              <span className="text-xs font-mono text-gray-400">Bloque #{lastBlock.blockIndex}</span>
            </div>
          </div>
        )}
      </div>

      {/* Eventos por tipo */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actividad de auditoria por tipo</p>
        <div className="space-y-2">
          {Object.entries(EVENT_LABELS).map(([key, { label, color, bg }]) => {
            const count = eventCounts[key] ?? 0;
            const pct = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
            return (
              <div key={key} className={`${bg} border border-gray-100 rounded-xl px-4 py-3`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-700">{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{pct}%</span>
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">Total eventos: {totalEvents}</p>
      </div>

      {/* Registros por tabla */}
      {sysInfo && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registros por tabla</p>
          <div className="grid grid-cols-4 gap-2">
            {(sysInfo?.dbStats ?? []).map(s => (
              <div key={s.table} className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-xs text-gray-500">{TABLE_LABELS[s.table] ?? s.table}</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{s.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runtime */}
      {sysInfo && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Runtime del servidor</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-500">Tiempo activo</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{formatUptime((sysInfo?.uptime ?? 0))}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-500">Memoria usada</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{formatBytes((sysInfo?.memoryUsage?.heapUsed ?? 0))}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-xs text-gray-500">Node.js</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{(sysInfo?.nodeVersion ?? '')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
