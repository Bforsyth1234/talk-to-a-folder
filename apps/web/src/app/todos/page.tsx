import { TodoList } from '@/components/TodoList';

export default function TodosPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <TodoList />
      </div>
    </main>
  );
}
