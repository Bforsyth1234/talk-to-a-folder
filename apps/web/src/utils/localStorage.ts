export const storageKeys = {
  TODOS: 'app-todos'
} as const;

export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    // Handle quota exceeded or other storage errors
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
    }
  }
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    // Return default value if parsing fails
    return defaultValue;
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};
