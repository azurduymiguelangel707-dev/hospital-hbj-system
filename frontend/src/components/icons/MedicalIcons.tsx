// src/components/icons/MedicalIcons.tsx
// Iconos medicos SVG inline — HBJ Sistema Hospitalario

interface IconProps {
  size?: number;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Historial clinico / Ficha medica
export function IconHistorialMedico({ size = 24, className = '', primaryColor = '#1e40af', secondaryColor = '#0d9488' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} xmlns="http://www.w3.org/2000/svg">
      <g>
        <path fill={primaryColor} d="M387.2,85.4h-45.3v34.5c0,23.8-19.4,43.1-43.1,43.1h-85.4c-23.8,0-43.1-19.4-43.1-43.1V85.4h-45.3c-13.2,0-23.8,10.7-23.8,23.8v349.1c0,13.2,10.7,23.8,23.8,23.8h262.3c13.2,0,23.8-10.7,23.8-23.8V109.2C411,96.1,400.3,85.4,387.2,85.4z M360.9,448.7H342v-39.7c0-3.9-3.1-7-7-7s-7,3.1-7,7v39.7H151.1v-95.2h61.6c2.4,0,4.6-1.2,5.9-3.3l23.3-37v92.4c0,3.1,2,5.8,5,6.7c0.7,0.2,1.4,0.3,2,0.3c2.3,0,4.5-1.1,5.8-3.1l42.9-64.2h63.2V448.7z M360.9,331.4h-67c-2.3,0-4.5,1.2-5.8,3.1l-32.2,48.1V289c0-3.1-2.1-5.9-5.1-6.7c-3-0.9-6.2,0.4-7.9,3l-34.1,54.2h-57.7v-91.8h209.7V331.4z M360.9,220H151.1v-31.8h209.7V220z"/>
        <path fill={secondaryColor} d="M213.3,136.6h85.4c9.2,0,16.7-7.5,16.7-16.7V85.4H289V62.8c0-18.2-14.8-33-33-33s-33,14.8-33,33v22.6h-26.5v34.5C196.5,129.1,204,136.6,213.3,136.6z"/>
      </g>
    </svg>
  );
}

// Dashboard - pantalla con ECG
export function IconDashboard({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
      <path d="M6 10l2-3 2 4 2-2 2 3"/>
    </svg>
  );
}

// Usuarios / Doctor
export function IconDoctor({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="7" r="3"/>
      <path d="M2 21v-1a5 5 0 0 1 5-5h2"/>
      <circle cx="17" cy="10" r="3"/>
      <path d="M14 21v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1"/>
    </svg>
  );
}

// Blockchain / Escudo con verificacion
export function IconShieldCheck({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l8 3v6c0 5-4 9-8 11C8 20 4 16 4 11V5l8-3z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

// Reportes - grafica de barras
export function IconReportes({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v18h18"/>
      <rect x="7" y="10" width="3" height="8" rx="1"/>
      <rect x="12" y="6" width="3" height="12" rx="1"/>
      <rect x="17" y="13" width="3" height="5" rx="1"/>
    </svg>
  );
}

// Sistema - servidor
export function IconSistema({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="8" rx="2"/>
      <rect x="2" y="13" width="20" height="8" rx="2"/>
      <circle cx="6" cy="7" r="1" fill="currentColor" stroke="none"/>
      <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none"/>
      <path d="M10 17h8"/>
    </svg>
  );
}

// Database / Backup
export function IconDatabase({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
      <path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/>
      <path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
    </svg>
  );
}
