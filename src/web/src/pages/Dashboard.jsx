import React, { useState, useEffect, useCallback, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import MultiStageForm from '../components/MultiStageForm';
import { SearchFilter, StatusFilter } from '../components/SearchFilter';
import { getUserFriendlyErrorMessage } from '../utils/errorMessages';

// =============================================================================
// Design tokens — dark theme (screens.jsx spec)
// Background: #0E0E0C (Ink)  Surface: #1C1C19 (Graphite)
// Text: #F2F0EB (Bone)  Accent: #E86B3A (Ember)  Success: #6B8E5A (Moss)
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
// Utility helpers
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
  const map = { pending: 'Pending', in_progress: 'In Progress', completed: 'Done', deleted: 'Deleted' };
  return map[status] || status;
}

function statusColor(status) {
  if (status === 'completed') return C.moss;
  if (status === 'in_progress') return C.ember;
  if (status === 'deleted') return C.bone40;
  return C.bone40;
}

function getDayLabel() {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
}

// =============================================================================
// RingProgress — SVG circular progress (dark-theme, screens.jsx spec)
// =============================================================================
function RingProgress({ pct = 0, size = 64, stroke = 5, color = C.ember, bg = C.border2 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
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
// Sidebar
// =============================================================================
function Sidebar({ tasks, selectedTask, onSelectTask, activeView, onViewChange }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '◉' },
    { id: 'all', label: 'All tasks', icon: '≡' },
    { id: 'archive', label: 'Completed', icon: '✓' },
    { id: 'deleted', label: 'Deleted', icon: '🗑' },
  ];

  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const deleted = tasks.filter(t => t.status === 'deleted').length;

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: C.graphite,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logomark — ember square with inner ring */}
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: C.ember,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.7)`, borderRadius: 3 }} />
          </div>
          <div>
            <div style={{ fontFamily: F.title, fontStyle: 'italic', fontWeight: 300, fontSize: 16, color: C.bone, letterSpacing: '-0.02em' }}>
              focus.
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 7,
              background: activeView === item.id ? C.ember10 : 'transparent',
              border: `1px solid ${activeView === item.id ? 'rgba(232,107,58,0.25)' : 'transparent'}`,
              color: activeView === item.id ? C.ember : C.bone40,
              fontFamily: F.ui, fontSize: 13, fontWeight: activeView === item.id ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.15s ease',
              marginBottom: 2, textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 11, lineHeight: 1, width: 14, textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {item.id === 'today' && tasks.length > 0 && (
              <span style={{
                marginLeft: 'auto', fontFamily: F.mono, fontSize: 10,
                background: C.bone10, color: C.bone40,
                padding: '1px 6px', borderRadius: 8,
              }}>{tasks.length}</span>
            )}
          </button>
        ))}

      </nav>

      {/* Agent status */}
      <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: C.moss,
            boxShadow: `0 0 0 3px ${C.moss10}`,
          }} />
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>Agent active</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: F.ui, fontSize: 11, color: C.bone40 }}>{label}</span>
      <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 500, color }}>{value}</span>
    </div>
  );
}

// =============================================================================
// Quotes — rotate every 2 hours, fetched from Claude API
// =============================================================================
async function getInspirationalQuote() {
  const cacheKey = 'projectFocusQuote';
  const cacheTTL = 3 * 60 * 60 * 1000; // 3 hours
  const defaultQuote = { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" };

  // Skip update during sleep hours (1am - 7am)
  const hour = new Date().getHours();
  const isSleepTime = hour >= 1 && hour < 7;

  try {
    const cached = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheKey + '_time');

    // If cache is fresh, return it
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < cacheTTL) {
      return JSON.parse(cached);
    }

    // Don't fetch during sleep hours, use cached instead
    if (isSleepTime) {
      return cached ? JSON.parse(cached) : defaultQuote;
    }

    // Fetch new quote from API
    const res = await fetch('/api/quote', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      const quoteData = {
        quote: data.quote || defaultQuote.quote,
        author: data.author || defaultQuote.author
      };
      localStorage.setItem(cacheKey, JSON.stringify(quoteData));
      localStorage.setItem(cacheKey + '_time', Date.now().toString());
      return quoteData;
    }
  } catch (err) {
    console.error('Failed to fetch quote:', err);
  }

  // Fallback to cached or default
  const cached = localStorage.getItem(cacheKey);
  return cached ? JSON.parse(cached) : defaultQuote;
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// =============================================================================
// UserNamePrompt — modal to capture name on first visit
// =============================================================================
function UserNamePrompt({ onSave }) {
  const [name, setName] = useState('');
  const [visible, setVisible] = useState(true);

  function handleSave() {
    const trimmed = name.trim();
    const finalName = trimmed || 'there';
    localStorage.setItem('projectFocusUserName', finalName);
    setVisible(false);
    onSave(finalName);
  }

  function handleSkip() {
    localStorage.setItem('projectFocusUserName', 'there');
    setVisible(false);
    onSave('there');
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(14,14,12,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: C.graphite,
        border: `1px solid ${C.border2}`,
        borderRadius: 16,
        padding: '40px 44px',
        width: 420,
        maxWidth: '90vw',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
          fontSize: 28, color: C.bone, letterSpacing: '-0.03em',
          lineHeight: 1.2, marginBottom: 10,
        }}>
          Welcome to focus.
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 13, color: C.bone40, marginBottom: 28, lineHeight: 1.5 }}>
          What should we call you? We'll personalize your experience.
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Your first name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          style={{
            width: '100%', fontFamily: F.ui, fontSize: 15,
            color: C.bone, background: C.surface,
            border: `1px solid ${C.border2}`, borderRadius: 8,
            padding: '12px 16px', outline: 'none',
            marginBottom: 16, boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = C.ember; }}
          onBlur={(e) => { e.target.style.borderColor = C.border2; }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1, fontFamily: F.ui, fontSize: 13, fontWeight: 600,
              color: C.bone, background: C.ember,
              border: 'none', borderRadius: 8, padding: '11px 0',
              cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Let's go
          </button>
          <button
            onClick={handleSkip}
            style={{
              fontFamily: F.ui, fontSize: 13, color: C.bone40,
              background: 'transparent', border: `1px solid ${C.border2}`,
              borderRadius: 8, padding: '11px 18px', cursor: 'pointer',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ThisWeekStats
// =============================================================================
function ThisWeekStats({ tasks }) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Estimate weekly focus from completed tasks in the last 7 days
  const recentCompleted = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    const updated = t.updatedAt ? new Date(t.updatedAt) : null;
    return updated && updated >= weekAgo;
  });

  const totalMinutes = recentCompleted.reduce((sum, t) => {
    return sum + (t.estimatedHours || 0) * 60;
  }, 0);

  const totalHours = totalMinutes / 60;
  const displayHours = totalHours >= 1 ? totalHours.toFixed(1) : Math.round(totalMinutes);
  const displayUnit = totalHours >= 1 ? 'hours' : 'minutes';

  let motivationalMsg;
  if (totalHours === 0) {
    motivationalMsg = "Your week starts with a single focused task. Begin now.";
  } else if (totalHours < 2) {
    motivationalMsg = "You're warming up. Every minute of focus builds momentum.";
  } else if (totalHours < 5) {
    motivationalMsg = "Solid start. Keep the momentum going through the week.";
  } else if (totalHours < 10) {
    motivationalMsg = "Great week of focus. You're building something real.";
  } else {
    motivationalMsg = "Exceptional focus this week. You're in elite territory.";
  }

  const tasksCompleted = recentCompleted.length;
  const allInProgress = tasks.filter(t => t.status === 'in_progress').length;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayIdx = now.getDay();

  return (
    <div style={{
      background: C.graphite,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
          fontSize: 17, color: C.bone, letterSpacing: '-0.02em',
        }}>
          This week's focus
        </div>
      </div>

      <div style={{ padding: '20px 22px' }}>
        {/* Big stat */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{
            fontFamily: F.mono, fontSize: 40, fontWeight: 600,
            color: totalHours >= 10 ? C.moss : totalHours >= 5 ? C.ember : C.bone,
            lineHeight: 1, letterSpacing: '-0.04em',
          }}>
            {displayHours}
          </span>
          <span style={{ fontFamily: F.ui, fontSize: 14, color: C.bone40 }}>
            {displayUnit} this week
          </span>
        </div>

        <div style={{
          fontFamily: F.ui, fontSize: 12, color: C.bone40,
          lineHeight: 1.5, marginBottom: 20,
        }}>
          {motivationalMsg}
        </div>

        {/* Week day indicators */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {weekDays.map((day, i) => {
            const isPast = i <= todayIdx;
            const isToday = i === todayIdx;
            return (
              <div key={day} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  fontFamily: F.mono, fontSize: 9, color: isToday ? C.ember : C.bone40,
                  marginBottom: 5, fontWeight: isToday ? 600 : 400,
                }}>
                  {day}
                </div>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: isToday ? C.ember : isPast ? C.moss20 : C.border,
                  border: isToday ? 'none' : 'none',
                }} />
              </div>
            );
          })}
        </div>

        {/* Mini stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{
            background: C.surface, borderRadius: 8,
            border: `1px solid ${C.border2}`, padding: '10px 12px',
          }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 4 }}>Completed</div>
            <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 600, color: C.moss }}>
              {tasksCompleted}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40 }}>
              {tasksCompleted === 1 ? 'task' : 'tasks'}
            </div>
          </div>
          <div style={{
            background: C.surface, borderRadius: 8,
            border: `1px solid ${C.border2}`, padding: '10px 12px',
          }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 4 }}>Active</div>
            <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 600, color: C.ember }}>
              {allInProgress}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40 }}>
              {allInProgress === 1 ? 'task' : 'tasks'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Distractions Tracker — shows agent-detected distractions for today
// =============================================================================
function DistractionsTracker() {
  const [distractions, setDistractions] = useState({});
  const [loading, setLoading] = useState(true);

  const [trackedApps, setTrackedApps] = useState(() => {
    const saved = localStorage.getItem('trackedApps');
    return saved ? JSON.parse(saved) : ['YouTube', 'Reddit', 'Netflix', 'Instagram', 'TikTok', 'Discord', 'Slack'];
  });
  const [trackedWebsites, setTrackedWebsites] = useState(() => {
    const saved = localStorage.getItem('trackedWebsites');
    return saved ? JSON.parse(saved) : ['youtube.com', 'reddit.com', 'twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'netflix.com', 'twitch.tv'];
  });

  const [newApp, setNewApp] = useState('');
  const [newWebsite, setNewWebsite] = useState('');

  useEffect(() => {
    fetchDistractions();
    const id = setInterval(fetchDistractions, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem('trackedApps', JSON.stringify(trackedApps));
  }, [trackedApps]);

  useEffect(() => {
    localStorage.setItem('trackedWebsites', JSON.stringify(trackedWebsites));
  }, [trackedWebsites]);

  const fetchDistractions = async () => {
    try {
      const res = await fetch('/api/distractions/today');
      if (res.ok) {
        const data = await res.json();
        setDistractions(data.distractions || {});
      }
    } catch (err) {
      console.error('Failed to fetch distractions:', err);
    } finally {
      setLoading(false);
    }
  };

  const addApp = () => {
    if (newApp.trim() && !trackedApps.includes(newApp.trim())) {
      setTrackedApps([...trackedApps, newApp.trim()]);
      setNewApp('');
    }
  };

  const removeApp = (app) => {
    setTrackedApps(trackedApps.filter(a => a !== app));
  };

  const addWebsite = () => {
    if (newWebsite.trim() && !trackedWebsites.includes(newWebsite.trim())) {
      setTrackedWebsites([...trackedWebsites, newWebsite.trim()]);
      setNewWebsite('');
    }
  };

  const removeWebsite = (site) => {
    setTrackedWebsites(trackedWebsites.filter(s => s !== site));
  };

  // Sort by duration, descending
  const sorted = Object.entries(distractions)
    .sort(([, a], [, b]) => b - a);

  const totalMinutes = Object.values(distractions).reduce((sum, m) => sum + m, 0);

  const allTracked = [...trackedApps, ...trackedWebsites];
  const filteredDistractions = Object.fromEntries(
    Object.entries(distractions).filter(([app]) => allTracked.includes(app))
  );
  const filteredSorted = Object.entries(filteredDistractions).sort(([, a], [, b]) => b - a);
  const filteredTotal = Object.values(filteredDistractions).reduce((sum, m) => sum + m, 0);

  return (
    <div>
      {/* Settings Box */}
      <div style={{
        background: C.graphite,
        border: `1px solid ${C.border2}`,
        borderRadius: 8,
        padding: '16px',
        marginBottom: 20,
      }}>
        <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: C.bone, marginBottom: 14 }}>
          Distraction Settings
        </div>

        {/* Two column layout for Apps and Websites */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Apps Section */}
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 500, color: C.bone40, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Applications
            </div>

            {/* Add app input */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                type="text"
                value={newApp}
                onChange={(e) => setNewApp(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addApp()}
                placeholder="Add app..."
                style={{
                  flex: 1,
                  fontFamily: F.ui,
                  fontSize: 10,
                  padding: '7px 10px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  color: C.bone,
                  outline: 'none',
                }}
              />
              <button
                onClick={addApp}
                style={{
                  fontFamily: F.ui,
                  fontSize: 10,
                  padding: '7px 10px',
                  background: C.ember,
                  border: 'none',
                  borderRadius: 4,
                  color: C.bone,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                +
              </button>
            </div>

            {/* Tracked apps list */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {trackedApps.map(app => (
                <div
                  key={app}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 9px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontFamily: F.ui,
                    fontSize: 9,
                    color: C.bone,
                  }}
                >
                  {app}
                  <button
                    onClick={() => removeApp(app)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.bone40,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 11,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Websites Section */}
          <div>
            <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 500, color: C.bone40, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Websites
            </div>

            {/* Add website input */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                type="text"
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addWebsite()}
                placeholder="Add website..."
                style={{
                  flex: 1,
                  fontFamily: F.ui,
                  fontSize: 10,
                  padding: '7px 10px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  color: C.bone,
                  outline: 'none',
                }}
              />
              <button
                onClick={addWebsite}
                style={{
                  fontFamily: F.ui,
                  fontSize: 10,
                  padding: '7px 10px',
                  background: C.ember,
                  border: 'none',
                  borderRadius: 4,
                  color: C.bone,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                +
              </button>
            </div>

            {/* Tracked websites list */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {trackedWebsites.map(site => (
                <div
                  key={site}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 9px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontFamily: F.ui,
                    fontSize: 9,
                    color: C.bone,
                  }}
                >
                  {site}
                  <button
                    onClick={() => removeWebsite(site)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.bone40,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 11,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, margin: '0 0 18px', lineHeight: 1.5 }}>
        Focus automatically detects distractions. This shows what you were distracted by today and how long.
      </p>

      {/* Distraction list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: C.bone40, fontFamily: F.ui, fontSize: 12 }}>
          Loading...
        </div>
      ) : filteredSorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: C.bone40, fontFamily: F.ui, fontSize: 12 }}>
          No distractions detected yet today. Great focus!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredSorted.map(([app, minutes]) => {
            const pct = Math.round((minutes / filteredTotal) * 100);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

            return (
              <div key={app} style={{
                background: C.surface,
                border: `1px solid ${C.border2}`,
                borderRadius: 8,
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
                    {app}
                  </span>
                  <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 600, color: C.ember }}>
                    {timeStr}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: C.border2, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: C.ember,
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{ marginTop: 4, fontFamily: F.mono, fontSize: 9, color: C.bone40, textAlign: 'right' }}>
                  {pct}% of total
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          {filteredTotal > 0 && (
            <div style={{
              background: C.graphite,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginTop: 8,
            }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 6 }}>
                Total distraction time
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 600, color: C.ember }}>
                {Math.floor(filteredTotal / 60)}h {filteredTotal % 60}m
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// =============================================================================
// NextMilestoneInline — compact version used inside Today's progress card
// =============================================================================
function NextMilestoneInline({ tasks }) {
  const task = tasks.find(t => t.status === 'in_progress');
  if (!task) return null;

  const milestones = task.milestones || [];
  const pct = Math.round(task.progress || 0);
  const nextMs = milestones.find(ms => ms.ratio * 100 > pct);
  const targetPct = nextMs ? Math.round(nextMs.ratio * 100) : 100;
  const msPct = targetPct > 0 ? Math.min((pct / targetPct) * 100, 100) : 100;

  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        Next milestone
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 11, color: C.bone40, marginBottom: 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.title}
      </div>
      <div style={{
        fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
        fontSize: 15, color: C.bone, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1.3,
      }}>
        {nextMs ? nextMs.label : 'All milestones reached'}
      </div>
      {nextMs && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>{pct}% → {targetPct}%</span>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: C.ember, fontWeight: 600 }}>{Math.round(msPct)}%</span>
          </div>
          <div style={{ height: 5, background: C.border2, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${msPct}%`,
              background: `linear-gradient(90deg, ${C.ember}, ${C.moss})`,
              borderRadius: 3, transition: 'width 0.6s ease',
            }} />
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// NextMilestone
// =============================================================================
function NextMilestone({ tasks }) {
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  if (inProgressTasks.length === 0) return null;

  const task = inProgressTasks[0];
  const milestones = task.milestones || [];
  const pct = Math.round(task.progress || 0);

  // Find next uncompleted milestone
  const nextMs = milestones.find(ms => ms.ratio * 100 > pct);
  const targetPct = nextMs ? Math.round(nextMs.ratio * 100) : 100;
  const msPct = targetPct > 0 ? Math.min((pct / targetPct) * 100, 100) : 100;

  return (
    <div style={{
      background: C.graphite,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    }}>
      <div style={{
        fontFamily: F.title,
        fontStyle: 'italic',
        fontSize: 17,
        color: C.bone,
        letterSpacing: '-0.02em',
        marginBottom: 16,
        padding: '20px 24px 0 24px',
      }}>
        Next milestone
      </div>

      <div style={{ padding: '0 24px 20px 24px', flex: 1 }}>
        <div style={{
          fontFamily: F.ui, fontSize: 12, color: C.bone40, marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </div>

        {nextMs ? (
          <>
            <div style={{
              fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
              fontSize: 18, color: C.bone, letterSpacing: '-0.02em',
              marginBottom: 16, lineHeight: 1.3,
            }}>
              {nextMs.label}
            </div>

            {/* Progress toward this milestone */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>
                  {pct}% → {targetPct}%
                </span>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.ember, fontWeight: 600 }}>
                  {Math.round(msPct)}% toward milestone
                </span>
              </div>
              <div style={{ height: 6, background: C.border2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${msPct}%`,
                  background: `linear-gradient(90deg, ${C.ember}, ${C.moss})`,
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            <div style={{
              fontFamily: F.ui, fontSize: 11, color: C.bone40, lineHeight: 1.5,
              fontStyle: 'italic',
            }}>
              {Math.round(msPct)}% toward {nextMs.label} — keep going.
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
              fontSize: 18, color: C.moss, letterSpacing: '-0.02em',
              marginBottom: 16,
            }}>
              All milestones cleared!
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>Overall</span>
                <span style={{ fontFamily: F.mono, fontSize: 10, color: C.moss, fontWeight: 600 }}>
                  {pct}%
                </span>
              </div>
              <div style={{ height: 6, background: C.border2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: C.moss,
                  borderRadius: 3,
                }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// QuickStart
// =============================================================================
function QuickStart({ onNewTask }) {
  return (
    <div style={{
      background: C.graphite,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '24px 28px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
          fontSize: 17, color: C.bone, letterSpacing: '-0.02em', marginBottom: 4,
        }}>
          Ready for more?
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40 }}>
          Start something new and make it count.
        </div>
      </div>
      <button
        onClick={onNewTask}
        style={{
          fontFamily: F.ui, fontSize: 13, fontWeight: 600,
          color: C.bone, background: C.ember,
          border: 'none', borderRadius: 8,
          padding: '10px 22px', cursor: 'pointer',
          transition: 'opacity 0.2s',
          flexShrink: 0,
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        + New Task
      </button>
    </div>
  );
}

// =============================================================================
// DashboardContent — all sections below Hero when activeView === 'dashboard'
// =============================================================================
function DashboardContent({ tasks, onNewTask }) {
  const hasInProgress = tasks.some(t => t.status === 'in_progress');

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '28px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-section {
          animation: fadeInUp 0.35s ease both;
        }
        .dash-section:nth-child(1) { animation-delay: 0.05s; }
        .dash-section:nth-child(2) { animation-delay: 0.12s; }
        .dash-section:nth-child(3) { animation-delay: 0.19s; }
        .dash-section:nth-child(4) { animation-delay: 0.26s; }
        .dash-section:nth-child(5) { animation-delay: 0.33s; }
      `}</style>

      {/* Two-column layout: Today's progress (left) and Next Milestone (right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: hasInProgress ? '1fr 1fr' : '1fr',
        gap: 16,
        alignItems: 'stretch',
      }}>
        {/* Today's progress - Left Box */}
        <div className="dash-section" style={{
          background: C.graphite,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '20px 24px',
        }}>
          <div style={{
            fontFamily: F.title,
            fontStyle: 'italic',
            fontSize: 17,
            color: C.bone,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}>
            Today's progress
          </div>

          {/* Completed + In Progress Stats (stacked) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 4 }}>
                Completed
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 500, color: C.moss }}>
                {tasks.filter(t => t.status === 'completed' && new Date(t.updatedAt || 0).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 4 }}>
                In progress
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 500, color: C.ember }}>
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
            </div>
          </div>
        </div>

        {/* Next Milestone - Right Box (independent card) */}
        {hasInProgress && (
          <div className="dash-section" style={{ display: 'flex', flexDirection: 'column' }}>
            <NextMilestone tasks={tasks} />
          </div>
        )}
      </div>

      {/* Tracking distractions */}
      <div className="dash-section" style={{
        background: C.graphite,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '20px 24px',
      }}>
        <div style={{
          fontFamily: F.title,
          fontStyle: 'italic',
          fontSize: 17,
          color: C.bone,
          letterSpacing: '-0.02em',
          marginBottom: 16,
        }}>
          Track distractions
        </div>
        <DistractionsTracker />
      </div>

      {/* This week stats */}
      <div className="dash-section">
        <ThisWeekStats tasks={tasks} />
      </div>

      {/* Quick Start */}
      <div className="dash-section">
        <QuickStart onNewTask={onNewTask} />
      </div>
    </div>
  );
}

// =============================================================================
// Hero — greeting + live stats dashboard header
// =============================================================================
function Hero({ tasks, sessionTotals, userName }) {
  const [time, setTime] = useState(new Date());
  const [quote, setQuote] = useState("The only way to do great work is to love what you do.");
  const [author, setAuthor] = useState("Steve Jobs");

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getInspirationalQuote().then(data => {
      const q = data?.quote || "The only way to do great work is to love what you do.";
      const a = data?.author || "Steve Jobs";
      setQuote(q);
      setAuthor(a);
    }).catch(err => {
      console.error('Failed to load quote:', err);
    });
  }, []);

  const hour = time.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const greeting = `Hey, ${userName}! Good ${timeOfDay}.`;

  const pending = tasks.filter(t => t.status !== 'completed').length;
  const subLine = pending === 0
    ? 'All clear. Take a breath.'
    : pending === 1
    ? "One task left. Finish strong."
    : `${pending} tasks ahead. Stay focused.`;

  const focusMin = sessionTotals?.focusedMinutes || 0;
  const distractMin = sessionTotals?.distractedMinutes || 0;
  const total = focusMin + distractMin;
  const focusRate = total > 0 ? Math.round((focusMin / total) * 100) : null;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;

  const cards = [
    {
      label: 'Focus time',
      value: focusMin > 0 ? `${Math.round(focusMin)}m` : '—',
      sub: 'this session',
      color: C.moss,
      icon: '◎',
    },
    {
      label: 'Focus rate',
      value: focusRate !== null ? `${focusRate}%` : '—',
      sub: focusRate !== null ? (focusRate >= 70 ? 'great pace' : 'keep going') : 'no data yet',
      color: focusRate === null ? C.bone40 : focusRate >= 70 ? C.moss : C.ember,
      icon: '↑',
    },
    {
      label: 'In progress',
      value: String(inProgress),
      sub: inProgress === 1 ? 'task active' : 'tasks active',
      color: inProgress > 0 ? C.ember : C.bone40,
      icon: '⟳',
    },
    {
      label: 'Completed',
      value: String(completed),
      sub: completed === 1 ? 'task done' : 'tasks done',
      color: completed > 0 ? C.moss : C.bone40,
      icon: '✓',
    },
  ];

  return (
    <div style={{
      flexShrink: 0,
      background: C.graphite,
      borderBottom: `1px solid ${C.border}`,
      padding: '32px 32px 24px',
    }}>
      {/* Greeting row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{
            fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
            fontSize: 36, color: C.bone, letterSpacing: '-0.03em', lineHeight: 1.15,
            marginBottom: 8,
          }}>
            {greeting}
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 13, color: C.bone40, letterSpacing: '-0.01em' }}>
            {subLine}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 32 }}>
          <div style={{
            fontFamily: F.mono, fontSize: 32, fontWeight: 500,
            color: C.bone, letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40, marginTop: 6 }}>
            {getDayLabel()}
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            background: C.surface,
            border: `1px solid ${C.border2}`,
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: F.ui, fontSize: 10, color: C.bone20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {c.label}
              </span>
              <span style={{ fontSize: 11, color: c.color, opacity: 0.8 }}>{c.icon}</span>
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 22, fontWeight: 500, color: c.color, lineHeight: 1, marginBottom: 4 }}>
              {c.value}
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone20 }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Inspiration Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.ember} 0%, rgba(232,107,58,0.6) 100%)`,
        borderRadius: 12,
        padding: '24px 28px',
        marginTop: 4,
      }}>
        <div style={{
          fontFamily: F.title,
          fontStyle: 'italic',
          fontSize: 24,
          fontWeight: 300,
          color: C.bone,
          lineHeight: 1.4,
          letterSpacing: '-0.02em',
        }}>
          {author && author !== 'Unknown' ? `"${quote}" - ${author}` : `"${quote}"`}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TaskRow — compact row in task list
// =============================================================================
function TaskRow({ task, isActive, onSelect, onOpenDetail, onRestore, onReorder, checked, onCheck, draggedId, setDraggedId }) {
  const pct = Math.round(task.progress || 0);
  const behind = task.status !== 'completed' && pct < 30 && task.deadline && new Date(task.deadline) < new Date(Date.now() + 2 * 3600000);

  return (
    <div
      draggable
      onDragStart={(e) => {
        console.log('=== DRAG START ===');
        console.log('Dragging task:', task.id, task.title);
        setDraggedId?.(task.id);
        e.dataTransfer.effectAllowed = 'move';
        console.log('draggedId set to:', task.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('=== DROP EVENT ===');
        console.log('Drop on task:', task.id, task.title);
        console.log('Dragged ID:', draggedId);
        console.log('onReorder available:', !!onReorder);
        if (draggedId && draggedId !== task.id && onReorder) {
          console.log('Calling onReorder...');
          onReorder(draggedId, task.id);
        } else {
          if (!draggedId) console.log('No draggedId');
          if (draggedId === task.id) console.log('Same task');
          if (!onReorder) console.log('onReorder not available');
        }
        setDraggedId?.(null);
      }}
      onDragEnd={() => setDraggedId?.(null)}
      onClick={() => onSelect(task)}
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 20px 1fr auto auto 120px auto 80px auto',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px',
        background: draggedId === task.id ? C.ember10 : isActive ? C.ember10 : 'transparent',
        borderLeft: `2px solid ${draggedId === task.id ? C.ember : isActive ? C.ember : 'transparent'}`,
        borderBottom: `1px solid ${C.border}`,
        cursor: 'grab',
        transition: 'all 0.15s ease',
        opacity: draggedId === task.id ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => { e.stopPropagation(); onCheck(e.target.checked); }}
        onClick={(e) => e.stopPropagation()}
        style={{ cursor: 'pointer', accentColor: C.ember }}
      />

      {/* Drag Handle */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          color: C.bone40,
          fontSize: 14,
          fontWeight: 600,
          userSelect: 'none',
        }}
        title="Drag to reorder"
      >
        ⋮⋮
      </div>

      {/* Title + sub */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
          fontSize: 15, color: C.bone,
          letterSpacing: '-0.02em', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {behind && <span style={{ marginRight: 6 }}>⚠️</span>}
          {task.title}
        </div>
        {task.milestones && task.milestones.length > 0 && (
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40, marginTop: 2 }}>
            {task.milestones.length} milestones
          </div>
        )}
      </div>

      {/* Due */}
      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40, whiteSpace: 'nowrap' }}>
        {formatDeadline(task.deadline)}
      </div>

      {/* Behind badge */}
      <div style={{ width: 60, textAlign: 'center' }}>
        {behind && (
          <span style={{
            fontFamily: F.mono, fontSize: 9,
            background: C.ember20, color: C.ember,
            padding: '2px 6px', borderRadius: 8,
          }}>behind</span>
        )}
      </div>

      {/* Progress bar + pct */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontFamily: F.mono, fontSize: 9, color: C.bone40 }}>{pct}%</span>
        </div>
        <div style={{ height: 2, background: C.border2, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(pct, 100)}%`,
            background: pct >= 100 ? C.moss : behind ? C.ember : `linear-gradient(90deg, ${C.ember}, ${C.moss})`,
            borderRadius: 1,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Elapsed (estimated hours) */}
      <div style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40, textAlign: 'right', whiteSpace: 'nowrap' }}>
        {task.estimatedHours}h est
      </div>

      {/* Status badge */}
      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontFamily: F.ui, fontSize: 10, fontWeight: 500,
          color: statusColor(task.status),
          background: task.status === 'completed' ? C.moss10 : task.status === 'in_progress' ? C.ember10 : C.bone10,
          padding: '2px 8px', borderRadius: 8,
        }}>
          {statusLabel(task.status)}
        </span>
      </div>

      {/* Action buttons */}
      {onOpenDetail && (
        <>
          {task.status === 'deleted' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRestore) onRestore(task.id);
              }}
              title="Restore this task"
              style={{
                background: 'none', border: `1px solid ${C.moss}`,
                borderRadius: 5, color: C.moss, cursor: 'pointer',
                fontSize: 11, padding: '2px 6px', lineHeight: 1,
                transition: 'color 0.15s',
                fontWeight: 500,
              }}
            >↻ Restore</button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetail(task.id); }}
              title="Open full detail"
              style={{
                background: 'none', border: `1px solid ${C.border2}`,
                borderRadius: 5, color: C.bone40, cursor: 'pointer',
                fontSize: 11, padding: '2px 6px', lineHeight: 1,
                transition: 'color 0.15s',
              }}
            >↗</button>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// AddTaskInput
// =============================================================================
function AddTaskInput({ onTaskAdded }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [parsed, setParsed] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || status === 'parsing') return;

    setStatus('parsing');
    setErrorMsg('');
    setParsed(null);

    try {
      const res = await fetch('/api/task/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, userId: 'default' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');

      setParsed(data.task);
      setStatus('success');
      setText('');
      setTimeout(() => {
        setStatus('idle');
        setParsed(null);
        onTaskAdded();
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  const isParsing = status === 'parsing';

  return (
    <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); if (status !== 'idle') setStatus('idle'); }}
          placeholder="+ Add task (e.g., finish Q1 report by 3pm)"
          disabled={isParsing}
          style={{
            flex: 1,
            fontFamily: F.ui, fontSize: 12,
            color: C.bone,
            background: C.bone10,
            border: `1px solid ${status === 'error' ? C.ember : status === 'success' ? C.moss : C.border2}`,
            borderRadius: 6, padding: '7px 12px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          type="submit"
          disabled={isParsing || !text.trim()}
          style={{
            fontFamily: F.ui, fontSize: 12, fontWeight: 500,
            color: C.bone, background: isParsing ? C.bone10 : C.ember,
            border: 'none', borderRadius: 6,
            padding: '7px 14px', cursor: isParsing ? 'not-allowed' : 'pointer',
            flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          {isParsing ? '...' : 'Add'}
        </button>
      </form>

      {isParsing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <div style={{
            width: 12, height: 12,
            border: `2px solid ${C.ember20}`, borderTopColor: C.ember,
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{ fontFamily: F.ui, fontSize: 11, color: C.bone40 }}>Parsing...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {status === 'success' && parsed && (
        <div style={{
          marginTop: 6, padding: '8px 10px',
          background: C.moss10, border: `1px solid rgba(107,142,90,0.2)`,
          borderRadius: 6,
        }}>
          <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: C.moss, marginBottom: 2 }}>Created</div>
          <div style={{ fontFamily: F.title, fontStyle: 'italic', fontSize: 13, color: C.bone }}>{parsed.title}</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40, marginTop: 2 }}>
            {parsed.estimatedHours}h · {parsed.milestones?.length || 0} milestones
          </div>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          marginTop: 6, padding: '6px 10px',
          background: C.ember10, border: `1px solid ${C.ember20}`,
          borderRadius: 6, fontFamily: F.ui, fontSize: 11, color: C.ember,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{errorMsg}</span>
          <button onClick={() => setStatus('idle')} style={{
            background: 'none', border: 'none', color: C.ember, cursor: 'pointer', fontSize: 14,
          }}>×</button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EmptyState
// =============================================================================
function EmptyState({ onRefresh }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', gap: 14,
    }}>
      <div style={{ fontSize: 32, opacity: 0.2, color: C.bone }}>◎</div>
      <p style={{ fontFamily: F.title, fontStyle: 'italic', fontSize: 18, color: C.bone, opacity: 0.6 }}>
        No tasks today
      </p>
      <p style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, textAlign: 'center', maxWidth: 260 }}>
        Use the input field above to add a task, or message the Telegram bot.
      </p>
      <button onClick={onRefresh} style={{
        fontFamily: F.ui, fontSize: 12, fontWeight: 500,
        color: C.ember, background: C.ember10,
        border: `1px solid ${C.ember20}`, borderRadius: 6,
        padding: '6px 16px', cursor: 'pointer',
      }}>Refresh</button>
    </div>
  );
}

// =============================================================================
// LoadingState
// =============================================================================
function LoadingState() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 48, gap: 10,
    }}>
      <div style={{
        width: 20, height: 20,
        border: `2px solid ${C.ember20}`, borderTopColor: C.ember,
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40 }}>Loading...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// =============================================================================
// DetailPanel — right panel showing selected task
// =============================================================================
function DetailPanel({ task, sessionTotals, onClose, onRefreshTask }) {
  const [editData, setEditData] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [saveError, setSaveError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Initialize editData when task is selected
  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title,
        deadline: task.deadline,
        estimatedHours: task.estimatedHours,
        output: task.output || '',
        milestones: task.milestones ? JSON.parse(JSON.stringify(task.milestones)) : [],
        progress: task.progress,
        status: task.status,
      });
      setSaveStatus('idle');
      setSaveError(null);
    }
  }, [task?.id]);

  // Debounced auto-save
  const autoSave = useCallback(async (dataToSave) => {
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const res = await fetch(`/api/task/${task.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      setSaveStatus('saved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      if (onRefreshTask) onRefreshTask();
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err.message);
    }
  }, [task?.id, onRefreshTask]);

  const triggerAutoSave = useCallback((newData) => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(newData);
    }, 800); // 800ms debounce
  }, [autoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (!task) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 12, padding: 40,
      }}>
        <div style={{ fontSize: 36, opacity: 0.12, color: C.bone }}>◎</div>
        <p style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, textAlign: 'center' }}>
          Select a task to view details
        </p>
      </div>
    );
  }

  const displayData = editData || task;

  const pct = Math.round(displayData.progress || 0);
  const focused = sessionTotals?.focusedMinutes || 0;
  const distracted = sessionTotals?.distractedMinutes || 0;

  const sessionBarTotal = focused + distracted;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header with save status */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone, display: 'flex', alignItems: 'center', gap: 8 }}>
          Task detail
          {saveStatus === 'saving' && (
            <span style={{ fontSize: 10, color: C.bone40 }}>Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ fontSize: 10, color: C.moss }}>✓ Saved</span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: 10, color: C.ember }} title={saveError}>✗ Error</span>
          )}
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: C.bone40,
          cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0,
        }}>×</button>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px' }}>
        {/* Title - always editable */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            value={displayData.title}
            onChange={(e) => {
              const newData = { ...displayData, title: e.target.value };
              setEditData(newData);
              triggerAutoSave(newData);
            }}
            style={{
              width: '100%', fontFamily: F.title, fontStyle: 'italic', fontWeight: 300,
              fontSize: 22, color: C.bone, lineHeight: 1.2, letterSpacing: '-0.03em',
              background: C.graphite, border: `2px solid ${C.border2}`,
              borderRadius: 6, padding: '10px 12px',
              outline: 'none', marginBottom: 12,
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = C.ember)}
            onBlur={(e) => (e.target.style.borderColor = `${C.border2}`)}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(() => {
            const deadlineOverdue = displayData.deadline && new Date(displayData.deadline) < new Date();
            const deadlineSoon = displayData.deadline && new Date(displayData.deadline) < new Date(Date.now() + 2 * 3600000);
            const deadlineColor = deadlineOverdue ? C.ember : deadlineSoon ? C.ember : C.bone40;
            return (
              <span style={{ fontFamily: F.mono, fontSize: 10, color: deadlineColor, fontWeight: deadlineOverdue ? 600 : 400 }}>
                {deadlineOverdue && '⚠️ '}Due {formatDeadline(displayData.deadline)}
              </span>
            );
          })()}
          {displayData.startedAt && (
            <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>
              Started {(() => {
                const d = new Date(displayData.startedAt);
                return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
              })()}
            </span>
          )}
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>
            Time: {(() => {
              const startTime = new Date(displayData.createdAt);
              const now = new Date();
              const diffMs = now - startTime;
              const hours = Math.floor(diffMs / 3600000);
              const mins = Math.floor((diffMs % 3600000) / 60000);
              return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            })()}
          </span>
        </div>

        {/* Status selector - always available */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Status
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
          {displayData.status === 'completed' ? (
            // Show "Completed" and "Reopen" buttons for completed tasks
            <>
              <button
                disabled
                style={{
                  fontFamily: F.ui,
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.bone,
                  background: C.moss,
                  border: `1px solid ${C.moss}`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'default',
                  transition: 'all 0.2s',
                }}
              >
                Completed
              </button>
              <button
                onClick={async () => {
                  const newData = { ...displayData, status: 'in_progress' };
                  setEditData(newData);
                  setSaveStatus('saving');
                  try {
                    const res = await fetch(`/api/task/${task.id}/update`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newData),
                    });
                    if (!res.ok) throw new Error('Failed to reopen task');
                    setSaveStatus('saved');
                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                    saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
                    if (onRefreshTask) onRefreshTask();
                  } catch (err) {
                    setSaveStatus('error');
                    setSaveError(err.message);
                  }
                }}
                style={{
                  fontFamily: F.ui,
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.bone40,
                  background: C.graphite,
                  border: `1px solid ${C.border2}`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Reopen
              </button>
            </>
          ) : (
            // Show regular 3 status buttons for non-completed tasks
            ['pending', 'in_progress', 'completed'].map((s) => (
              <button
                key={s}
                onClick={async () => {
                  const newData = { ...displayData, status: s };
                  setEditData(newData);
                  setSaveStatus('saving');
                  try {
                    const res = await fetch(`/api/task/${task.id}/update`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newData),
                    });
                    if (!res.ok) throw new Error('Failed to update status');
                    setSaveStatus('saved');
                    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                    saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
                    if (onRefreshTask) onRefreshTask();
                  } catch (err) {
                    setSaveStatus('error');
                    setSaveError(err.message);
                  }
                }}
                style={{
                  fontFamily: F.ui,
                  fontSize: 10,
                  fontWeight: displayData.status === s ? 600 : 500,
                  color: displayData.status === s ? C.bone : C.bone40,
                  background: displayData.status === s ? C.ember : C.graphite,
                  border: `1px solid ${displayData.status === s ? C.ember : C.border2}`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {s === 'pending' ? 'Pending' : s === 'in_progress' ? 'In Progress' : 'Completed'}
              </button>
            ))
          )}
          </div>
        </div>

      {/* Deadline and Estimated Hours - always editable */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, display: 'block', marginBottom: 4 }}>Deadline</label>
          <DatePicker
            selected={displayData.deadline ? new Date(displayData.deadline) : null}
            onChange={(date) => {
              const newData = { ...displayData, deadline: date ? date.toISOString() : '' };
              setEditData(newData);
              triggerAutoSave(newData);
            }}
            showTimeSelect
            timeIntervals={30}
            dateFormat="MMM d, yyyy h:mm aa"
            customInput={
              <input
                style={{
                  width: '100%', fontFamily: F.mono, fontSize: 11, color: C.bone,
                  background: C.graphite, border: `2px solid ${C.border2}`,
                  borderRadius: 4, padding: '6px 8px', outline: 'none', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              />
            }
            wrapperClassName="datepicker-wrapper"
          />
          <style>{`
            .datepicker-wrapper .react-datepicker__input-container input {
              width: 100%;
            }
            .datepicker-wrapper {
              font-family: ${F.ui} !important;
            }
            .datepicker-wrapper .react-datepicker-popper {
              background: ${C.surface} !important;
              border: 1px solid ${C.border} !important;
              border-radius: 6px !important;
            }
            .datepicker-wrapper .react-datepicker {
              background: ${C.surface} !important;
              border: none !important;
            }
            .datepicker-wrapper .react-datepicker__header {
              background: ${C.graphite} !important;
              border-bottom: 1px solid ${C.border} !important;
            }
            .datepicker-wrapper .react-datepicker__current-month {
              font-family: ${F.ui} !important;
              font-size: 13px !important;
              color: ${C.bone} !important;
              font-weight: 500 !important;
            }
            .datepicker-wrapper .react-datepicker__day-names {
              background: ${C.surface} !important;
            }
            .datepicker-wrapper .react-datepicker__day-name {
              color: ${C.bone40} !important;
              font-family: ${F.ui} !important;
              font-size: 11px !important;
              font-weight: 600 !important;
            }
            .datepicker-wrapper .react-datepicker__day {
              color: ${C.bone} !important;
              background: ${C.surface} !important;
              font-family: ${F.ui} !important;
              font-size: 12px !important;
              border-radius: 4px !important;
              margin: 2px !important;
            }
            .datepicker-wrapper .react-datepicker__day:hover {
              background: ${C.graphite} !important;
            }
            .datepicker-wrapper .react-datepicker__day--selected {
              background: ${C.ember} !important;
              color: ${C.bone} !important;
              font-weight: 600 !important;
            }
            .datepicker-wrapper .react-datepicker__day--keyboard-selected {
              background: ${C.ember} !important;
            }
            .datepicker-wrapper .react-datepicker__day--outside-month {
              color: ${C.bone40} !important;
              opacity: 0.5 !important;
            }
            .datepicker-wrapper .react-datepicker__time-container {
              border-left: 1px solid ${C.border} !important;
              background: ${C.graphite} !important;
            }
            .datepicker-wrapper .react-datepicker__time-list__item {
              color: ${C.bone} !important;
              font-family: ${F.ui} !important;
            }
            .datepicker-wrapper .react-datepicker__time-list__item--selected {
              background: ${C.ember} !important;
            }
          `}</style>
        </div>
      </div>

      {/* Session Activity - Bar Chart */}
      {sessionBarTotal > 0 && (
        <div style={{
          background: C.graphite, borderRadius: 10,
          border: `1px solid ${C.border}`, padding: '18px 18px', marginBottom: 16,
        }}>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone20, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Session activity
          </div>

          {/* Mini bar chart - 12 hour blocks */}
          <div style={{
            display: 'flex', gap: 3, height: 32, marginBottom: 12, alignItems: 'flex-end',
            background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '0 8px', overflow: 'hidden',
          }}>
            {Array(Math.ceil(sessionBarTotal / 5)).fill(0).map((_, i) => {
              const blockTotal = Math.min(5, sessionBarTotal - i * 5);
              const blockFocused = Math.min(focused - (i * 5), blockTotal);
              const blockDistracted = blockTotal - blockFocused;
              const blockHeight = (blockTotal / Math.ceil(sessionBarTotal / 5)) * 24;

              return (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column-reverse', height: blockHeight, gap: 0, borderRadius: 2, overflow: 'hidden',
                }}>
                  {blockFocused > 0 && (
                    <div style={{
                      flex: blockFocused, background: C.moss, borderRadius: '0 0 2px 2px',
                    }} />
                  )}
                  {blockDistracted > 0 && (
                    <div style={{
                      flex: blockDistracted, background: C.ember, borderRadius: '2px 2px 0 0',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              background: 'rgba(107,142,90,0.1)', border: `1px solid ${C.moss20}`,
              borderRadius: 6, padding: '10px 12px',
            }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 4 }}>
                Focused
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: C.moss }}>
                {Math.round(focused)}m
              </div>
            </div>
            <div style={{
              background: 'rgba(232,107,58,0.1)', border: `1px solid ${C.ember20}`,
              borderRadius: 6, padding: '10px 12px',
            }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 4 }}>
                Distracted
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: C.ember }}>
                {Math.round(distracted)}m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones with Numbered Circles - always show, even if empty */}
      <div style={{
        background: C.graphite, borderRadius: 10,
        border: `1px solid ${C.border}`, padding: '18px 18px', marginBottom: 16,
      }}>
        <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone20, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Milestones · {displayData.milestones?.length || 0}
        </div>

        {displayData.milestones && displayData.milestones.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayData.milestones.map((ms, idx) => {
              const reached = pct >= ms.ratio * 100;
              const colors = [C.ember, '#FFB347', '#FF9999', C.moss, '#87CEEB'];
              const milestoneColor = colors[idx % colors.length];

              return (
                <div key={ms.n || idx}>
                  {/* Always-editable milestone row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto', gap: 10, alignItems: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: milestoneColor, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontFamily: F.mono, fontSize: 13, fontWeight: 600, color: C.ink,
                      flexShrink: 0,
                    }}>
                      {reached ? (
                        <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                          <path d="M2 6L5.5 10L12 2" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <input
                      type="text"
                      value={ms.label}
                      onChange={(e) => {
                        const newMs = [...displayData.milestones];
                        newMs[idx].label = e.target.value;
                        const newData = { ...displayData, milestones: newMs };
                        setEditData(newData);
                        triggerAutoSave(newData);
                      }}
                      placeholder="Milestone name"
                      style={{
                        fontFamily: F.ui, fontSize: 11, color: C.bone,
                        background: C.graphite, border: `2px solid ${C.border2}`,
                        borderRadius: 4, padding: '6px 8px', outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = C.ember)}
                      onBlur={(e) => (e.target.style.borderColor = `${C.border2}`)}
                    />
                    <button
                      onClick={() => {
                        const newMs = [...displayData.milestones];
                        const now = new Date().toISOString();
                        if (newMs[idx].status === 'started') {
                          newMs[idx].status = '';
                          newMs[idx].startedAt = null;
                        } else {
                          newMs[idx].status = 'started';
                          newMs[idx].startedAt = newMs[idx].startedAt || now;
                        }
                        const newData = { ...displayData, milestones: newMs };
                        setEditData(newData);
                        triggerAutoSave(newData);
                      }}
                      style={{
                        fontFamily: F.ui, fontSize: 10,
                        color: ms.status === 'started' ? C.ink : C.moss,
                        background: ms.status === 'started' ? C.moss : 'none',
                        border: ms.status === 'started' ? 'none' : `1px solid ${C.moss}`,
                        cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
                        transition: 'all 0.2s', flexShrink: 0,
                      }}
                    >Start</button>
                    <button
                      onClick={() => {
                        const newMs = [...displayData.milestones];
                        const now = new Date().toISOString();
                        if (newMs[idx].status === 'completed') {
                          newMs[idx].status = '';
                          newMs[idx].completedAt = null;
                        } else {
                          newMs[idx].status = 'completed';
                          newMs[idx].startedAt = newMs[idx].startedAt || now;
                          newMs[idx].completedAt = now;
                        }
                        const newData = { ...displayData, milestones: newMs };
                        setEditData(newData);
                        triggerAutoSave(newData);
                      }}
                      style={{
                        fontFamily: F.ui, fontSize: 10,
                        color: ms.status === 'completed' ? C.ink : C.moss,
                        background: ms.status === 'completed' ? C.moss : 'none',
                        border: ms.status === 'completed' ? 'none' : `1px solid ${C.moss}`,
                        cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
                        transition: 'all 0.2s', flexShrink: 0,
                      }}
                    >Done</button>
                    <button
                      onClick={() => {
                        const newMs = displayData.milestones.filter((_, i) => i !== idx);
                        const newData = { ...displayData, milestones: newMs };
                        setEditData(newData);
                        triggerAutoSave(newData);
                      }}
                      style={{
                        fontFamily: F.ui, fontSize: 13, color: C.ember,
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >×</button>
                  </div>
                  {(ms.startedAt || ms.completedAt) && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 6, paddingLeft: 4 }}>
                      {ms.startedAt && (
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.bone40 }}>
                          Started {new Date(ms.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      )}
                      {ms.completedAt && (
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: C.moss }}>
                          Done {new Date(ms.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: C.bone40, fontStyle: 'italic', padding: '12px 0' }}>
            No milestones yet. Click below to add one!
          </div>
        )}

        <button
          onClick={() => {
            const newMs = [...(displayData.milestones || []), { n: (displayData.milestones?.length || 0) + 1, label: 'New milestone', ratio: 0.5, at: '1h' }];
            const newData = { ...displayData, milestones: newMs };
            setEditData(newData);
            triggerAutoSave(newData);
          }}
          style={{
            fontFamily: F.ui, fontSize: 11, color: C.ember, marginTop: 12,
            background: C.ember10, border: `1px solid ${C.ember20}`,
            borderRadius: 4, padding: '6px 12px', cursor: 'pointer', width: '100%',
          }}
        >+ Add milestone</button>
      </div>

      {/* Risk factors */}
      {displayData.riskFactors && displayData.riskFactors.length > 0 && (
        <div style={{
          background: C.ember10, border: `1px solid ${C.ember20}`,
          borderRadius: 10, padding: '14px 18px',
        }}>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Risk factors
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {displayData.riskFactors.map((r, i) => (
              <li key={i} style={{ fontFamily: F.ui, fontSize: 12, color: C.bone, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <span style={{ color: C.ember, marginTop: 1 }}>·</span>
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

function DetailStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 500, color: color || C.bone }}>{value}</div>
    </div>
  );
}

// =============================================================================
// Main Dashboard
// =============================================================================
export default function Dashboard({ onNavigateToTask, showToast = () => {}, onLogout = () => {}, subscriptionStatus = 'free', freeTrialEndsAt = null, paidUntil = null }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [sessionTotals, setSessionTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showFormModal, setShowFormModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [draggedId, setDraggedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('projectFocusUserName') || null;
  });
  const userId = localStorage.getItem('userId') || 'default';

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all tasks including deleted (frontend filtering handles which to show)
      const res = await fetch(`/api/tasks?userId=${encodeURIComponent(userId)}&includedeleted=true`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteSelectedTasks = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all([...selectedIds].map(id =>
        fetch(`/api/task/${id}/delete`, { method: 'POST' })
      ));
      setSelectedIds(new Set());
      setSelectedTask(null);
      showToast(`${selectedIds.size}개 작업이 삭제되었습니다`, 'success');
      fetchTasks();
    } catch (err) {
      showToast('작업 삭제에 실패했습니다', 'error');
      console.error('Delete error:', err);
    }
  }, [selectedIds, fetchTasks, showToast]);

  const onReorder = useCallback(async (draggedTaskId, targetTaskId) => {
    try {
      console.log('=== REORDER START ===');
      console.log('Dragged ID:', draggedTaskId);
      console.log('Target ID:', targetTaskId);
      console.log('Current tasks:', tasks.length, 'tasks');

      const draggedTask = tasks.find(t => t.id === draggedTaskId);
      const targetTask = tasks.find(t => t.id === targetTaskId);

      console.log('Dragged task found:', !!draggedTask, draggedTask?.title);
      console.log('Target task found:', !!targetTask, targetTask?.title);

      if (!draggedTask || !targetTask) {
        console.error('Tasks not found - aborting reorder');
        return;
      }

      // Simple approach: swap priorities
      const draggedPriority = draggedTask.priority ?? 0;
      const targetPriority = targetTask.priority ?? 0;

      console.log('Dragged priority:', draggedPriority, '→ Target priority:', targetPriority);
      console.log('Swapping to:', draggedTaskId, '←', targetPriority, 'and', targetTaskId, '←', draggedPriority);

      // Update both tasks with swapped priorities
      const res1 = await fetch(`/api/task/${draggedTaskId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: targetPriority }),
      });
      console.log(`Update dragged task (${draggedTaskId}):`, res1.status, res1.statusText);

      const res2 = await fetch(`/api/task/${targetTaskId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: draggedPriority }),
      });
      console.log(`Update target task (${targetTaskId}):`, res2.status, res2.statusText);

      if (!res1.ok) {
        const err1 = await res1.text();
        console.error('API error for dragged task:', res1.status, err1);
      }
      if (!res2.ok) {
        const err2 = await res2.text();
        console.error('API error for target task:', res2.status, err2);
      }

      if (!res1.ok || !res2.ok) {
        console.error('One or both API calls failed - aborting');
        return;
      }

      console.log('API updates successful, fetching tasks...');
      await fetchTasks();
      showToast('우선순위가 변경되었습니다', 'success');
      console.log('=== REORDER COMPLETE ===');
    } catch (err) {
      console.error('Reorder exception:', err);
      showToast('우선순위 변경에 실패했습니다', 'error');
    }
  }, [tasks, fetchTasks, showToast]);

  const fetchTaskProgress = useCallback(async (taskId) => {
    try {
      const res = await fetch(`/api/task/${taskId}/progress`);
      if (!res.ok) return;
      const data = await res.json();
      setSessionTotals(data.session || null);
      const patch = {
        progress: data.progress,
        status: data.status,
        startedAt: data.startedAt ?? null,
        completedAt: data.completedAt ?? null,
      };
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...patch } : t));
      setSelectedTask(prev => prev?.id === taskId ? { ...prev, ...patch } : prev);
    } catch { /* non-fatal */ }
  }, []);

  // Fetch today's session totals (for dashboard view without selected task)
  const fetchTodaySessionTotals = useCallback(async () => {
    try {
      let totalFocused = 0;
      let totalDistracted = 0;

      // Fetch progress for all tasks to aggregate session data
      for (const task of tasks) {
        try {
          const res = await fetch(`/api/task/${task.id}/progress`);
          if (res.ok) {
            const data = await res.json();
            totalFocused += data.session?.focusedMinutes || 0;
            totalDistracted += data.session?.distractedMinutes || 0;
          }
        } catch { /* skip failed fetches */ }
      }

      setSessionTotals({
        focusedMinutes: totalFocused,
        distractedMinutes: totalDistracted,
      });
    } catch { /* non-fatal */ }
  }, [tasks]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const id = setInterval(fetchTasks, 30000);
    return () => clearInterval(id);
  }, [fetchTasks]);

  useEffect(() => {
    if (selectedTask) {
      fetchTaskProgress(selectedTask.id);
      const id = setInterval(() => fetchTaskProgress(selectedTask.id), 10000);
      return () => clearInterval(id);
    }
  }, [selectedTask?.id, fetchTaskProgress]);

  // Escape key to close task detail
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTask) {
        setSelectedTask(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask]);


  // Auto-update dashboard stats every 1 hour when on dashboard view (skip 1am-7am)
  useEffect(() => {
    if (activeView === 'dashboard' && !selectedTask && tasks.length > 0) {
      const hour = new Date().getHours();
      const isSleepTime = hour >= 1 && hour < 7;

      if (!isSleepTime) {
        fetchTodaySessionTotals();
      }

      const id = setInterval(() => {
        const h = new Date().getHours();
        const sleeping = h >= 1 && h < 7;
        if (!sleeping) {
          fetchTodaySessionTotals();
        }
      }, 3600000); // 1 hour

      return () => clearInterval(id);
    }
  }, [activeView, selectedTask, tasks, fetchTodaySessionTotals]);

  function handleSelectTask(task) {
    setSelectedTask(task);
    setSessionTotals(null);
    fetchTaskProgress(task.id);
    // Auto-start tracking when task is selected (optional, Electron only)
    // Try to communicate with local Electron agent if available
    if (window.electron) {
      fetch('http://127.0.0.1:3001/set-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      }).catch(() => {}); // Silently fail if not available
    }
  }

  function handleViewChange(viewId) {
    setActiveView(viewId);
    setSelectedTask(null); // Close task panel when switching views
  }

  // Filter tasks by active view
  const filteredTasks = tasks.filter(task => {
    if (activeView === 'dashboard') {
      return false; // Dashboard view shows no tasks (Hero only)
    }
    if (activeView === 'deleted') {
      return task.status === 'deleted';
    }
    // Exclude deleted tasks from all other views
    if (task.status === 'deleted') {
      return false;
    }
    if (activeView === 'archive') {
      return task.status === 'completed';
    }
    return true; // 'all' view
  });

  const showDetail = selectedTask !== null;

  // Get view label and count
  const viewLabels = {
    dashboard: 'Dashboard',
    all: 'All tasks',
    archive: 'Archive',
    deleted: 'Deleted',
  };
  const viewLabel = viewLabels[activeView] || 'Tasks';

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: C.ink, color: C.bone, fontFamily: F.ui,
    }}>
      {/* User name prompt — shown on first visit */}
      {!userName && (
        <UserNamePrompt onSave={(name) => setUserName(name)} />
      )}

      {/* Sidebar */}
      <Sidebar
        tasks={tasks}
        selectedTask={selectedTask}
        onSelectTask={handleSelectTask}
        activeView={activeView}
        onViewChange={handleViewChange}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Hero dashboard header */}
        <Hero tasks={tasks} sessionTotals={sessionTotals} userName={userName || 'there'} />

        {/* Subscription status banner */}
        {(() => {
          const now = new Date();
          const trialEnd = freeTrialEndsAt ? new Date(freeTrialEndsAt) : null;
          const paidEnd = paidUntil ? new Date(paidUntil) : null;

          let bannerConfig = null;

          if (subscriptionStatus === 'paid' && paidEnd && paidEnd > now) {
            const daysLeft = Math.ceil((paidEnd - now) / (1000 * 60 * 60 * 24));
            bannerConfig = {
              bg: 'rgba(107,142,90,0.15)',
              border: '1px solid rgba(107,142,90,0.3)',
              color: '#6B8E5A',
              text: `✓ Premium active · expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
            };
          } else if (trialEnd && trialEnd > now) {
            const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
            bannerConfig = {
              bg: 'rgba(232,107,58,0.12)',
              border: '1px solid rgba(232,107,58,0.25)',
              color: '#E86B3A',
              text: `⏱ Free trial · ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`
            };
          } else {
            bannerConfig = {
              bg: 'rgba(239,83,80,0.12)',
              border: '1px solid rgba(239,83,80,0.25)',
              color: '#ef5350',
              text: '⚠ Trial expired · upgrade to continue'
            };
          }

          return (
            <div style={{
              padding: '10px 20px', flexShrink: 0,
              background: bannerConfig.bg,
              border: `${bannerConfig.border}`,
              borderTop: 'none',
              borderBottom: bannerConfig.border,
              fontFamily: F.ui, fontSize: 13, color: bannerConfig.color,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{bannerConfig.text}</span>
              {subscriptionStatus !== 'paid' && (
                <button
                  onClick={() => alert('Upgrade to premium coming soon!')}
                  style={{
                    background: bannerConfig.color,
                    color: C.ink,
                    border: 'none',
                    borderRadius: 5,
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: F.ui,
                  }}
                >
                  Upgrade
                </button>
              )}
            </div>
          );
        })()}

        {/* Error banner */}
        {error && (
          <div style={{
            padding: '8px 20px', flexShrink: 0,
            background: C.ember10, borderBottom: `1px solid ${C.ember20}`,
            fontFamily: F.ui, fontSize: 12, color: C.ember,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Error: {error}</span>
            <button onClick={fetchTasks} style={{ background: 'none', border: 'none', color: C.ember, cursor: 'pointer', fontFamily: F.ui, fontSize: 12, textDecoration: 'underline' }}>
              Retry
            </button>
          </div>
        )}

        {/* Dashboard sections — only when dashboard view is active */}
        {activeView === 'dashboard' && (
          <DashboardContent
            tasks={tasks}
            onNewTask={() => setShowFormModal(true)}
          />
        )}

        {/* Body: task list + optional detail (hidden in dashboard view) */}
        {activeView !== 'dashboard' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Task list column (40% when detail is open, 100% when closed) */}
          <div style={{
            flex: '1 1 100%',
            display: 'flex', flexDirection: 'column',
            borderRight: showDetail ? `1px solid ${C.border}` : 'none',
            overflow: 'hidden',
            transition: 'flex 0.2s ease',
          }}>
            {/* Section header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px',
              borderBottom: `1px solid ${C.border}`, flexShrink: 0,
            }}>
              <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: C.bone }}>
                {viewLabel} · {filteredTasks.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedIds.size > 0 && (
                  <button onClick={deleteSelectedTasks} style={{
                    fontFamily: F.ui, fontSize: 11, fontWeight: 500,
                    color: C.bone, background: C.ember,
                    border: 'none', borderRadius: 5, padding: '4px 10px',
                    cursor: 'pointer',
                  }}>
                    Delete {selectedIds.size} selected
                  </button>
                )}
                <button onClick={fetchTasks} style={{
                  background: 'none', border: 'none', color: C.bone40,
                  cursor: 'pointer', fontSize: 14, padding: '2px 4px',
                  borderRadius: 4,
                }} title="Refresh">↻</button>
              </div>
            </div>

            {/* Add task button / form modal */}
            {!showFormModal && (
              <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                <button
                  onClick={() => setShowFormModal(true)}
                  style={{
                    width: 'auto',
                    fontFamily: F.ui,
                    fontSize: 12,
                    fontWeight: 500,
                    color: C.ink,
                    background: C.ember,
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  + New Task
                </button>
              </div>
            )}

            {/* Column Header */}
            {!loading && filteredTasks.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '20px 1fr auto auto 120px auto 80px auto',
                alignItems: 'center',
                gap: 16,
                padding: '8px 20px',
                background: C.graphite,
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
              }}>
                <input
                  type="checkbox"
                  checked={filteredTasks.length > 0 && filteredTasks.every(t => selectedIds.has(t.id))}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(filteredTasks.map(t => t.id)));
                    else setSelectedIds(new Set());
                  }}
                  style={{ cursor: 'pointer', accentColor: C.ember }}
                />
                <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Due</div>
                <div style={{ width: 60 }} />
                <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Time</div>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: C.bone40, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Status</div>
                <div style={{ width: 30 }} />
              </div>
            )}

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <LoadingState />
              ) : filteredTasks.length === 0 ? (
                <EmptyState onRefresh={fetchTasks} />
              ) : (
                [...filteredTasks].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)).map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isActive={selectedTask?.id === task.id}
                    onSelect={handleSelectTask}
                    onOpenDetail={onNavigateToTask}
                    onRestore={async (taskId) => {
                      try {
                        const res = await fetch(`/api/task/${taskId}/restore`, { method: 'POST' });
                        if (res.ok) {
                          await fetchTasks();
                        }
                      } catch (err) {
                        console.error('Restore failed:', err);
                      }
                    }}
                    onReorder={onReorder}
                    draggedId={draggedId}
                    setDraggedId={setDraggedId}
                    checked={selectedIds.has(task.id)}
                    onCheck={(checked) => {
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        checked ? next.add(task.id) : next.delete(task.id);
                        return next;
                      });
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail panel - overlay on top */}
          {showDetail && (
            <>
              {/* Transparent backdrop — clicking it closes the panel */}
              <div
                style={{
                  position: 'absolute', inset: 0, zIndex: 9,
                  background: 'rgba(0,0,0,0.25)', cursor: 'default',
                }}
                onClick={() => setSelectedTask(null)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '60%',
                  overflow: 'hidden',
                  background: C.ink,
                  boxShadow: '-2px 0 12px rgba(0,0,0,0.4)',
                  zIndex: 10,
                }}
              >
                <DetailPanel
                  task={selectedTask}
                  sessionTotals={sessionTotals}
                  onClose={() => setSelectedTask(null)}
                  onRefreshTask={() => {
                    if (selectedTask) {
                      fetchTaskProgress(selectedTask.id);
                      fetchTasks();
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) {
              setShowFormModal(false);
            }
          }}
        >
          <div
            style={{
              width: '90%',
              maxWidth: 600,
              height: '90vh',
              maxHeight: 800,
              background: C.ink,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <MultiStageForm
              onSubmit={async (formData) => {
                setFormSubmitting(true);
                try {
                  const res = await fetch('/api/task/create-multi-stage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formData, userId }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to create task');

                  setShowFormModal(false);
                  setFormSubmitting(false);
                  showToast(`"${formData.title}" 작업이 생성되었습니다`, 'success');
                  setTimeout(() => fetchTasks(), 500);
                } catch (err) {
                  setFormSubmitting(false);
                  showToast(err.message || '작업 생성에 실패했습니다', 'error');
                  console.error('Form submission error:', err);
                }
              }}
              onCancel={() => setShowFormModal(false)}
              userId={userId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
