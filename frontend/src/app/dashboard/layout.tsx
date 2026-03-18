'use client';

import Link from 'next/link';
import { authService } from '@/lib/auth';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Users, Calendar, FileText, Stethoscope, Shield, LogOut, Menu, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    authService.logout();
    router.push('/');
  };

  const menuItems = [
    {
      section: 'Roles',
      items: [
        { name: 'Admin', path: '/dashboard/admin', icon: Home, color: 'text-blue-600' },
        { name: 'Médico', path: '/dashboard/doctor', icon: Stethoscope, color: 'text-green-600' },
        { name: 'Paciente', path: '/dashboard/patient', icon: Users, color: 'text-purple-600' },
        { name: 'Enfermería', path: '/dashboard/nurse', icon: FileText, color: 'text-pink-600' },
      ]
    },
    {
      section: 'Gestión',
      items: [
        { name: 'Pacientes', path: '/dashboard/patients', icon: Users, color: 'text-blue-600' },
        { name: 'Médicos', path: '/dashboard/doctors', icon: Stethoscope, color: 'text-green-600' },
        { name: 'Citas', path: '/dashboard/appointments', icon: Calendar, color: 'text-orange-600' },
        { name: 'Historiales', path: '/dashboard/medical-records', icon: FileText, color: 'text-indigo-600' },
      ]
    },
    {
      section: 'Seguridad',
      items: [
        { name: 'Blockchain Audit', path: '/dashboard/audit', icon: Shield, color: 'text-purple-600' },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">🏥 Hospital La Paz</h1>
          <p className="text-sm text-gray-600 mt-1">Sistema de Auditoría Médica</p>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          {menuItems.map((section) => (
            <div key={section.section} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
                {section.section}
              </h3>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => {
                      // Cerrar sidebar en móvil al hacer clic
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : item.color} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-gray-800">Admin User</p>
            <p className="text-xs text-gray-500">admin@hospital.com</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
          >
            <LogOut size={18} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}