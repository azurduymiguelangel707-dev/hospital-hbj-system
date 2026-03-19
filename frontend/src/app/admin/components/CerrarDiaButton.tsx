'use client';
import { useState } from 'react';
import { Archive, AlertTriangle, CheckCircle, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') ?? '' : ''; }

export function CerrarDiaButton({ onSuccess }: { onSuccess?: () => void }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const hoy = new Date().toISOString().split('T')[0];
  const hoyLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  const ejecutar = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/appointments/reset/ejecutar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ fecha: hoy, motivo: 'manual', userId: 'ADMIN' }),
      });
      const data = await res.json();
      setResultado(data);
      onSuccess?.();
    } catch (e) {
      setResultado({ error: 'Error al ejecutar el cierre del dia' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setModal(true); setResultado(null); }}
        className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-sm font-semibold transition-colors"
      >
        <Archive size={15} />
        Cerrar dia
      </button>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {!resultado ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Cerrar dia</h3>
                    <p className="text-sm text-gray-500">{hoyLabel}</p>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
                  <p className="text-sm text-amber-800">
                    Se archivaran todas las citas <strong>Completadas</strong>, <strong>No asistio</strong> y <strong>Anuladas</strong> del dia de hoy.
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    Las citas futuras y el historial medico no se veran afectados.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={ejecutar}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm"
                  >
                    {loading ? 'Archivando...' : 'Confirmar cierre'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${resultado.error ? 'bg-red-100' : 'bg-green-100'}`}>
                    {resultado.error
                      ? <X size={24} className="text-red-600" />
                      : <CheckCircle size={24} className="text-green-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {resultado.error ? 'Error' : 'Dia cerrado correctamente'}
                    </h3>
                    <p className="text-sm text-gray-500">{hoyLabel}</p>
                  </div>
                </div>
                {!resultado.error && (
                  <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-100">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-green-700">Citas archivadas</span>
                      <span className="text-sm font-bold text-green-800">{resultado.archivadas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Fecha</span>
                      <span className="text-sm font-bold text-green-800">{resultado.fecha}</span>
                    </div>
                  </div>
                )}
                {resultado.error && (
                  <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-100">
                    <p className="text-sm text-red-700">{resultado.error}</p>
                  </div>
                )}
                <button
                  onClick={() => setModal(false)}
                  className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}