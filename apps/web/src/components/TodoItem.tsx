interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ id, text, completed, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      completed 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-white border-gray-300'
    }`}>
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(id)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        aria-label={`Mark "${text}" as ${completed ? 'incomplete' : 'complete'}`}
      />
      <span className={`flex-1 ${
        completed 
          ? 'text-gray-500 line-through' 
          : 'text-gray-900'
      }`}>
        {text}
      </span>
      <button
        onClick={() => onDelete(id)}
        className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded p-1"
        aria-label={`Delete "${text}"`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
