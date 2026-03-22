import { useTodos } from '@/hooks/useTodos';
import AddTodoForm from './AddTodoForm';
import TodoItem from './TodoItem';

export default function TodoList() {
  const { todos, isLoading, addTodo, editTodo, deleteTodo, toggleTodo, clearCompleted } = useTodos();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading todos...</div>
      </div>
    );
  }

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Todo List</h2>
        <p className="text-sm text-gray-500">
          {activeCount} active, {completedCount} completed
        </p>
      </div>

      <AddTodoForm onAdd={addTodo} />

      {todos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500">No todos yet. Add one above to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onEdit={editTodo}
              onDelete={deleteTodo}
            />
          ))}
        </div>
      )}

      {completedCount > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={clearCompleted}
            className="text-sm text-red-600 hover:text-red-800 hover:underline"
          >
            Clear {completedCount} completed todo{completedCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
