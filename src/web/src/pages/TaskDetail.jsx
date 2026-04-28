import React, { useState, useEffect } from 'react';

// =============================================================================
// Design tokens — dark theme
// =============================================================================
const C = {
  ink: '#0E0E0C',
  graphite: '#1C1C19',
  surface: '#252520',
  bone: '#F2F0EB',
  ember: '#E86B3A',
  moss: '#6B8E5A',
  border: 'rgba(242,240,235,0.06)',
  border2: 'rgba(242,240,235,0.10)',
  bone40: 'rgba(242,240,235,0.40)',
  bone20: 'rgba(242,240,235,0.20)',
  bone10: 'rgba(242,240,235,0.08)',
  ember20: 'rgba(232,107,58,0.18)',
  ember10: 'rgba(232,107,58,0.10)',
  moss20: 'rgba(107,142,90,0.18)',
  moss10: 'rgba(107,142,90,0.10)',
};

const F = {
  title: "'Fraunces', Georgia, serif",
  ui: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// =============================================================================
// Utilities
// =============================================================================
function formatDeadline(isoString) {
  if (!isoString) return 'No deadline';
  const d = new Date(isoString);
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${hour}:${min}`;
}

function statusLabel(status) {
  const map = { pending: '대기', in_progress: '진행 중', completed: '완료' };
  return map[status] || status;
}

function statusColor(status) {
  if (status === 'completed') return C.moss;
  if (status === 'in_progress') return C.ember;
  return C.bone40;
}

function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// =============================================================================
// RingProgress SVG
// =============================================================================
function RingProgress({ pct = 0, size = 96, stroke = 7, color = C.ember }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border2} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// =============================================================================
// TaskDetail page component
// =============================================================================
export default function TaskDetail({ taskId, onBack }) {
  const [task, setTask] = useState(null);
  const [sessionTotals, setSessionTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [expandedMs, setExpandedMs] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        console.log('[TaskDetail] Loading task:', taskId);
        const progressRes = await fetch(`/api/task/${taskId}/progress`);
        console.log('[TaskDetail] Response status:', progressRes.status);

        if (!progressRes.ok) {
          const errText = await progressRes.text();
          console.error('[TaskDetail] Error response:', errText);
          throw new Error(`Task not found (${progressRes.status})`);
        }

        const pdata = await progressRes.json();
        console.log('[TaskDetail] Loaded task data:', pdata);
        setTask(pdata);
        setSessionTotals(pdata.session || null);
      } catch (err) {
        console.error('[TaskDetail] Load error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/task/${taskId}/progress`);
        if (res.ok) {
          const data = await res.json();
          setSessionTotals(data.session || null);
          setTask(prev => prev ? { ...prev, progress: data.progress, status: data.status } : prev);
        }
      } catch { /* non-fatal */ }
    }, 10000);

    return () => clearInterval(id);
  }, [taskId]);

  if (loading) return <LoadingScreen />;
  if (error || !task) return <ErrorScreen error={error} onBack={onBack} />;

  const pct = Math.round(task.progress || 0);
  const ringColor = pct >= 100 ? C.moss : C.ember;
  const focused = sessionTotals?.focusedMinutes || 0;
  const distracted = sessionTotals?.distractedMinutes || 0;
  const totalMin = (task.estimatedHours || 0) * 60;
  const focusRatio = totalMin > 0 ? Math.min((focused / totalMin) * 100, 100) : 0;
  const sessionTotal = focused + distracted;
  const behind = task.status !== 'completed' && pct < 30 && task.deadline &&
    new Date(task.deadline) < new Date(Date.now() + 2 * 3600000);

  const timeTakenMinutes = focused + distracted;

  async function updateStatus(newStatus) {
    try {
      const res = await fetch(`/api/task/${taskId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setShowStatusMenu(false);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function updateMilestone(msIndex, action) {
    try {
      const updated = [...task.milestones];
      const now = new Date().toISOString();
      if (action === 'start') {
        updated[msIndex].startedAt = updated[msIndex].startedAt || now;
      } else if (action === 'complete') {
        updated[msIndex].startedAt = updated[msIndex].startedAt || now;
        updated[msIndex].completedAt = now;
      }
      const res = await fetch(`/api/task/${taskId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestones: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.ink, color: C.bone,
      fontFamily: F.ui, overflowY: 'auto',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 28px',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, background: C.graphite, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: `1px solid ${C.border2}`,
          borderRadius: 6, color: C.bone40, cursor: 'pointer',
          fontFamily: F.ui, fontSize: 12, padding: '5px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
            fontSize: 18, color: C.bone, letterSpacing: '-0.03em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {task.title}
          </h1>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Status
          </div>
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            style={{
              fontFamily: F.ui, fontSize: 11, fontWeight: 500,
              color: statusColor(task.status),
              background: task.status === 'completed' ? C.moss10 : task.status === 'in_progress' ? C.ember10 : C.bone10,
              padding: '8px 14px', borderRadius: 10,
              border: `1.5px solid ${statusColor(task.status)}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = task.status === 'completed' ? C.moss20 : task.status === 'in_progress' ? C.ember20 : C.bone20;
              e.currentTarget.style.borderColor = statusColor(task.status);
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = task.status === 'completed' ? C.moss10 : task.status === 'in_progress' ? C.ember10 : C.bone10;
              e.currentTarget.style.borderColor = `${statusColor(task.status)}`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {statusLabel(task.status)}
            <span style={{ fontSize: 10, opacity: 0.8, transition: 'transform 0.15s ease', transform: showStatusMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>

          {showStatusMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4,
              background: C.graphite, border: `1px solid ${C.border2}`,
              borderRadius: 8, padding: '6px 0', minWidth: 130,
              zIndex: 10, boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
            }}>
              {['pending', 'in_progress', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    fontFamily: F.ui, fontSize: 12, color: C.bone,
                    background: task.status === status ? C.ember10 : 'transparent',
                    border: 'none', padding: '8px 12px',
                    cursor: 'pointer', transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (task.status !== status) e.currentTarget.style.background = C.bone10;
                  }}
                  onMouseLeave={(e) => {
                    if (task.status !== status) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {statusLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 28px' }}>
        {/* Warning banner */}
        {behind && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: C.ember10, border: `1px solid ${C.ember20}`,
            borderRadius: 10, padding: '12px 18px', marginBottom: 24,
          }}>
            <span style={{ color: C.ember, fontSize: 18, flexShrink: 0 }}>⚠</span>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: C.ember, marginBottom: 2 }}>
                Behind milestone
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: C.ember, opacity: 0.8 }}>
                Progress is below target with the deadline approaching.
              </div>
            </div>
          </div>
        )}

        {/* Ring + meta */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr',
          gap: 28, alignItems: 'center',
          background: C.graphite, border: `1px solid ${C.border}`,
          borderRadius: 14, padding: '28px 28px', marginBottom: 20,
        }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <RingProgress pct={pct} size={96} stroke={7} color={ringColor} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: F.mono, fontSize: 17, fontWeight: 500, color: ringColor, lineHeight: 1 }}>
                {pct}%
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 9, color: C.bone40, marginTop: 2 }}>done</div>
            </div>
          </div>

          <div>
            <h2 style={{
              fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
              fontSize: 24, color: C.bone, letterSpacing: '-0.03em', marginBottom: 8,
            }}>
              {task.title}
            </h2>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 2 }}>Status</div>
                <div style={{
                  fontFamily: F.ui, fontSize: 12, color: statusColor(task.status),
                  fontWeight: 500, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6,
                  background: task.status === 'completed' ? C.moss10 : task.status === 'in_progress' ? C.ember10 : C.bone10,
                  display: 'inline-block', transition: 'all 0.15s ease',
                }} onClick={() => setShowStatusMenu(!showStatusMenu)}>
                  {statusLabel(task.status)} ▼
                </div>
              </div>
              <MetaItem label="Deadline" value={formatDeadline(task.deadline)} />
              <MetaItem label="Estimated" value={`${task.estimatedHours}h`} />
              <MetaItem label="Output" value={task.output || '—'} />
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <MetaItem label="Started" value={task.startedAt ? formatTime(task.startedAt) : '—'} />
              <MetaItem label="Time Taken" value={formatDuration(timeTakenMinutes)} />
              <MetaItem label="Completed" value={task.completedAt ? formatTime(task.completedAt) : '—'} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10, marginBottom: 20,
        }}>
          <StatCard label="Focus time" value={focused > 0 ? `${Math.round(focused)}m` : '—'} color={C.moss} />
          <StatCard label="Distracted" value={distracted > 0 ? `${Math.round(distracted)}m` : '—'} color={C.ember} />
          <StatCard label="Focus ratio" value={`${Math.round(focusRatio)}%`} color={C.bone} />
          <StatCard label="Confidence" value={task.confidence ? `${Math.round(task.confidence * 100)}%` : '—'} color={C.bone40} />
        </div>

        {/* Session activity bars */}
        {sessionTotal > 0 && (
          <div style={{
            background: C.graphite, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '18px 20px', marginBottom: 20,
          }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone20, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Session activity
            </div>
            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 1 }}>
              <div style={{ flex: focused, background: C.moss, transition: 'flex 0.5s ease' }} />
              <div style={{ flex: distracted, background: C.ember, transition: 'flex 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
              <LegendItem color={C.moss} label={`Focused ${Math.round(focused)}m`} />
              <LegendItem color={C.ember} label={`Distracted ${Math.round(distracted)}m`} />
            </div>
          </div>
        )}

        {/* Milestones */}
        {task.milestones && task.milestones.length > 0 && (
          <div style={{
            background: C.graphite, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '18px 20px', marginBottom: 20,
          }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone20, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Milestones
            </div>

            {/* Milestone progress track */}
            <div style={{ position: 'relative', height: 4, background: C.border2, borderRadius: 2, marginBottom: 20 }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${Math.min(pct, 100)}%`,
                background: `linear-gradient(90deg, ${C.ember}, ${C.moss})`,
                borderRadius: 2, transition: 'width 0.6s ease',
              }} />
              {task.milestones.map(ms => {
                const msPct = ms.ratio * 100;
                const reached = pct >= msPct;
                return (
                  <div key={ms.n} style={{
                    position: 'absolute',
                    left: `${msPct}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 12, height: 12, borderRadius: '50%',
                    background: reached ? C.ember : C.ink,
                    border: `2px solid ${reached ? C.ember : C.border2}`,
                    boxShadow: reached ? `0 0 0 3px ${C.ember20}` : 'none',
                    transition: 'all 0.4s ease', zIndex: 1,
                  }} />
                );
              })}
            </div>

            {/* Milestone list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {task.milestones.map((ms, idx) => {
                const reached = pct >= ms.ratio * 100;
                const isExpanded = expandedMs === idx;
                return (
                  <div key={ms.n}>
                    <div
                      onClick={() => setExpandedMs(isExpanded ? null : idx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        opacity: reached ? 1 : 0.5,
                        cursor: 'pointer',
                        padding: '8px 0',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = reached ? '1' : '0.5'}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `1.5px solid ${reached ? C.moss : C.border2}`,
                        background: reached ? C.moss : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {reached ? (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L4 7L9 1" stroke={C.bone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span style={{ fontFamily: F.mono, fontSize: 9, color: C.bone40 }}>{ms.n}</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 13, color: C.bone }}>{ms.label}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40, marginTop: 1 }}>
                          @ {Math.round(ms.ratio * 100)}% · {ms.at}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: C.bone40 }}>{isExpanded ? '▼' : '▶'}</div>
                    </div>

                    {isExpanded && (
                      <div style={{
                        background: C.graphite, borderRadius: 8, padding: '12px 16px',
                        marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10,
                      }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button
                            onClick={() => updateMilestone(idx, 'start')}
                            style={{
                              fontFamily: F.ui, fontSize: 11, fontWeight: 500,
                              color: ms.startedAt ? C.moss : C.bone,
                              background: ms.startedAt ? C.moss10 : C.ember10,
                              border: `1px solid ${ms.startedAt ? C.moss20 : C.ember20}`,
                              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                            }}
                          >
                            {ms.startedAt ? '✓ Started' : 'Start'}
                          </button>
                          <button
                            onClick={() => updateMilestone(idx, 'complete')}
                            style={{
                              fontFamily: F.ui, fontSize: 11, fontWeight: 500,
                              color: ms.completedAt ? C.moss : C.bone,
                              background: ms.completedAt ? C.moss10 : C.bone10,
                              border: `1px solid ${ms.completedAt ? C.moss20 : C.border2}`,
                              padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                            }}
                          >
                            {ms.completedAt ? '✓ Done' : 'Done'}
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: 20 }}>
                          <div>
                            <div style={{ fontFamily: F.ui, fontSize: 9, color: C.bone40, marginBottom: 2 }}>Started</div>
                            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.bone }}>{ms.startedAt ? formatTime(ms.startedAt) : '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontFamily: F.ui, fontSize: 9, color: C.bone40, marginBottom: 2 }}>Completed</div>
                            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.bone }}>{ms.completedAt ? formatTime(ms.completedAt) : '—'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Risk factors */}
        {task.riskFactors && task.riskFactors.length > 0 && (
          <div style={{
            background: C.ember10, border: `1px solid ${C.ember20}`,
            borderRadius: 12, padding: '18px 20px',
          }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Risk factors
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {task.riskFactors.map((r, i) => (
                <li key={i} style={{
                  fontFamily: F.ui, fontSize: 13, color: C.bone,
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <span style={{ color: C.ember, flexShrink: 0, marginTop: 2 }}>·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================
function MetaItem({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: F.mono, fontSize: 12, color: C.bone }}>{value}</div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: C.graphite, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '12px 16px',
    }}>
      <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone20, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 500, color: color || C.bone }}>
        {value}
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>{label}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: C.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <div style={{
        width: 22, height: 22,
        border: `2px solid rgba(232,107,58,0.2)`, borderTopColor: C.ember,
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontFamily: F.ui, fontSize: 13, color: C.bone40 }}>Loading...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorScreen({ error, onBack }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.ink,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{ fontFamily: F.title, fontStyle: 'italic', fontSize: 20, color: C.ember }}>
        Task not found
      </div>
      <div style={{ fontFamily: F.mono, fontSize: 12, color: C.bone40 }}>{error}</div>
      <button onClick={onBack} style={{
        fontFamily: F.ui, fontSize: 13, fontWeight: 500,
        color: C.bone, background: C.ember,
        border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
      }}>← Back to Dashboard</button>
    </div>
  );
}
