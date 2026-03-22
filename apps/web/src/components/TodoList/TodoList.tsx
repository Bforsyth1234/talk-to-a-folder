"use client";

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TodoItem } from './TodoItem';
import { Todo } from '@/types/todo';
import styles from './TodoList.module.css';

export function TodoList() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
  const [inputText, setInputText] = useState('');

  const addTodo = () => {
    if (inputText.trim()) {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        text: inputText.trim(),
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setTodos([...todos, newTodo]);
      setInputText('');
    }
  };

  const editTodo = (id: string, newText: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, text: newText, updatedAt: Date.now() }
        : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleComplete = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
        : todo
    ));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className={styles.todoList}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Todo List</h2>
        <div className={styles.stats}>
          {totalCount > 0 && (
            <span className={styles.counter}>
              {completedCount} of {totalCount} completed
            </span>
          )}
        </div>
      </div>

      <div className={styles.addTodo}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add a new todo..."
          className={styles.addInput}
        />
        <button onClick={addTodo} className={styles.addButton}>
          Add Todo
        </button>
      </div>

      <div className={styles.todos}>
        {todos.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No todos yet. Add one above to get started!</p>
          </div>
        ) : (
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onEdit={editTodo}
              onDelete={deleteTodo}
              onToggle={toggleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}
