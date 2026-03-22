"use client";

import { useState } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const { todos, isLoading, addTodo, updateTodo, deleteTodo, toggleComplete } = useTodos();
  const [newTodoText, setNewTodoText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      addTodo(newTodoText);
      setNewTodoText('');
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeTodoCount = todos.filter(todo => !todo.completed).length;
  const completedTodoCount = todos.filter(todo => todo.completed).length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading todos...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">My Todos</h2>
      
      {/* Add new todo form */}
      <form onSubmit={handleAddTodo} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="What needs to be done?"
            maxLength={200}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="New todo input"
          />
          <button
            type="submit"
            disabled={!newTodoText.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Add Todo
          </button>
        </div>
      </form>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({todos.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({activeTodoCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed ({completedTodoCount})
        </button>
      </div>

      {/* Todo list */}
      {filteredTodos.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          {filter === 'all' && todos.length === 0 ? (
            <p>No todos yet. Add one above to get started!</p>
          ) : (
            <p>No {filter} todos.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
              onToggleComplete={toggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
