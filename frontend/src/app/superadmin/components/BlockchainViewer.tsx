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

  return (
    <div className='flex gap-5'>
      {/* Columna principal */}
      <div className='flex-1 min-w-0 space-y-4'>

        {/* Banner integridad */}
        {integrity && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${integrity.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            {integrity.isValid
              ? <CheckCircle size={18} className='text-emerald-600 flex-shrink-0' />
              : <XCircle size={18} className='text-red-600 flex-shrink-0' />}
            <div className='flex-1'>
              <p className={`text-sm font-bold ${integrity.isValid ? 'text-emerald-800' : 'text-red-800'}`}>
                Cadena blockchain — {integrity.isValid ? 'INTEGRA ✓' : 'COMPROMETIDA ✕'}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>{integrity.message}</p>
              {!integrity.isValid && integrity.invalidBlocks && (
                <p className='text-xs text-red-600 mt-0.5'>Bloques comprometidos: {integrity.invalidBlocks.join(', ')}</p>
              )}
            </div>
            <button onClick={() => setIntegrity(null)} className='text-gray-400 hover:text-gray-600 text-xs'>✕</button>
          </div>
        )}

        {/* Controles */}
        <div className='flex items-center gap-2 flex-wrap'>
          <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
            className='border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'>
            <option value=''>Todos los eventos</option>
            {Object.entries(EVENT_CFG).map(([k, v]) => <option key={k} value={k}>{v.icono} {v.label}</option>)}
          </select>
          <select value={filterResource} onChange={e => setFilterResource(e.target.value)}
            className='border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'>
            <option value=''>Todos los recursos</option>
            {resources.map(r => <option key={r} value={r}>{RESOURCE_LABELS[r] ?? r}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder='Buscar por hash o usuario...'
            className='border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-48' />
          <div className='ml-auto flex gap-2'>
            <button onClick={verifyChain} disabled={verifying}
              className='flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition'>
              <Shield size={12} /> {verifying ? 'Verificando...' : 'Verificar integridad'}
            </button>
            <button onClick={exportJSON}
              className='flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 transition'>
              <Download size={12} /> JSON
            </button>
            <button onClick={exportPDF}
              className='flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-xs rounded-lg hover:bg-gray-50 transition'>
              <Download size={12} /> PDF
            </button>
            <button onClick={loadBlocks}
              className='p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition'>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className='border border-gray-200 rounded-xl overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200 sticky top-0'>
              <tr>
                {['Bloque','Timestamp','Evento','Recurso','Usuario','Hash','Estado',''].map(h => (
                  <th key={h} className='px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {loading ? (
                <tr><td colSpan={8} className='text-center py-8 text-gray-400 text-sm'>
                  <RefreshCw size={20} className='mx-auto mb-2 animate-spin opacity-30' />
                  Cargando bloques...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className='text-center py-8 text-gray-400 text-sm'>Sin bloques registrados</td></tr>
              ) : filtered.map(b => {
                const cfg = EVENT_CFG[b.eventType] ?? EVENT_CFG.ACCESS;
                return (
                  <>
                    <tr key={b.id} className={`hover:bg-gray-50 transition ${!b.isValid ? 'bg-red-50' : ''}`}>
                      {/* Bloque */}
                      <td className='px-3 py-2.5'>
                        <div className='flex items-center gap-1.5'>
                          <Hash size={10} className='text-gray-300' />
                          <span className='text-xs font-mono font-bold text-gray-600'>{b.blockIndex}</span>
                        </div>
                      </td>
                      {/* Timestamp */}
                      <td className='px-3 py-2.5 text-xs text-gray-500'>
                        {new Date(b.timestamp).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      {/* Evento */}
                      <td className='px-3 py-2.5'>
                        <span className='px-2 py-0.5 rounded-full text-xs font-semibold'
                          style={{ color: cfg.color, backgroundColor: cfg.bg, border: '1px solid ' + cfg.border }}>
                          {cfg.icono} {cfg.label}
                        </span>
                      </td>
                      {/* Recurso */}
                      <td className='px-3 py-2.5 text-xs text-gray-600'>
                        {RESOURCE_LABELS[b.resourceType] ?? b.resourceType}
                      </td>
                      {/* Usuario */}
                      <td className='px-3 py-2.5 text-xs font-mono text-gray-400'>
                        {b.userId?.substring(0,8)}...
                      </td>
                      {/* Hash */}
                      <td className='px-3 py-2.5'>
                        <span className='text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded'>
                          {b.currentHash?.substring(0,10)}...
                        </span>
                      </td>
                      {/* Estado */}
                      <td className='px-3 py-2.5'>
                        {b.isValid
                          ? <span className='flex items-center gap-1 text-xs text-emerald-600'><CheckCircle size={12} /> Valido</span>
                          : <span className='flex items-center gap-1 text-xs text-red-600 font-semibold'><XCircle size={12} /> Invalido</span>
                        }
                      </td>
                      {/* Expand */}
                      <td className='px-3 py-2.5'>
                        <button onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                          className='p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition'>
                          {expanded === b.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </td>
                    </tr>
                    {expanded === b.id && (
                      <tr key={b.id + '-detail'} className='bg-blue-50'>
                        <td colSpan={8} className='px-4 py-3'>
                          <div className='grid grid-cols-2 gap-3'>
                            <div className='bg-white rounded-lg p-3 border border-blue-100'>
                              <p className='text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1'><Lock size={10} /> Hash actual</p>
                              <p className='font-mono text-xs text-gray-700 break-all'>{b.currentHash}</p>
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-blue-100'>
                              <p className='text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1'><Lock size={10} /> Hash anterior</p>
                              <p className='font-mono text-xs text-gray-700 break-all'>{b.previousHash}</p>
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-blue-100'>
                              <p className='text-xs font-semibold text-gray-500 mb-1'>Nonce</p>
                              <p className='font-mono text-xs text-gray-700'>{b.nonce}</p>
                            </div>
                            <div className='bg-white rounded-lg p-3 border border-blue-100'>
                              <p className='text-xs font-semibold text-gray-500 mb-1'>Detalles</p>
                              <p className='font-mono text-xs text-gray-600 break-all'>{JSON.stringify(b.actionDetails)}</p>
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
        </div>

        {/* Paginacion */}
        <div className='flex items-center justify-between'>
          <p className='text-xs text-gray-400'>{total} bloques totales · pagina {page} de {totalPages}</p>
          <div className='flex gap-1'>
            <button onClick={() => setPage(1)} disabled={page === 1}
              className='px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40 transition'>
              «
            </button>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className='px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40 transition'>
              Anterior
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const p = Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition border ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => p+1)} disabled={blocks.length < 20}
              className='px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40 transition'>
              Siguiente
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className='px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-40 transition'>
              »
            </button>
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className='w-56 flex-shrink-0 space-y-4'>
        {/* Estado cadena */}
        <div className='bg-white rounded-xl border border-gray-200 p-4'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5'>
            <Shield size={12} /> Estado de la cadena
          </p>
          <div className='space-y-2'>
            <div className='flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg'>
              <span className='text-xs text-gray-500'>Total bloques</span>
              <span className='text-sm font-bold text-gray-700'>{total}</span>
            </div>
            <div className='flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg'>
              <span className='text-xs text-gray-500'>En esta pagina</span>
              <span className='text-sm font-bold text-gray-700'>{blocks.length}</span>
            </div>
            <div className='flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg'>
              <span className='text-xs text-gray-500'>Invalidos</span>
              <span className={`text-sm font-bold ${blocks.filter(b => !b.isValid).length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {blocks.filter(b => !b.isValid).length}
              </span>
            </div>
          </div>
          <button onClick={verifyChain} disabled={verifying}
            className='mt-3 w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5'>
            <Shield size={11} /> {verifying ? 'Verificando...' : 'Verificar cadena'}
          </button>
        </div>

        {/* Distribucion eventos */}
        {eventCounts.length > 0 && (
          <div className='bg-white rounded-xl border border-gray-200 p-4'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Eventos en pagina</p>
            <ResponsiveContainer width='100%' height={120}>
              <BarChart data={eventCounts} barSize={20}>
                <XAxis dataKey='name' tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6 }} />
                <Bar dataKey='Eventos' radius={[4,4,0,0]}>
                  {eventCounts.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leyenda eventos */}
        <div className='bg-white rounded-xl border border-gray-200 p-4'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Tipos de evento</p>
          <div className='space-y-2'>
            {Object.entries(EVENT_CFG).map(([k, v]) => (
              <div key={k} className='flex items-center justify-between px-2 py-1.5 rounded-lg'
                style={{ backgroundColor: v.bg }}>
                <span className='text-xs flex items-center gap-1.5' style={{ color: v.color }}>
                  <span>{v.icono}</span> {v.label}
                </span>
                <span className='text-xs font-bold' style={{ color: v.color }}>
                  {blocks.filter(b => b.eventType === k).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}