// Placeholder auth context - replace with actual implementation
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useAuth = () => {
  return {
    session: null,
    handleAuthCallback: async () => {},
    isLoading: false,
    signOut: () => {},
    accessToken: null,
  };
};
