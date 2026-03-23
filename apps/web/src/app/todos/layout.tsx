import { Navigation } from '@/components/Navigation';

export default function TodosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
