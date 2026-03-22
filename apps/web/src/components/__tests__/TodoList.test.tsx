import { render, screen, fireEvent } from '@testing-library/react';
import { TodoList } from '../TodoList';

// Mock the useLocalStorage hook
jest.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(() => [[], jest.fn()]),
}));

describe('TodoList', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders empty state correctly', () => {
    render(<TodoList />);
    
    expect(screen.getByText('Todo List')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a new todo...')).toBeInTheDocument();
    expect(screen.getByText('No todos yet. Add one above to get started!')).toBeInTheDocument();
  });

  it('adds a new todo when Add button is clicked', () => {
    const mockSetTodos = jest.fn();
    const { useLocalStorage } = require('@/hooks/useLocalStorage');
    useLocalStorage.mockReturnValue([[], mockSetTodos]);

    render(<TodoList />);
    
    const input = screen.getByPlaceholderText('Add a new todo...');
    const addButton = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: 'Test todo' } });
    fireEvent.click(addButton);
    
    expect(mockSetTodos).toHaveBeenCalled();
  });

  it('prevents adding empty todos', () => {
    const mockSetTodos = jest.fn();
    const { useLocalStorage } = require('@/hooks/useLocalStorage');
    useLocalStorage.mockReturnValue([[], mockSetTodos]);

    render(<TodoList />);
    
    const input = screen.getByPlaceholderText('Add a new todo...');
    const addButton = screen.getByText('Add');
    
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(addButton);
    
    expect(mockSetTodos).not.toHaveBeenCalled();
  });

  it('adds todo when Enter key is pressed', () => {
    const mockSetTodos = jest.fn();
    const { useLocalStorage } = require('@/hooks/useLocalStorage');
    useLocalStorage.mockReturnValue([[], mockSetTodos]);

    render(<TodoList />);
    
    const input = screen.getByPlaceholderText('Add a new todo...');
    
    fireEvent.change(input, { target: { value: 'Test todo' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockSetTodos).toHaveBeenCalled();
  });
});
