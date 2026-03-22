"use client";

import { useState, useRef, useEffect } from 'react';
import type { TodoItem as TodoItemType } from '@/hooks/useTodos';

interface TodoItemProps {
  todo: TodoItemType;
  onUpdate: (id: string, updates: Partial<TodoItemType>) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export function TodoItem({ todo, onUpdate, onDelete, onToggleComplete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSavedRef = useRef(false);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    // Prevent duplicate saves in the same edit session
    if (hasSavedRef.current) {
      return;
    }
    
    hasSavedRef.current = true;
    
    const trimmedText = editText.trim();
    if (trimmedText && trimmedText !== todo.text) {
      onUpdate(todo.id, { text: trimmedText });
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(todo.id);
    } else {
      setShowDeleteConfirm(true);
      deleteTimeoutRef.current = setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-sm">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
      />
      
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded border border-blue-500 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Edit todo text"
        />
      ) : (
        <span
          onDoubleClick={() => {
            setIsEditing(true);
            hasSavedRef.current = false; // Reset save flag when entering edit mode
          }}
          className={`flex-1 cursor-text select-none text-sm ${
            todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}
          title="Double-click to edit"
        >
          {todo.text}
        </span>
      )}
      
      <button
        onClick={handleDelete}
        className={`ml-auto rounded px-2 py-1 text-xs font-medium transition-colors ${
          showDeleteConfirm
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'text-gray-400 opacity-0 hover:text-red-600 group-hover:opacity-100'
        }`}
        aria-label={showDeleteConfirm ? 'Confirm delete' : 'Delete todo'}
      >
        {showDeleteConfirm ? 'Confirm' : 'Delete'}
      </button>
    </div>
  );
}
