import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { GITHUB_LOGIN_URL } from '../api';

const LINE_DELAY = 200;

export default function LoginForm({ onLoginSuccess }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [revealed, setRevealed] = useState(0);
  const mounted = useRef(false);

  // Left-to-right reveal animation
  useEffect(() => {
    mounted.current = true;
    const lines = ['title', 'form', isLogin ? 'toggle-login' : 'toggle-register'];
    lines.forEach((_, i) => {
      setTimeout(() => {
        if (mounted.current) setRevealed((v) => Math.max(v, i + 1));
      }, i * LINE_DELAY);
    });
    return () => { mounted.current = false; };
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isLogin) {
        await login(username, password);
        setMessage(`🎉 登录成功！欢迎你，${username}`);
        setTimeout(() => onLoginSuccess(username), 600);
      } else {
        await register(username, password, nickname || username);
        setMessage('🎉 注册成功！');
        setTimeout(() => onLoginSuccess(username), 600);
      }
      setPassword('');
    } catch (err) {
      setMessage(`❌ ${err.message || '操作失败'}`);
    }
  };

  const revealStyle = (index) => ({
    clipPath: revealed > index ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
    transition: 'clip-path 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '12.5%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        pointerEvents: 'auto',
        fontFamily: "'Special Elite', 'Courier New', monospace",
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(20, 20, 20, 0.35)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRadius: '24px',
          padding: '36px 44px',
          width: '400px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#e8e0d0',
        }}
      >
        {/* Title */}
        <div style={revealStyle(0)}>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '22px',
              fontWeight: 400,
              letterSpacing: '2px',
              color: '#e8e0d0',
              fontFamily: 'inherit',
            }}
          >
            {isLogin ? '> LOGIN' : '> REGISTER'}
          </h3>
          <div
            style={{
              height: '1px',
              width: '100%',
              background: 'linear-gradient(90deg, rgba(232,224,208,0.5), transparent)',
              marginBottom: '4px',
            }}
          />
          <div style={{ fontSize: 11, color: 'rgba(232,224,208,0.2)', letterSpacing: '2px', marginBottom: 20 }}>
            Melon's Blog
          </div>
        </div>

        {/* Form */}
        <div style={revealStyle(1)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            {!isLogin && (
              <div style={{ marginBottom: '18px' }}>
                <input
                  type="text"
                  placeholder="nickname（显示用，选填）"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
            <div style={{ marginBottom: '22px' }}>
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: 'rgba(232,224,208,0.9)',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 400,
                cursor: 'pointer',
                letterSpacing: '3px',
                fontFamily: 'inherit',
              }}
            >
              {isLogin ? 'ENTER' : 'CREATE'}
            </button>
          </form>
        </div>

        {/* Toggle & Message */}
        <div style={revealStyle(2)}>
          <p
            style={{
              margin: '16px 0 0 0',
              fontSize: '16px',
              color: 'rgba(232,224,208,0.7)',
              textAlign: 'center',
              fontFamily: 'inherit',
            }}
          >
            {isLogin ? '[ no account? ' : '[ have account? '}
            <span
              onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
              style={{
                color: '#e8e0d0',
                textDecoration: 'underline',
                cursor: 'pointer',
                textUnderlineOffset: '2px',
              }}
            >
              {isLogin ? 'register' : 'login'}
            </span>
            {' ]'}
          </p>

          {message && (
            <p
              style={{
                margin: '12px 0 0 0',
                fontSize: '16px',
                textAlign: 'center',
                color: message.includes('❌')
                  ? '#ef9a9a'
                  : message.includes('🎉')
                    ? '#a5d6a7'
                    : '#e8e0d0',
                fontFamily: 'inherit',
              }}
            >
              {message}
            </p>
          )}

          {/* GitHub 登录 */}
          {isLogin && (
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 14, opacity: 0.2,
              }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(232,224,208,0.3)' }} />
                <span style={{ fontSize: 11, letterSpacing: '1px' }}>OR</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(232,224,208,0.3)' }} />
              </div>
              <a
                href={GITHUB_LOGIN_URL}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 24px',
                  backgroundColor: '#24292e',
                  color: '#fff',
                  border: 'none', borderRadius: 12,
                  fontSize: 14, fontFamily: 'inherit',
                  textDecoration: 'none', cursor: 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="white">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Login with GitHub
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '14px 18px',
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px',
  fontSize: '18px',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#e8e0d0',
  fontFamily: 'inherit',
  letterSpacing: '0.5px',
};
