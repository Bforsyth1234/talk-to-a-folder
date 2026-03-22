"use client";

import { useState } from "react";
import { useTodos } from "@/hooks/use-todos";
import { TodoItem } from "@/components/todo-item";

export default function TodosPage() {
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo } = useTodos();
  const [newTodoText, setNewTodoText] = useState("");

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      addTodo(newTodoText);
      setNewTodoText("");
    }
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
            ✓
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My Todos
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {totalCount === 0
              ? "No todos yet. Add one below!"
              : `${completedCount} of ${totalCount} completed`}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <form onSubmit={handleAddTodo} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a new todo..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!newTodoText.trim()}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                Add
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {todos.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <p>No todos yet. Add your first todo above!</p>
              </div>
            ) : (
              todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
