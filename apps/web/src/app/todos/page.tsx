"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

const loadTodos = (): Todo[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("todos");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load todos:", error);
    return [];
  }
};

const saveTodos = (todos: Todo[]): void => {
  try {
    localStorage.setItem("todos", JSON.stringify(todos));
  } catch (error) {
    console.error("Failed to save todos:", error);
  }
};

export default function TodosPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.replace("/");
      return;
    }
    
    const loadedTodos = loadTodos();
    setTodos(loadedTodos);
    setIsLoading(false);
  }, [session, router]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTodos = [newTodo, ...todos];
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
    setNewTodoText("");
  };

  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-600 text-2xl text-white">
            ✓
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My Todo List
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Keep track of your tasks and stay organized
          </p>
          {totalCount > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {completedCount} of {totalCount} completed
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <form onSubmit={addTodo} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a new todo..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!newTodoText.trim()}
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Add
              </button>
            </div>
          </form>

          {todos.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-400">
                📝
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No todos yet
              </h3>
              <p className="text-sm text-gray-500">
                Add your first todo above to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                    todo.completed
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                      todo.completed
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    {todo.completed && (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      todo.completed
                        ? "text-gray-500 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete todo"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
