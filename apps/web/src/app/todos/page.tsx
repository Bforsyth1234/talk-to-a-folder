"use client";

import { TodoList } from '@/components/TodoList';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TodosPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/');
    }
  }, [session, isLoading, router]);

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Todo List</h1>
          <p className="mt-2 text-gray-600">Manage your tasks with local storage persistence</p>
        </div>
        <TodoList />
      </div>
    </main>
  );
}
