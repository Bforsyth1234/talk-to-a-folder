import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/utils/localStorage';
import type { Todo } from '@/types/todo';

const TODOS_STORAGE_KEY = 'todos';

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = storage.get<Todo[]>(TODOS_STORAGE_KEY);
    const todosWithDates = Array.isArray(savedTodos) ? savedTodos.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt)
    })) : [];
    setTodos(todosWithDates);
    setIsLoading(false);
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    if (!isLoading) {
      storage.set(TODOS_STORAGE_KEY, todos);
    }
  }, [todos, isLoading]);

  const addTodo = useCallback((text: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: new Date()
    };
    setTodos(prev => [newTodo, ...prev]);
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, text: text.trim() } : todo
    ));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  }, []);

  return {
    todos,
    isLoading,
    addTodo,
    editTodo,
    deleteTodo,
    toggleTodo,
    clearCompleted
  };
};
