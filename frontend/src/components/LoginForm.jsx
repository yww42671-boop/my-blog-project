import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';

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
              marginBottom: '24px',
            }}
          />
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
