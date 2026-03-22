"use client";

import { useState, useEffect } from "react";
import { TodoItem } from "./TodoItem";
import { TodoForm } from "./TodoForm";

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (error) {
        console.error('Failed to parse todos from localStorage:', error);
      }
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const editTodo = (id: number, newText: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: newText.trim() } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          📝 Todo List
        </h2>
        <p className="text-sm text-gray-500">
          {totalCount > 0 ? `${completedCount} of ${totalCount} tasks completed` : 'Keep track of your tasks'}
        </p>
      </div>
      
      <TodoForm onSubmit={addTodo} />
      
      <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onEdit={editTodo}
            onDelete={deleteTodo}
          />
        ))}
        {todos.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No todos yet. Add one above to get started!</p>
          </div>
        )}
      </div>
    </section>
  );
}
