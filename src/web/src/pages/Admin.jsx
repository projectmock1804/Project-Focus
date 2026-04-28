import React, { useState, useEffect } from 'react';

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

export default function Admin({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [activeTab]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setLoading(false);
    }
  }

  async function fetchComplaints() {
    try {
      const res = await fetch('/api/admin/complaints');
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    }
  }

  const StatCard = ({ label, value, color }) => (
    <div
      style={{
        flex: 1,
        padding: 24,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
      }}
    >
      <div style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, marginBottom: 12 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: F.display,
          fontSize: 36,
          fontWeight: 600,
          color: color || C.bone,
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.ink, color: C.bone }}>
      {/* Sidebar */}
      <div
        style={{
          width: 240,
          background: C.graphite,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        <h1 style={{ fontFamily: F.display, fontSize: 20, margin: '0 0 32px 0' }}>
          관리자 대시보드
        </h1>

        <div style={{ flex: 1 }}>
          {['overview', 'complaints', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                marginBottom: 8,
                fontFamily: F.ui,
                fontSize: 12,
                fontWeight: activeTab === tab ? 600 : 400,
                background: activeTab === tab ? C.surface : 'transparent',
                color: activeTab === tab ? C.bone : C.bone40,
                border: `1px solid ${activeTab === tab ? C.border : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {tab === 'overview' && '📊 통계'}
              {tab === 'complaints' && '📢 컴플레인'}
              {tab === 'settings' && '⚙️ 설정'}
            </button>
          ))}
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '12px',
            fontFamily: F.ui,
            fontSize: 12,
            background: 'transparent',
            color: C.bone40,
            border: `1px solid ${C.border2}`,
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, margin: '0 0 32px 0' }}>
              통계
            </h2>

            {loading ? (
              <div style={{ fontFamily: F.ui, fontSize: 14, color: C.bone40 }}>
                Loading...
              </div>
            ) : stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                  <StatCard label="총 사용자" value={stats.totalUsers} color={C.moss} />
                  <StatCard label="총 작업" value={stats.totalTasks} color={C.ember} />
                  <StatCard label="완료된 작업" value={stats.completedTasks} />
                  <StatCard label="오늘 생성" value={stats.tasksCreatedToday} color={C.ember} />
                </div>

                <div
                  style={{
                    padding: 24,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, marginBottom: 12 }}>
                    완료율
                  </div>
                  <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 600 }}>
                    {stats.completionRate}%
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'complaints' && (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, margin: '0 0 32px 0' }}>
              컴플레인
            </h2>

            {complaints.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.bone40,
                  fontFamily: F.ui,
                  fontSize: 14,
                }}
              >
                컴플레인이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    style={{
                      padding: 16,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40 }}>
                        {complaint.userId}
                      </span>
                      <span
                        style={{
                          fontFamily: F.ui,
                          fontSize: 11,
                          color: complaint.status === 'new' ? C.ember : C.moss,
                          padding: '2px 8px',
                          background: complaint.status === 'new' ? C.ember + '20' : C.moss + '20',
                          borderRadius: 4,
                        }}
                      >
                        {complaint.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontSize: 13,
                        color: C.bone,
                        marginBottom: 8,
                      }}
                    >
                      {complaint.complaint}
                    </div>
                    <div
                      style={{
                        fontFamily: F.ui,
                        fontSize: 11,
                        color: C.bone40,
                      }}
                    >
                      {new Date(complaint.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 style={{ fontFamily: F.display, fontSize: 28, margin: '0 0 32px 0' }}>
              설정
            </h2>

            <div
              style={{
                padding: 24,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
              }}
            >
              <p style={{ fontFamily: F.ui, fontSize: 14, color: C.bone40 }}>
                설정 기능은 준비 중입니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
