"use client";

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TodoItem } from './TodoItem';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export function TodoList() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: trimmedText,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos(prev => [...prev, newTodo]);
    setInputValue('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    } else if (e.key === 'Escape') {
      setInputValue('');
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Todo List</h2>
        {totalCount > 0 && (
          <p className="text-sm text-gray-500">
            {completedCount} of {totalCount} completed
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Add a new todo..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="New todo text"
          />
          <button
            onClick={addTodo}
            disabled={!inputValue.trim()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              inputValue.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No todos yet. Add one above to get started!</p>
          </div>
        ) : (
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              id={todo.id}
              text={todo.text}
              completed={todo.completed}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))
        )}
      </div>

      {todos.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{todos.filter(t => !t.completed).length} remaining</span>
            {completedCount > 0 && (
              <button
                onClick={() => setTodos(prev => prev.filter(todo => !todo.completed))}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Clear completed
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
