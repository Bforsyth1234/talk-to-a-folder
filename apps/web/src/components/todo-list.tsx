"use client";

import { useState, useEffect } from "react";
import { Todo } from "@/types/todo";
import { todoStorage } from "@/lib/todo-storage";
import { TodoInput } from "./todo-input";
import { TodoItem } from "./todo-item";

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load todos on mount
  useEffect(() => {
    setTodos(todoStorage.getTodos());
    setIsLoaded(true);
  }, []);

  // Save todos whenever they change (but not on initial load)
  useEffect(() => {
    if (isLoaded) {
      todoStorage.saveTodos(todos);
    }
  }, [todos, isLoaded]);

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date()
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Todo List</h1>
        <p className="mt-2 text-gray-600">
          {completedCount} of {totalCount} tasks completed
        </p>
      </div>

      <TodoInput onAdd={addTodo} />

      {todos.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
          No todos yet. Add one above to get started!
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {todos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => toggleTodo(todo.id)}
                onDelete={() => deleteTodo(todo.id)}
              />
            ))}
          </div>

          {completedCount > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={clearCompleted}
                className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Clear Completed ({completedCount})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
