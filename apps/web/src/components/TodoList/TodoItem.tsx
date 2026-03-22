import { useState, KeyboardEvent } from 'react';
import type { Todo } from '@/types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    if (editText.trim() && editText !== todo.text) {
      onEdit(todo.id, editText);
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 cursor-pointer text-sm ${
            todo.completed 
              ? 'text-gray-500 line-through' 
              : 'text-gray-900 hover:text-blue-600'
          }`}
        >
          {todo.text}
        </span>
      )}

      <div className="flex gap-1">
        {isEditing ? (
          <button
            onClick={handleEdit}
            className="rounded p-1 text-gray-400 hover:bg-green-100 hover:text-green-600"
            title="Save"
          >
            ✔️
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Edit"
          >
            ✏️
          </button>
        )}
        {isEditing && (
          <button
            onClick={() => {
              setEditText(todo.text);
              setIsEditing(false);
            }}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Cancel"
          >
            ❌
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
