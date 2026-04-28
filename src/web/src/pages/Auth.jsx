import React, { useState } from 'react';

const C = {
  ink: '#0E0E0C',
  graphite: '#1C1C19',
  surface: '#252520',
  bone: '#F2F0EB',
  bone40: '#F2F0EB40',
  bone10: '#F2F0EB10',
  ember: '#E86B3A',
  moss: '#6B8E5A',
  border: '#3A3933',
  border2: '#4A4943',
};

const F = {
  display: '"Fraunces", serif',
  ui: '"Inter", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

export default function Auth({ onSignIn }) {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Note: In production, use Firebase SDK for client-side auth
      // This is a placeholder for the auth flow
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign in failed');

      // Store token and user info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('displayName', data.displayName);

      onSignIn(data.userId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign up failed');

      // Store token and user info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('displayName', data.displayName);

      onSignIn(data.userId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: C.ink,
        color: C.bone,
      }}
    >
      {/* Left side - Branding */}
      <div
        style={{
          flex: 1,
          background: `linear-gradient(135deg, ${C.graphite}, ${C.surface})`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
        }}
      >
        <h1 style={{ fontFamily: F.display, fontSize: 48, margin: '0 0 24px 0' }}>
          Project Focus
        </h1>
        <p style={{ fontFamily: F.ui, fontSize: 16, color: C.bone40, margin: 0, textAlign: 'center' }}>
          깊은 집중력으로 진정한 생산성을 경험하세요
        </p>
      </div>

      {/* Right side - Auth Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontFamily: F.display, fontSize: 32, margin: '0 0 32px 0' }}>
            {mode === 'signin' ? '로그인' : '가입하기'}
          </h2>

          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: F.ui, fontSize: 12, display: 'block', marginBottom: 8 }}>
                  이름
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontFamily: F.ui,
                    fontSize: 14,
                    background: C.surface,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 6,
                    color: C.bone,
                    boxSizing: 'border-box',
                  }}
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: F.ui, fontSize: 12, display: 'block', marginBottom: 8 }}>
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontFamily: F.ui,
                  fontSize: 14,
                  background: C.surface,
                  border: `1px solid ${C.border2}`,
                  borderRadius: 6,
                  color: C.bone,
                  boxSizing: 'border-box',
                }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: F.ui, fontSize: 12, display: 'block', marginBottom: 8 }}>
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontFamily: F.ui,
                  fontSize: 14,
                  background: C.surface,
                  border: `1px solid ${C.border2}`,
                  borderRadius: 6,
                  color: C.bone,
                  boxSizing: 'border-box',
                }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div
                style={{
                  padding: 12,
                  background: C.ember + '20',
                  border: `1px solid ${C.ember}`,
                  borderRadius: 6,
                  color: C.ember,
                  fontFamily: F.ui,
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontFamily: F.ui,
                fontSize: 14,
                fontWeight: 600,
                background: loading ? C.bone40 : C.moss,
                color: C.ink,
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Processing...' : mode === 'signin' ? '로그인' : '가입'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40 }}>
              {mode === 'signin' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.ember,
                  fontFamily: F.ui,
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {mode === 'signin' ? '가입하기' : '로그인'}
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
