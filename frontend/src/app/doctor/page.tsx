// src/app/doctor/page.tsx
'use client';
import dynamic from 'next/dynamic';

const DoctorDashboardClient = dynamic(
  () => import('./DoctorDashboardClient'),
  { ssr: false }
);

export default function DoctorPage() {
  return <DoctorDashboardClient />;
}
