import React, { useState } from 'react';

export default function AdminLogin({ onAdminAccess }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 간단한 검증 - 실제로는 백엔드에서 검증
    if (secret === 'dev-admin-2026') {
      onAdminAccess();
    } else {
      setError('Invalid admin secret');
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0E0E0C',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 32,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: '#E86B3A',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 24,
          }}
        >
          ⚙
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F2F0EB', marginBottom: 8 }}>
          Admin Panel
        </h1>
        <p style={{ color: 'rgba(242,240,235,0.5)', marginBottom: 32, fontSize: 14 }}>
          Enter admin secret to access the control panel
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Admin Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#F2F0EB',
              fontSize: 14,
              marginBottom: 12,
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = 'rgba(232,107,58,0.5)')
            }
            onBlur={(e) =>
              (e.target.style.borderColor = 'rgba(255,255,255,0.1)')
            }
          />

          {error && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(239,83,80,0.1)',
                border: '1px solid rgba(239,83,80,0.3)',
                borderRadius: 6,
                color: '#ef5350',
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
              padding: '12px 16px',
              background: '#E86B3A',
              color: '#F2F0EB',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Accessing...' : 'Access Admin Panel'}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: 'rgba(102,126,234,0.1)',
            border: '1px solid rgba(102,126,234,0.2)',
            borderRadius: 6,
            fontSize: 12,
            color: 'rgba(242,240,235,0.6)',
          }}
        >
          <strong>Admin Features:</strong>
          <ul style={{ marginTop: 8, paddingLeft: 16 }}>
            <li>User management</li>
            <li>Subscription control</li>
            <li>Free tier management</li>
            <li>Statistics & analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
