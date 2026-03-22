"use client";

import { useState, useEffect } from "react";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // CRUD operations
  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTodos([...todos, newTodo]);
  };

  const updateTodo = (id: number, text: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, text: text.trim() } : todo
    ));
  };

  const toggleComplete = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">My Todos</h2>
        <p className="text-sm text-gray-500">
          {completedCount} of {totalCount} completed
        </p>
      </div>
      
      <TodoForm onSubmit={addTodo} />
      
      <div className="space-y-3">
        {todos.map(todo => (
          <TodoItem 
            key={todo.id}
            todo={todo}
            onUpdate={updateTodo}
            onToggle={toggleComplete}
            onDelete={deleteTodo}
          />
        ))}
      </div>
      
      {todos.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">No todos yet. Add one above!</p>
        </div>
      )}
    </div>
  );
}
