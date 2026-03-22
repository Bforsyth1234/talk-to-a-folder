"use client";

import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, storageKeys } from '@/utils/localStorage';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export const useTodos = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load todos from localStorage on mount
  useEffect(() => {
    const loadedTodos = loadFromStorage<TodoItem[]>(storageKeys.TODOS, []);
    // Convert date strings back to Date objects
    const parsedTodos = loadedTodos.map(todo => ({
      ...todo,
      createdAt: new Date(todo.createdAt)
    }));
    setTodos(parsedTodos);
    setIsLoading(false);
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveToStorage(storageKeys.TODOS, todos);
    }
  }, [todos, isLoading]);

  const addTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTodos(prev => [newTodo, ...prev]);
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<TodoItem>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    ));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  return {
    todos,
    isLoading,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete
  };
};
