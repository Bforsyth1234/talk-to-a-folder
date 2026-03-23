import type { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
