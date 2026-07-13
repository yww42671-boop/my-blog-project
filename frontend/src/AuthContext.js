import { createContext, useContext, useState, useEffect } from 'react';
import { setToken, setStoredUser, getStoredUser, authApi } from './api';

// 解码 JWT payload（不带验证，仅读取）
function parseToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

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

  // GitHub OAuth：用 token 直接登录
  const githubLogin = (token) => {
    const payload = parseToken(token);
    if (!payload) return;
    const githubUser = { id: payload.id, username: payload.username, nickname: payload.nickname };
    setToken(token);
    setStoredUser(githubUser);
    setUser(githubUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, githubLogin }}>
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
