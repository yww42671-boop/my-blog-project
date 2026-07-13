import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import BackgroundVideo from './components/BackgroundVideo';
import LoginForm from './components/LoginForm';
import MainInterface from './components/MainInterface';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [loggedInUser, setLoggedInUser] = useState(null);

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
