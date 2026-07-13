import { createContext, useContext, useState, useEffect } from 'react';
import { setToken, setStoredUser, getStoredUser, authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  // 页面刷新时从 localStorage 恢复
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data;
  };

  const register = async (username, password, nickname) => {
    const data = await authApi.register(username, password, nickname);
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
