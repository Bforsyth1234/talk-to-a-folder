import type { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';

export default function TodosLayout({
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
