"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Navigation() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();

  if (!session) return null;

  return (
    <header className="bg-blue-500 text-white shadow-lg">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Talk to a Folder
          </Link>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className={`rounded px-3 py-1 transition-colors ${
                pathname === '/dashboard' ? 'bg-blue-600' : 'hover:bg-blue-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/todos"
              className={`rounded px-3 py-1 transition-colors ${
                pathname === '/todos' ? 'bg-blue-600' : 'hover:bg-blue-600'
              }`}
            >
              Todos
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{session.email}</span>
          <button
            onClick={signOut}
            className="rounded bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700"
          >
            Sign Out
          </button>
        </div>
      </nav>
    </header>
  );
}
