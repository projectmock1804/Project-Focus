import React, { useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '../firebase';

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
};

// Sync user to Firestore after Firebase Auth — sends Firebase ID token for server verification
async function syncUser(user, displayName) {
  try {
    const token = await user.getIdToken();
    await fetch('/api/auth/ensure-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ displayName }),
    });
  } catch (err) {
    console.error('Failed to sync user:', err);
  }
}

export default function Auth({ onSignIn }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function friendlyError(code) {
    const map = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }

  async function handleEmailAuth(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;

      if (mode === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await syncUser(userCredential.user, displayName || email.split('@')[0]);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUser(userCredential.user, userCredential.user.displayName || email.split('@')[0]);
      }

      const { uid, email: userEmail } = userCredential.user;
      localStorage.setItem('userId', uid);
      localStorage.setItem('displayName', userCredential.user.displayName || displayName || email.split('@')[0]);
      onSignIn(uid, userEmail || email);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, email: userEmail, displayName: googleName } = result.user;
      await syncUser(result.user, googleName);
      localStorage.setItem('userId', uid);
      localStorage.setItem('displayName', googleName || userEmail.split('@')[0]);
      onSignIn(uid, userEmail);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(friendlyError(err.code));
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px',
    fontFamily: F.ui,
    fontSize: 14,
    background: C.surface,
    border: `1px solid ${C.border2}`,
    borderRadius: 6,
    color: C.bone,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    fontFamily: F.ui,
    fontSize: 12,
    color: C.bone40,
    display: 'block',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.ink, color: C.bone }}>
      {/* Left — Branding */}
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
        <h1 style={{ fontFamily: F.display, fontSize: 52, margin: '0 0 20px 0', letterSpacing: '-0.02em' }}>
          Project Focus
        </h1>
        <p style={{ fontFamily: F.ui, fontSize: 16, color: C.bone40, margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
          Deep focus. Real productivity.
        </p>
        <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['AI-powered task planning', 'Progress tracking', 'Focus session analytics'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: F.ui, fontSize: 13, color: C.bone40 }}>
              <span style={{ color: C.moss, fontSize: 16 }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right — Form */}
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
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontFamily: F.display, fontSize: 32, margin: '0 0 8px 0' }}>
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontFamily: F.ui, fontSize: 14, color: C.bone40, margin: '0 0 32px 0' }}>
            {mode === 'signin' ? 'Sign in to continue.' : 'Get started for free.'}
          </p>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontFamily: F.ui,
              fontSize: 14,
              fontWeight: 500,
              background: C.surface,
              color: C.bone,
              border: `1px solid ${C.border2}`,
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 20,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontFamily: F.ui, fontSize: 11, color: C.bone40 }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: 12,
                  background: C.ember + '18',
                  border: `1px solid ${C.ember}40`,
                  borderRadius: 6,
                  color: C.ember,
                  fontFamily: F.ui,
                  fontSize: 13,
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
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <span style={{ fontFamily: F.ui, fontSize: 13, color: C.bone40 }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.ember,
                  fontFamily: F.ui,
                  fontSize: 13,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
