// src/app/superadmin/layout.tsx
import { Metadata } from 'next';
export const metadata: Metadata = { title: 'SuperAdmin — HBJ' };
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
