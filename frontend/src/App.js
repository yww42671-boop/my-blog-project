import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import BackgroundVideo from './components/BackgroundVideo';
import LoginForm from './components/LoginForm';
import MainInterface from './components/MainInterface';

function AppContent() {
  const { user, loading, logout, githubLogin } = useAuth();
  const [loggedInUser, setLoggedInUser] = useState(null);

  // GitHub OAuth 回调：从 URL 读取 token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      githubLogin(token);
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [githubLogin]);

  // 优先使用 AuthContext 的 user，其次 fallback 到本地状态
  const currentUser = user?.username || loggedInUser;

  const handleLogout = () => {
    logout();              // 清除 JWT token + AuthContext user
    setLoggedInUser(null); // 清除本地登录状态
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#000', color: '#e8e0d0',
        fontFamily: "'Special Elite', monospace", fontSize: 18,
      }}>
        loading...
      </div>
    );
  }

  return (
    <>
      <BackgroundVideo />
      {!currentUser ? (
        <LoginForm onLoginSuccess={(name) => setLoggedInUser(name)} />
      ) : (
        <MainInterface
          username={currentUser}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
