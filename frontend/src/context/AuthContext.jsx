import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('emp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((userData) => {
    localStorage.setItem('emp_token', userData.token);
    localStorage.setItem('emp_user', JSON.stringify({
      username: userData.username,
      role: userData.role,
    }));
    setUser({ username: userData.username, role: userData.role });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('emp_token');
    localStorage.removeItem('emp_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
