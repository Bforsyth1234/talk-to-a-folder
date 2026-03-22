import { useState, useEffect, useCallback } from "react";
import { Todo } from "@talk-to-a-folder/shared";
import { loadTodos, saveTodos } from "@/utils/storage";

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Load todos on mount
  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  // Save todos whenever they change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback((text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, newTodo]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id 
          ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() } 
          : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const updateTodo = useCallback((id: string, text: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id 
          ? { ...todo, text: text.trim(), updatedAt: new Date().toISOString() } 
          : todo
      )
    );
  }, []);

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
  };
};
