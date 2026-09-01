'use client';
import { useState, useEffect } from 'react';
import { BlockchainViewer } from './components/BlockchainViewer';
import { GlobalUserManager } from './components/GlobalUserManager';
import { ReportesPanel } from './components/ReportesPanel';
import { SystemMonitor } from './components/SystemMonitor';
import { BackupPanel } from './components/BackupPanel';

type Panel = 'resumen' | 'usuarios' | 'blockchain' | 'reportes' | 'sistema' | 'backup';

export default function SuperAdminPage() {
  const [panel, setPanel] = useState<Panel>('resumen');
  const [stats, setStats] = useState<any>(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    fetch(`${API}/api/superadmin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const menuItems: { id: Panel; label: string; icon: string }[] = [
    { id: 'resumen',    label: 'Resumen ejecutivo',  icon: '📊' },
    { id: 'usuarios',   label: 'Usuarios',            icon: '👥' },
    { id: 'blockchain', label: 'Blockchain',           icon: '⛓' },
    { id: 'reportes',   label: 'Reportes',             icon: '📈' },
    { id: 'sistema',    label: 'Sistema',              icon: '⚙️' },
    { id: 'backup',     label: 'Backup',               icon: '💾' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0B2545', color: 'white', fontFamily: 'Calibri, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: '#071E3D', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #1B3A5C' }}>
          <div style={{ fontSize: '12px', color: '#45C4B0', fontWeight: 'bold', letterSpacing: '2px' }}>HOSPITAL HBJ</div>
          <div style={{ fontSize: '11px', color: '#8899AA', marginTop: '4px' }}>Centro de Gobierno</div>
        </div>
        <div style={{ padding: '10px 0' }}>
          {menuItems.map(item => (
            <div key={item.id} onClick={() => setPanel(item.id)}
              style={{
                padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                background: panel === item.id ? '#13678A' : 'transparent',
                borderLeft: panel === item.id ? '3px solid #45C4B0' : '3px solid transparent',
                fontSize: '13px', color: panel === item.id ? 'white' : '#8899AA',
              }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid #1B3A5C', position: 'absolute', bottom: 0, width: '180px' }}>
          <div style={{ fontSize: '11px', color: '#45C4B0' }}>Bloques blockchain</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.blockchainBlocks ?? 0}</div>
          <div style={{ fontSize: '11px', color: '#45C4B0', marginTop: '10px' }}>Pacientes registrados</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalPatients ?? 0}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {panel === 'resumen' && (
          <div style={{ padding: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Resumen ejecutivo</h1>
            <p style={{ color: '#8899AA', marginBottom: '30px' }}>{new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'Usuarios totales',    value: stats?.totalUsers ?? 0,        color: '#13678A' },
                { label: 'Médicos',             value: stats?.totalDoctors ?? 0,       color: '#059669' },
                { label: 'Pacientes',           value: stats?.totalPatients ?? 0,      color: '#7C3AED' },
                { label: 'Citas hoy',           value: stats?.todayAppointments ?? 0,  color: '#B45309' },
                { label: 'Bloques blockchain',  value: stats?.blockchainBlocks ?? 0,   color: '#0B2545' },
                { label: 'Total registros BD',  value: stats?.totalRecords ?? 0,       color: '#374151' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: color, borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{value}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {panel === 'usuarios'   && <GlobalUserManager />}
        {panel === 'blockchain' && <BlockchainViewer />}
        {panel === 'reportes'   && <ReportesPanel />}
        {panel === 'sistema'    && <SystemMonitor />}
        {panel === 'backup'     && <BackupPanel />}
      </div>
    </div>
  );
}
