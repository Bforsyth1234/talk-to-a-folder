"use client";

import { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span
        className={`flex-1 ${
          todo.completed
            ? "text-gray-500 line-through"
            : "text-gray-900"
        }`}
      >
        {todo.text}
      </span>
      <button
        onClick={onDelete}
        className="rounded-md bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Delete
      </button>
    </div>
  );
}
