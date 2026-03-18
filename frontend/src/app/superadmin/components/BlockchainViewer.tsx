// src/app/superadmin/components/BlockchainViewer.tsx
'use client';
import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, ChevronDown, ChevronUp, Download, RefreshCw, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }
function authFetch(url: string) {
  return fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${getToken()}` } });
}

interface Block {
  id: string; blockIndex: number; timestamp: string;
  eventType: string; resourceType: string; resourceId: string;
  userId: string; currentHash: string; previousHash: string;
  nonce: number; isValid: boolean; actionDetails?: any;
}

const EVENT_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  ACCESS: 'bg-purple-100 text-purple-700',
};

export function BlockchainViewer() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [integrity, setIntegrity] = useState<{ isValid: boolean; message: string; invalidBlocks?: number[] } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterEvent, setFilterEvent] = useState('');
  const [filterResource, setFilterResource] = useState('');

  async function loadBlocks() {
    setLoading(true);
    try {
      const res = await authFetch(`/api/audit?page=${page}&limit=20`);
      const data = await res.json();
      setBlocks(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch { setBlocks([]); }
    finally { setLoading(false); }
  }

  async function verifyChain() {
    setVerifying(true);
    try {
      const res = await authFetch('/api/audit/verify');
      const data = await res.json();
      setIntegrity(data);
    } catch { setIntegrity({ isValid: false, message: 'Error al verificar la cadena' }); }
    finally { setVerifying(false); }
  }

  async function exportJSON() {
    const res = await authFetch('/api/audit?page=1&limit=10000');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `blockchain_audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const res = await authFetch('/api/audit?page=1&limit=10000');
    const data = await res.json();
    const blocks: Block[] = data.data ?? [];
    const verRes = await authFetch('/api/audit/verify');
    const ver = await verRes.json();

    const rows = blocks.slice(0, 100).map(b => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:6px 8px;font-size:11px">${b.blockIndex}</td>
        <td style="padding:6px 8px;font-size:11px">${new Date(b.timestamp).toLocaleString('es-ES')}</td>
        <td style="padding:6px 8px;font-size:11px"><span style="background:${b.eventType==='CREATE'?'#d1fae5':b.eventType==='DELETE'?'#fee2e2':b.eventType==='UPDATE'?'#dbeafe':'#ede9fe'};padding:2px 6px;border-radius:4px">${b.eventType}</span></td>
        <td style="padding:6px 8px;font-size:11px">${b.resourceType}</td>
        <td style="padding:6px 8px;font-size:11px">${b.userId}</td>
        <td style="padding:6px 8px;font-size:11px;font-family:monospace">${b.currentHash.substring(0,16)}...</td>
        <td style="padding:6px 8px;font-size:11px;text-align:center">${b.isValid ? 'âœ“' : 'âœ—'}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Blockchain Audit Report - HBJ</title>
    <style>body{font-family:Arial,sans-serif;margin:40px;color:#1f2937}
    h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:8px}
    .header{display:flex;justify-content:space-between;margin-bottom:24px}
    .badge{padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
    .valid{background:#d1fae5;color:#065f46}.invalid{background:#fee2e2;color:#991b1b}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#1e40af;color:white;padding:8px;font-size:11px;text-align:left}
    tr:nth-child(even){background:#f9fafb}
    .footer{margin-top:24px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px}
    </style></head><body>
    <h1>Hospital Boliviano Japones - Reporte de Auditoria Blockchain</h1>
    <div class="header">
      <div>
        <p><strong>Fecha de generacion:</strong> ${new Date().toLocaleString('es-ES')}</p>
        <p><strong>Total de bloques:</strong> ${blocks.length}</p>
        <p><strong>Sistema:</strong> HBJ v1.0.0 - SHA-256 CryptoJS</p>
      </div>
      <div>
        <span class="badge ${ver.isValid ? 'valid' : 'invalid'}">
          Integridad: ${ver.isValid ? 'VALIDA' : 'COMPROMETIDA'}
        </span>
      </div>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Timestamp</th><th>Evento</th><th>Recurso</th>
        <th>Usuario</th><th>Hash</th><th>Valido</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${blocks.length > 100 ? `<p style="margin-top:8px;font-size:11px;color:#6b7280">Mostrando primeros 100 de ${blocks.length} bloques.</p>` : ''}
    <div class="footer">
      <p>Hash del ultimo bloque: <code>${blocks[0]?.currentHash ?? 'N/A'}</code></p>
      <p>Este reporte fue generado automaticamente por el Sistema de Gestion Hospitalaria HBJ.</p>
    </div>
    </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) setTimeout(() => { win.print(); }, 500);
    URL.revokeObjectURL(url);
  }

  useEffect(() => { loadBlocks(); }, [page]);

  const filtered = blocks.filter(b =>
    (filterEvent === '' || b.eventType === filterEvent) &&
    (filterResource === '' || b.resourceType.includes(filterResource.toUpperCase()))
  );

  const resources = [...new Set(blocks.map(b => b.resourceType))];

  return (
    <div>
      {/* Integrity banner */}
      {integrity && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border ${integrity.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {integrity.isValid ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
          <div>
            <p className={`text-sm font-semibold ${integrity.isValid ? 'text-green-700' : 'text-red-700'}`}>{integrity.message}</p>
            {!integrity.isValid && integrity.invalidBlocks && (
              <p className="text-xs text-red-600">Bloques comprometidos: {integrity.invalidBlocks.join(', ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Todos los eventos</option>
          {[{value:'CREATE',label:'Creacion'},{value:'UPDATE',label:'Modificacion'},{value:'DELETE',label:'Eliminacion'},{value:'ACCESS',label:'Acceso'}].map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select value={filterResource} onChange={e => setFilterResource(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">Todos los recursos</option>
          {resources.map(r => <option key={r} value={r}>{
            r === 'AUTH' ? 'Autenticacion' :
            r === 'MEDICAL_RECORD' ? 'Historial medico' :
            r === 'VITAL_SIGNS' ? 'Signos vitales' :
            r === 'DOCUMENTS' ? 'Documentos' :
            r === 'USERS' ? 'Usuarios' :
            r === 'PATIENTS' ? 'Pacientes' : r === 'APPOINTMENT' ? 'Cita' : r === 'PATIENT' ? 'Paciente' : r
          }</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={verifyChain} disabled={verifying}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            <Shield size={12} /> {verifying ? 'Verificando...' : 'Verificar integridad'}
          </button>
          <button onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-xs rounded-lg hover:bg-gray-50 transition">
            <Download size={12} /> JSON
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-xs rounded-lg hover:bg-gray-50 transition">
            <Download size={12} /> PDF
          </button>
          <button onClick={loadBlocks}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-xs rounded-lg hover:bg-gray-50 transition">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#','Timestamp','Evento','Recurso','Usuario','Hash','Valid',''].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">Cargando bloques...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">Sin bloques registrados</td></tr>
            ) : filtered.map(b => (
              <>
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{b.blockIndex}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{new Date(b.timestamp).toLocaleString('es-ES')}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${EVENT_COLORS[b.eventType] ?? 'bg-gray-100 text-gray-600'}`}>{b.eventType==="CREATE"?"Creacion":b.eventType==="UPDATE"?"Modificacion":b.eventType==="DELETE"?"Eliminacion":b.eventType==="ACCESS"?"Acceso":b.eventType}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{b.resourceType==='AUTH'?'Autenticacion':b.resourceType==='MEDICAL_RECORD'?'Historial medico':b.resourceType==='VITAL_SIGNS'?'Signos vitales':b.resourceType==='DOCUMENTS'?'Documentos':b.resourceType==='USERS'?'Usuarios':b.resourceType==='PATIENTS'?'Pacientes':b.resourceType==='APPOINTMENT'?'Cita':b.resourceType==='PATIENT'?'Paciente':b.resourceType}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{b.userId?.substring(0,8)}...</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-gray-400">{b.currentHash?.substring(0,12)}...</td>
                  <td className="px-3 py-2.5">
                    {b.isValid ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                      className="text-gray-400 hover:text-gray-600 transition">
                      {expanded === b.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                </tr>
                {expanded === b.id && (
                  <tr key={b.id + '-detail'} className="bg-gray-50">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400 mb-1">Hash actual</p>
                          <p className="font-mono text-gray-700 break-all">{b.currentHash}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Hash anterior</p>
                          <p className="font-mono text-gray-700 break-all">{b.previousHash}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Nonce (prueba de trabajo)</p>
                          <p className="font-mono text-gray-700">{b.nonce}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Detalles de la accion</p>
                          <p className="font-mono text-gray-700 break-all">{JSON.stringify(b.actionDetails)}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-500">{total} bloques totales</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50 transition">Anterior</button>
          <span className="px-3 py-1.5 text-xs text-gray-600">Pagina {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={blocks.length < 20}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50 transition">Siguiente</button>
        </div>
      </div>
    </div>
  );
}
