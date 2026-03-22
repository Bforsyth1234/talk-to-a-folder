import { useState, useEffect } from 'react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const LOCAL_STORAGE_KEY = 'todoList';

export const useTodos = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validatedTodos = parsed.map((todo: any) => {
            if (todo.id && todo.text && typeof todo.completed === 'boolean' && todo.createdAt) {
              return {
                ...todo,
                createdAt: new Date(todo.createdAt)
              };
            } else {
              console.warn('Invalid todo item:', todo);
              return null;
            }
          }).filter(Boolean);
          setTodos(validatedTodos);
        } else {
          console.warn('Invalid todos data:', parsed);
          setTodos([]);
        }
      } catch (error) {
        console.warn('Failed to load todos from localStorage');
        setTodos([]);
      }
    }
  }, []);

  // Save to localStorage whenever todos change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
      console.warn('Failed to save todos to localStorage:', error);
    }
  }, [todos]);

  const addTodo = (text: string) => {
    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      } else {
        return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      }
    };

    const newTodo: TodoItem = {
      id: generateId(),
      text: text.trim(),
      completed: false,
      createdAt: new Date()
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return { todos, addTodo, toggleTodo, deleteTodo };
};

export type { TodoItem };
