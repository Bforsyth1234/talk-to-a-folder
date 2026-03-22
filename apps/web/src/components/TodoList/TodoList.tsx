import React, { useState, useEffect } from 'react';
import { todoStorage } from '../../services/todoStorage';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';
import './TodoList.css';

const TodoList = () => {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const savedTodos = todoStorage.getTodos();
    setTodos(savedTodos);
  }, []);

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    todoStorage.saveTodos(updatedTodos);
  };

  const toggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    todoStorage.saveTodos(updatedTodos);
  };

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    todoStorage.saveTodos(updatedTodos);
  };

  return (
    <div className="todo-list">
      <h2>Todo List</h2>
      <TodoForm onSubmit={addTodo} />
      <div className="todo-items">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        ))}
      </div>
    </div>
  );
};

export default TodoList;
