"use client";

import React, { useState } from 'react';
import { Todo } from '@/types/todo';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onUpdate, onToggle, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(todo.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="flex-1 rounded border border-gray-300 px-3 py-1 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span
            className={`flex-1 cursor-pointer ${
              todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
            onDoubleClick={() => setIsEditing(true)}
          >
            {todo.text}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded bg-gray-200 px-2 py-1 text-sm text-gray-700 hover:bg-gray-300"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="rounded bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600"
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
};
