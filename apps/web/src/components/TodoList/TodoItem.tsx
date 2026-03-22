"use client";

import { useState } from 'react';
import { Todo } from '@/types/todo';
import styles from './TodoList.module.css';

interface TodoItemProps {
  todo: Todo;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TodoItem({ todo, onEdit, onDelete, onToggle }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleEdit = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`${styles.todoItem} ${todo.completed ? styles.completed : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className={styles.checkbox}
      />
      
      {isEditing ? (
        <div className={styles.editMode}>
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            className={styles.editInput}
            autoFocus
          />
          <button onClick={handleEdit} className={styles.saveButton}>
            Save
          </button>
          <button onClick={handleCancel} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      ) : (
        <div className={styles.viewMode}>
          <span className={styles.todoText}>{todo.text}</span>
          <div className={styles.actions}>
            <button
              onClick={() => setIsEditing(true)}
              className={styles.editButton}
              disabled={todo.completed}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className={styles.deleteButton}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
