"use client";

import React, { useState } from 'react';
import { TodoItem } from './TodoItem';
import { Todo } from '@/types/todo';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
  const [newTodoText, setNewTodoText] = useState('');

  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: Todo = {
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: newTodoText.trim(),
        completed: false,
        createdAt: Date.now()
      };
      setTodos([...todos, newTodo]);
      setNewTodoText('');
    }
  };

  const updateTodo = (id: string, text: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text } : todo
    ));
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">My Todo List</h2>
        
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTodo();
            }}
            placeholder="Add a new todo..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={addTodo}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>

        {totalCount > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            {completedCount} of {totalCount} completed
          </div>
        )}
      </div>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
            No todos yet. Add one above to get started!
          </div>
        ) : (
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onUpdate={updateTodo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))
        )}
      </div>
    </div>
  );
};
