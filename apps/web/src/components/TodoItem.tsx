"use client";

import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: number, text: string) => void;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onUpdate, onToggle, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim()) {
      onUpdate(todo.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-4 ${
      todo.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
    }`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-1 gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <span
            className={`flex-1 cursor-pointer ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
            onClick={() => setIsEditing(true)}
          >
            {todo.text}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}
