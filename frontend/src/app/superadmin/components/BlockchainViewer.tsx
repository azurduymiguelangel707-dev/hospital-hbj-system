// src/app/superadmin/components/BlockchainViewer.tsx
'use client';
import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, ChevronDown, ChevronUp, Download, RefreshCw, AlertTriangle, Lock, Hash } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }
function authFetch(url: string) {
  return fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

interface Block {
  id: string; blockIndex: number; timestamp: string;
  eventType: string; resourceType: string; resourceId: string;
  userId: string; currentHash: string; previousHash: string;
  nonce: number; isValid: boolean; actionDetails?: any;
}

const EVENT_CFG: Record<string, { color: string; bg: string; border: string; label: string; icono: string }> = {
  CREATE: { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', label: 'Creacion',      icono: '✚' },
  UPDATE: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Modificacion',  icono: '✎' },
  DELETE: { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Eliminacion',   icono: '✕' },
  ACCESS: { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', label: 'Acceso',        icono: '👁' },
};

const RESOURCE_LABELS: Record<string, string> = {
  AUTH: 'Autenticacion', MEDICAL_RECORD: 'Historial medico', VITAL_SIGNS: 'Signos vitales',
  DOCUMENTS: 'Documentos', USERS: 'Usuarios', PATIENTS: 'Pacientes',
  APPOINTMENT: 'Cita', PATIENT: 'Paciente',
};

export function BlockchainViewer() {
  const [blocks, setBlocks]       = useState<Block[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [integrity, setIntegrity] = useState<{ isValid: boolean; message: string; invalidBlocks?: number[] } | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [filterEvent, setFilterEvent]       = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [search, setSearch]       = useState('');

  async function loadBlocks() {
    setLoading(true);
    try {
      const res  = await authFetch(`/api/audit?page=${page}&limit=20`);
      const data = await res.json();
      setBlocks(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch { setBlocks([]); }
    finally { setLoading(false); }
  }

  async function verifyChain() {
    setVerifying(true);
    try {
      const res  = await authFetch('/api/audit/verify');
      const data = await res.json();
      setIntegrity(data);
    } catch { setIntegrity({ isValid: false, message: 'Error al verificar la cadena' }); }
    finally { setVerifying(false); }
  }

  async function exportJSON() {
    const res  = await authFetch('/api/audit?page=1&limit=10000');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `blockchain_audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const res    = await authFetch('/api/audit?page=1&limit=10000');
    const data   = await res.json();
    const bks: Block[] = data.data ?? [];
    const verRes = await authFetch('/api/audit/verify');
    const ver    = await verRes.json();
    const rows = bks.slice(0, 100).map(b => `
      <tr style='border-bottom:1px solid #e5e7eb'>
        <td style='padding:6px 8px;font-size:11px'>${b.blockIndex}</td>
        <td style='padding:6px 8px;font-size:11px'>${new Date(b.timestamp).toLocaleString('es-ES')}</td>
        <td style='padding:6px 8px;font-size:11px'>${b.eventType}</td>
        <td style='padding:6px 8px;font-size:11px'>${RESOURCE_LABELS[b.resourceType] ?? b.resourceType}</td>
        <td style='padding:6px 8px;font-size:11px;font-family:monospace'>${b.currentHash.substring(0,16)}...</td>
        <td style='padding:6px 8px;font-size:11px;text-align:center'>${b.isValid ? 'OK' : 'INVALIDO'}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Blockchain Audit - HBJ</title>
      <style>body{font-family:Arial,sans-serif;margin:40px;color:#1f2937}
      h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{background:#1e40af;color:white;padding:8px;font-size:11px;text-align:left}
      tr:nth-child(even){background:#f9fafb}
      .badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
      .valid{background:#d1fae5;color:#065f46}.invalid{background:#fee2e2;color:#991b1b}
      </style></head><body>
      <h1>Hospital Boliviano Japones - Reporte de Auditoria Blockchain</h1>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')} | <strong>Total bloques:</strong> ${bks.length}</p>
      <span class='badge ${ver.isValid ? 'valid' : 'invalid'}'>Integridad: ${ver.isValid ? 'VALIDA' : 'COMPROMETIDA'}</span>
      <table><thead><tr><th>#</th><th>Timestamp</th><th>Evento</th><th>Recurso</th><th>Hash</th><th>Valido</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style='margin-top:16px;font-size:11px;color:#6b7280'>Hash ultimo bloque: <code>${bks[0]?.currentHash ?? 'N/A'}</code></p>
      </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) setTimeout(() => { win.print(); }, 500);
    URL.revokeObjectURL(url);
  }

  useEffect(() => { loadBlocks(); }, [page]);

  const filtered = blocks.filter(b =>
    (filterEvent === '' || b.eventType === filterEvent) &&
    (filterResource === '' || b.resourceType.includes(filterResource.toUpperCase())) &&
    (search === '' || b.userId?.includes(search) || b.currentHash?.includes(search) || b.resourceType?.includes(search.toUpperCase()))
  );

  const resources = Array.from(new Set(blocks.map(b => b.resourceType)));

  // Stats para mini grafico
  const eventCounts = Object.keys(EVENT_CFG).map(k => ({
    name: EVENT_CFG[k].label,
    Eventos: blocks.filter(b => b.eventType === k).length,
    color: EVENT_CFG[k].color,
  })).filter(e => e.Eventos > 0);

  const totalPages = Math.ceil(total / 20);
  const chainIntegrity = blocks.filter(b => !b.isValid).length === 0;
  const invalidBlocks = blocks.filter(b => !b.isValid);


  return (
    <div className="space-y-4">
      {/* Banner integridad */}
      {integrity && (
        <div className={"flex items-center gap-3 px-4 py-3 rounded-xl border " + (integrity.isValid ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
          {integrity.isValid
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
          <p className={"text-sm font-bold flex-1 " + (integrity.isValid ? "text-emerald-800" : "text-red-800")}>
            {integrity.isValid ? "Cadena INTEGRA — todos los bloques son validos" : "CADENA COMPROMETIDA — " + (integrity.invalidBlocks?.length ?? 0) + " bloque(s) invalido(s)"}
          </p>
          <button onClick={() => setIntegrity(null)} className="text-gray-400 hover:text-gray-600 px-2">✕</button>
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-2 flex-wrap bg-gray-50 rounded-xl p-3">
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los eventos</option>
          {Object.entries(EVENT_CFG).map(([k, v]) => <option key={k} value={k}>{v.icono} {v.label}</option>)}
        </select>
        <select value={filterResource} onChange={e => setFilterResource(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los recursos</option>
          {resources.map(r => <option key={r} value={r}>{RESOURCE_LABELS[r] ?? r}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar hash o usuario..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-32" />
        <div className="flex gap-2 ml-auto">
          <button onClick={verifyChain} disabled={verifying}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            {verifying ? "Verificando..." : "Verificar integridad"}
          </button>
          <button onClick={exportJSON} className="px-3 py-2 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 transition">JSON</button>
          <button onClick={exportPDF} className="px-3 py-2 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 transition">PDF</button>
          <button onClick={loadBlocks} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Contenido principal: tabla + panel lateral */}
      <div className="flex gap-4">
        {/* Tabla */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { label: '#',       w: 'w-12' },
                  { label: 'Fecha',   w: 'w-28' },
                  { label: 'Evento',  w: 'w-32' },
                  { label: 'Recurso', w: 'w-32' },
                  { label: 'Usuario', w: 'w-24' },
                  { label: 'Hash',    w: 'w-32' },
                  { label: 'Estado',  w: 'w-20' },
                  { label: '',        w: 'w-8'  },
                ].map(h => (
                  <th key={h.label} className={"px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide " + h.w}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-blue-400" />
                  <p className="text-sm text-gray-400">Cargando bloques...</p>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Sin bloques que coincidan</td></tr>
              ) : filtered.map(b => {
                const cfg = EVENT_CFG[b.eventType] ?? EVENT_CFG.ACCESS;
                return (
                  <>
                    <tr key={b.id} className={"hover:bg-gray-50 transition cursor-pointer " + (!b.isValid ? "bg-red-50" : "")}
                      onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-gray-700">{b.blockIndex}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700">{new Date(b.timestamp).toLocaleDateString("es-ES",{day:"2-digit",month:"short"})}</p>
                        <p className="text-xs text-gray-400">{new Date(b.timestamp).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ color: cfg.color, backgroundColor: cfg.bg, border: "1px solid " + cfg.border }}>
                          {cfg.icono} {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{RESOURCE_LABELS[b.resourceType] ?? b.resourceType}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{b.userId?.substring(0,8)}...</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{b.currentHash?.substring(0,12)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        {b.isValid
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Valido
                            </span>
                          : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>Invalido
                            </span>}
                      </td>
                      <td className="px-4 py-3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          className={"transition-transform text-gray-400 " + (expanded === b.id ? "rotate-180" : "")}>
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </td>
                    </tr>
                    {expanded === b.id && (
                      <tr key={b.id + "-exp"}>
                        <td colSpan={8} className="px-4 py-4 bg-blue-50 border-t border-blue-100">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-gray-400 mb-1.5">Hash actual</p>
                              <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">{b.currentHash}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-gray-400 mb-1.5">Hash anterior</p>
                              <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">{b.previousHash}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-gray-400 mb-1.5">Nonce</p>
                              <p className="font-mono text-xs text-gray-700">{b.nonce}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-blue-100">
                              <p className="text-xs font-semibold text-gray-400 mb-1.5">Detalles</p>
                              <p className="font-mono text-xs text-gray-600 break-all">{JSON.stringify(b.actionDetails)}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {/* Paginacion */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
            <span className="text-xs text-gray-500">{total} bloques totales · pagina {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-white disabled:opacity-40 transition">«</button>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page === 1}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-white disabled:opacity-40 transition">‹</button>
              {[...Array(Math.min(5,totalPages))].map((_,i) => {
                const p = Math.max(1, page-2) + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={"px-3 py-1.5 rounded-lg text-xs border transition " + (p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-white")}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => p+1)} disabled={blocks.length < 20}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-white disabled:opacity-40 transition">›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-white disabled:opacity-40 transition">»</button>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="w-56 flex-shrink-0 space-y-3">
          {/* Estado cadena */}
          <div className={"rounded-xl border p-4 " + (chainIntegrity ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
            <div className="flex items-center gap-2 mb-3">
              {chainIntegrity
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
              <p className={"text-sm font-bold " + (chainIntegrity ? "text-emerald-800" : "text-red-800")}>
                {chainIntegrity ? "INTEGRA ✓" : "COMPROMETIDA ✕"}
              </p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Total bloques", val: total,                                      color: chainIntegrity ? "#10b981" : "#6b7280" },
                { label: "Esta pagina",  val: blocks.length,                               color: "#6b7280" },
                { label: "Invalidos",    val: blocks.filter(b => !b.isValid).length,       color: blocks.filter(b => !b.isValid).length > 0 ? "#ef4444" : "#10b981" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/70 rounded-lg">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.val}</span>
                </div>
              ))}
            </div>
            <button onClick={verifyChain} disabled={verifying}
              className="mt-3 w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
              {verifying ? "Verificando..." : "Verificar cadena"}
            </button>
          </div>

          {/* Eventos en pagina */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Eventos en pagina</p>
            <div className="space-y-2">
              {Object.entries(EVENT_CFG).map(([k, v]) => {
                const count = blocks.filter(b => b.eventType === k).length;
                const pct = blocks.length > 0 ? Math.round((count / blocks.length) * 100) : 0;
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 flex items-center gap-1">{v.icono} {v.label}</span>
                      <span className="text-xs font-bold" style={{ color: v.color }}>{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: pct + "%", backgroundColor: v.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ultimo bloque */}
          {blocks[0] && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ultimo bloque</p>
              <div className="space-y-2">
                {[
                  { label: "Numero",  val: "#" + blocks[0].blockIndex },
                  { label: "Tipo",    val: EVENT_CFG[blocks[0].eventType]?.label ?? blocks[0].eventType },
                  { label: "Recurso", val: RESOURCE_LABELS[blocks[0].resourceType] ?? blocks[0].resourceType },
                  { label: "Hora",    val: new Date(blocks[0].timestamp).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}) },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{s.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{s.val}</span>
                  </div>
                ))}
                <p className="text-xs font-mono text-gray-300 truncate pt-1 border-t border-gray-100">
                  {blocks[0].currentHash?.substring(0,22)}...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
