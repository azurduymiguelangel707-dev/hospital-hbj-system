// src/app/admin/components/SystemHealth.tsx
'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Server, Database, Shield, Activity } from 'lucide-react';

const API = 'http://localhost:3001';

interface ServiceStatus { name: string; status: 'ok' | 'warn' | 'error'; latency?: number; detail?: string; icon: any; }

export function SystemHealth() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [checking, setChecking] = useState(true);

  async function checkServices() {
    setChecking(true);
    const results: ServiceStatus[] = [];

    // Backend API
    try {
      const t0 = Date.now();
      const res = await fetch(`${API}/api/users/stats`);
      const latency = Date.now() - t0;
      results.push({ name: 'API Backend', status: res.ok ? 'ok' : 'warn', latency, detail: `Puerto 3001`, icon: Server });
    } catch {
      results.push({ name: 'API Backend', status: 'error', detail: 'Sin respuesta', icon: Server });
    }

    // Base de datos (indirecta via API)
    try {
      const res = await fetch(`${API}/api/appointments/stats/dashboard`);
      results.push({ name: 'Base de datos', status: res.ok ? 'ok' : 'warn', detail: 'PostgreSQL 15', icon: Database });
    } catch {
      results.push({ name: 'Base de datos', status: 'error', detail: 'Sin conexion', icon: Database });
    }

    // Auth
    try {
      const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test', password: 'test' }) });
      results.push({ name: 'Servicio Auth', status: res.status === 401 ? 'ok' : 'warn', detail: 'JWT HS256', icon: Shield });
    } catch {
      results.push({ name: 'Servicio Auth', status: 'error', detail: 'Sin respuesta', icon: Shield });
    }

    // Vital Signs
    try {
      const res = await fetch(`${API}/api/vital-signs/latest?patientId=test`);
      results.push({ name: 'Modulo Vitales', status: res.status < 500 ? 'ok' : 'warn', detail: 'Signos vitales', icon: Activity });
    } catch {
      results.push({ name: 'Modulo Vitales', status: 'error', detail: 'Sin respuesta', icon: Activity });
    }

    setServices(results);
    setChecking(false);
  }

  useEffect(() => { checkServices(); }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'ok') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'warn') return <AlertTriangle size={16} className="text-amber-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">Estado en tiempo real</p>
        <button onClick={checkServices} disabled={checking}
          className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 transition">
          {checking ? 'Verificando...' : 'Verificar ahora'}
        </button>
      </div>
      <div className="space-y-2">
        {services.map(s => {
          const Icon = s.icon;
          const bgCls = s.status === 'ok' ? 'bg-green-50 border-green-200' : s.status === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
          return (
            <div key={s.name} className={`flex items-center justify-between border rounded-lg px-4 py-3 ${bgCls}`}>
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name}</p>
                  {s.detail && <p className="text-xs text-gray-500">{s.detail}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.latency && <span className="text-xs text-gray-400">{s.latency}ms</span>}
                <StatusIcon status={s.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
