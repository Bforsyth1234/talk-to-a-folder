import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextProps {
  children: React.ReactNode;
}

interface Session {
  userId: string;
  googleToken: {
    accessToken: string;
    expiresAt: number;
  };
}

interface AuthContextValue {
  session: Session | null;
  handleAuthCallback: (code: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  handleAuthCallback: async () => {},
  isLoading: false,
});

const AuthProvider = ({ children }: AuthContextProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/callback', { code });
      const newSession: Session = response.data.session;
      setSession(newSession);
      localStorage.setItem('session', JSON.stringify(newSession));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      const parsedSession: Session = JSON.parse(storedSession);
      if (parsedSession.googleToken.expiresAt > Date.now()) {
        setSession(parsedSession);
      } else {
        localStorage.removeItem('session');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, handleAuthCallback, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
