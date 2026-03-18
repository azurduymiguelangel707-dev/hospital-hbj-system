'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏥 Hospital Boliviano Japonés
          </h1>
          <p className="text-xl text-gray-600">
            Sistema Integral de Gestión Hospitalaria
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-colors">
              <div className="text-4xl mb-3">👨‍💼</div>
              <h3 className="text-xl font-semibold mb-2">Administración</h3>
              <p className="text-gray-600 mb-4">
                Gestión de usuarios, reportes y configuración
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Acceder
              </button>
            </div>

            <div className="p-6 border-2 border-green-200 rounded-lg hover:border-green-400 transition-colors">
              <div className="text-4xl mb-3">👨‍⚕️</div>
              <h3 className="text-xl font-semibold mb-2">Médicos</h3>
              <p className="text-gray-600 mb-4">
                Consulta de pacientes e historiales clínicos
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Acceder
              </button>
            </div>

            <div className="p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 transition-colors">
              <div className="text-4xl mb-3">🧑‍🦱</div>
              <h3 className="text-xl font-semibold mb-2">Pacientes</h3>
              <p className="text-gray-600 mb-4">
                Agendar citas y ver historial médico
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Acceder
              </button>
            </div>

            <div className="p-6 border-2 border-pink-200 rounded-lg hover:border-pink-400 transition-colors">
              <div className="text-4xl mb-3">👩‍⚕️</div>
              <h3 className="text-xl font-semibold mb-2">Enfermería</h3>
              <p className="text-gray-600 mb-4">
                Registro de signos vitales
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
              >
                Acceder
              </button>
            </div>

            <div className="p-6 border-2 border-orange-200 rounded-lg hover:border-orange-400 transition-colors">
              <div className="text-4xl mb-3">💊</div>
              <h3 className="text-xl font-semibold mb-2">Farmacia</h3>
              <p className="text-gray-600 mb-4">
                Gestión de recetas electrónicas
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
              >
                Acceder
              </button>
            </div>

            <div className="p-6 border-2 border-cyan-200 rounded-lg hover:border-cyan-400 transition-colors">
              <div className="text-4xl mb-3">🧪</div>
              <h3 className="text-xl font-semibold mb-2">Laboratorio</h3>
              <p className="text-gray-600 mb-4">
                Registro de resultados de exámenes
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700"
              >
                Acceder
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              ✅ Sistema Base Funcionando | 🔐 Autenticación Configurada | 📊 Dashboard Activo
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}