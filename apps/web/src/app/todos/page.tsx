import { TodoList } from "@/components/todo-list";
import Link from "next/link";

export default function TodosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            ← Back to Home
          </Link>
        </div>
        
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <TodoList />
        </div>
      </div>
    </main>
  );
}
