import React, { useState, useEffect } from 'react';

const API_BASE = '/api';
const ADMIN_SECRET = 'dev-admin-2026';

const headers = {
  'Content-Type': 'application/json',
  'x-admin-secret': ADMIN_SECRET,
};

export default function Admin({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats`, { headers }),
        fetch(`${API_BASE}/admin/users`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
    setLoading(false);
  }

  async function updateSubscription(uid, status, monthsToAdd) {
    setActionLoading(uid + status);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${uid}/subscription`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status, monthsToAdd }),
      });
      if (res.ok) {
        setMessage('Updated successfully');
        setTimeout(() => setMessage(''), 3000);
        loadData();
      }
    } catch (err) {
      setMessage('Failed: ' + err.message);
    }
    setActionLoading(null);
  }

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  const C = {
    bg: '#0E0E0C',
    card: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.1)',
    text: '#F2F0EB',
    muted: 'rgba(242,240,235,0.5)',
    orange: '#E86B3A',
    green: '#4CAF50',
    blue: '#667eea',
    red: '#ef5350',
  };

  function StatusBadge({ status, freeTrialEndsAt, paidUntil }) {
    const now = new Date();
    let label, color, bg;
    if (status === 'paid' && paidUntil && new Date(paidUntil) > now) {
      label = 'Paid'; color = C.green; bg = 'rgba(76,175,80,0.1)';
    } else if (freeTrialEndsAt && new Date(freeTrialEndsAt) > now) {
      const days = Math.ceil((new Date(freeTrialEndsAt) - now) / (1000 * 60 * 60 * 24));
      label = `Trial (${days}d)`; color = C.blue; bg = 'rgba(102,126,234,0.1)';
    } else {
      label = 'Expired'; color = C.red; bg = 'rgba(239,83,80,0.1)';
    }
    return (
      <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color, background: bg, border: `1px solid ${color}40` }}>
        {label}
      </span>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 32px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, background: C.orange, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>&#9635;</div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Project Focus Admin</span>
        </div>
        <button onClick={onLogout} style={{ padding: '8px 16px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          Logout
        </button>
      </div>

      <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
        {message && (
          <div style={{ padding: '10px 16px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 8, marginBottom: 24, color: C.green, fontSize: 14 }}>
            {message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading...</div>
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'Total Users', value: stats.totalUsers, color: C.text },
                  { label: 'Paid Users', value: stats.paidUsers, color: C.green },
                  { label: 'Trial Users', value: stats.trialUsers, color: C.blue },
                  { label: 'New (7 days)', value: stats.newUsersLast7Days, color: C.orange },
                  { label: 'Est. MRR', value: `₩${(stats.estimatedMRR || 0).toLocaleString()}`, color: C.green },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px' }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', maxWidth: 360, padding: '10px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Users Table */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Users ({filteredUsers.length})</span>
                <button onClick={loadData} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: 'pointer', fontSize: 13 }}>Refresh</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Email', 'Name', 'Joined', 'Status', 'Tasks', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: C.muted }}>No users found</td></tr>
                    ) : filteredUsers.map(user => (
                      <tr key={user.uid} style={{ borderBottom: `1px solid ${C.border}20` }}>
                        <td style={{ padding: '12px 16px', fontSize: 14 }}>{user.email || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, color: C.muted }}>{user.displayName || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={user.subscriptionStatus} freeTrialEndsAt={user.freeTrialEndsAt} paidUntil={user.paidUntil} />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: C.muted }}>{user.tasksCreated}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => updateSubscription(user.uid, 'paid', 1)}
                              disabled={actionLoading === user.uid + 'paid'}
                              style={{ padding: '5px 10px', background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 5, color: C.green, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                              +1 month
                            </button>
                            <button
                              onClick={() => updateSubscription(user.uid, 'trial_reset')}
                              disabled={actionLoading === user.uid + 'trial_reset'}
                              style={{ padding: '5px 10px', background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 5, color: C.blue, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
                            >
                              Trial reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
