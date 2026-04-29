import React, { useState, useEffect } from 'react';

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

function PopupDemo() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (videoPlaying && videoRef.current) {
      videoRef.current.play().catch(err => console.log('Autoplay prevented:', err));
    }
  }, [videoPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setPopupVisible(false);
      setVideoPlaying(false);
      setIsYouTube(false);
      return;
    }

    const timeline = [
      { at: 1500, action: () => setIsYouTube(true) },
      { at: 3500, action: () => setPopupVisible(true) },
      { at: 4200, action: () => setVideoPlaying(true) },
      { at: 9000, action: () => {
        setPopupVisible(false);
        setVideoPlaying(false);
        setIsYouTube(false);
        setIsPlaying(false);
      }},
      { at: 10500, action: () => setIsPlaying(true) },
    ];

    const timers = timeline.map(item =>
      setTimeout(item.action, item.at)
    );

    return () => timers.forEach(t => clearTimeout(t));
  }, [isPlaying]);

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      perspective: '1000px',
    }}>
      {/* Demo Screen */}
      <div style={{
        background: C.graphite,
        border: `1px solid ${C.border2}`,
        borderRadius: 12,
        padding: 40,
        position: 'relative',
        minHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
      }}>
        {/* Simulated Browser Window */}
        <div style={{
          width: '100%',
          background: C.ink,
          border: `1px solid ${C.border2}`,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {/* URL Bar */}
          <div style={{
            background: C.surface,
            padding: '12px 16px',
            borderBottom: `1px solid ${C.border}`,
            fontFamily: F.mono,
            fontSize: 11,
            color: C.bone40,
            transition: 'all 0.3s ease',
          }}>
            🔒 {isYouTube ? 'youtube.com' : 'task-manager.app'}
          </div>

          {/* Content Area */}
          <div style={{
            height: 450,
            background: C.ink,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Working/YouTube Placeholder */}
            <div style={{
              width: '100%',
              height: '100%',
              background: isYouTube
                ? 'linear-gradient(135deg, rgba(232,107,58,0.1) 0%, rgba(107,142,90,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(107,142,90,0.15) 0%, rgba(232,107,58,0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F.ui,
              color: C.bone40,
              fontSize: 14,
              transition: 'all 0.5s ease',
            }}>
              {isYouTube ? '▶ Browsing YouTube...' : '📝 Working on Task'}
            </div>

            {/* Popup Animation */}
            {popupVisible && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'popupSlide 0.4s ease-out',
              }}>
                <style>{`
                  @keyframes popupSlide {
                    from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                  }
                `}</style>

                <div style={{
                  width: 700,
                  background: C.ink,
                  border: `2px solid ${C.ember}`,
                  borderRadius: 8,
                  padding: 20,
                  boxShadow: `0 30px 100px rgba(232,107,58,0.3)`,
                }}>
                  {/* Video Player */}
                  {videoPlaying && (
                    <video
                      ref={videoRef}
                      playsInline
                      controls
                      loop
                      style={{
                        width: '100%',
                        height: 380,
                        background: '#000',
                        borderRadius: 6,
                        marginBottom: 16,
                        animation: 'videoFadeIn 0.3s ease-out',
                      }}>
                      <style>{`
                        @keyframes videoFadeIn {
                          from { opacity: 0; }
                          to { opacity: 1; }
                        }
                      `}</style>
                      <source src="/20260427 Youtube Korea.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}

                  {/* Popup Content */}
                  <div style={{
                    fontFamily: F.ui,
                    color: C.bone,
                  }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: C.ember,
                      textTransform: 'uppercase',
                      marginBottom: 12,
                      letterSpacing: 1,
                    }}>
                      ⚠ Focus Alert
                    </div>

                    <div style={{
                      fontFamily: F.title,
                      fontSize: 18,
                      fontWeight: 300,
                      fontStyle: 'italic',
                      color: C.bone,
                      marginBottom: 16,
                      lineHeight: 1.4,
                    }}>
                      YouTube doesn't care about your deadline.<br />
                      <span style={{ color: C.ember, fontWeight: 600 }}>15 min</span> spent here.
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: 10,
                    }}>
                      <button style={{
                        flex: 0.6,
                        padding: '10px 14px',
                        background: C.ember,
                        border: 'none',
                        borderRadius: 6,
                        color: C.bone,
                        fontFamily: F.ui,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        Back to work
                      </button>
                      <select style={{
                        flex: 0.65,
                        padding: '10px 12px',
                        background: 'rgba(250,250,248,0.1)',
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.bone40,
                        fontFamily: F.ui,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}>
                        <option>Snooze...</option>
                        <option>1 min</option>
                        <option>5 min</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Play Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            padding: '14px 28px',
            background: C.ember,
            border: 'none',
            borderRadius: 6,
            color: C.bone,
            fontFamily: F.ui,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.85'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          {isPlaying ? '⏸ Stop Demo' : '▶ Watch Demo'}
        </button>
      </div>
    </div>
  );
}

export default function Landing({ onEnterApp }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing" style={{ background: C.ink, color: C.bone, fontFamily: F.ui }}>
      <style>{`
        .landing h1, .landing h2, .landing h3 {
          font-style: normal !important;
          font-weight: 600 !important;
          letter-spacing: -0.02em;
        }
      `}</style>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: `rgba(14, 14, 12, ${Math.min(scrollY / 100, 0.95)})`,
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${scrollY > 10 ? C.border : 'transparent'}`,
        padding: '12px 40px',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="20" height="20" fill="none" stroke={C.ember} strokeWidth="2.5" rx="2"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 600, fontFamily: F.title, fontStyle: 'italic' }}>focus.</span>
          </div>
          <a href="https://github.com/projectmock1804/Project-Focus/releases/latest/download/Project-Focus-Setup.exe" style={{
            fontFamily: F.ui,
            fontSize: 13,
            padding: '10px 20px',
            background: C.ember,
            border: 'none',
            borderRadius: 4,
            color: C.bone,
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.style.transform = 'translateY(-1px)';
            e.style.boxShadow = `0 6px 16px rgba(232, 107, 58, 0.3)`;
          }}
          onMouseLeave={(e) => {
            e.style.transform = 'translateY(0)';
            e.style.boxShadow = 'none';
          }}>
            <span>⬇</span> Download
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 80,
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${C.ember20} 0%, transparent 70%)`,
          borderRadius: '50%',
          right: '-100px',
          top: '-200px',
          opacity: 0.8,
          animation: 'float 8s ease-in-out infinite',
        }}>
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-50px) scale(1.05); }
            }
          `}</style>
        </div>

        <div style={{
          position: 'absolute',
          width: 400,
          height: 400,
          background: `radial-gradient(circle, ${C.moss10} 0%, transparent 70%)`,
          borderRadius: '50%',
          left: '-80px',
          bottom: '100px',
          opacity: 0.6,
          animation: 'float 10s ease-in-out infinite reverse',
        }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1000, textAlign: 'center', padding: '0 20px' }}>
          {/* Main Headline */}
          <h1 style={{
            fontSize: 88,
            fontFamily: F.title,
            fontWeight: 600,
            margin: '0 0 16px',
            lineHeight: 1.2,
            letterSpacing: -2,
          }}>
            Every Distraction<br/>
            Costs Hours.<br/>
            <span style={{ color: C.ember }}>We Stop It.</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 20,
            color: C.bone,
            margin: '0 0 48px',
            lineHeight: 1.6,
            maxWidth: 700,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Real-time detection. Instant interrupts. Proven focus.
            <br/>
            Watch yourself work harder than ever before.
          </p>

          {/* CTA Button */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginBottom: 60,
            flexWrap: 'wrap',
          }}>
            <a href="https://github.com/projectmock1804/Project-Focus/releases/latest/download/Project-Focus-Setup.exe" style={{
              fontFamily: F.ui,
              fontSize: 15,
              padding: '16px 36px',
              background: C.ember,
              border: 'none',
              borderRadius: 6,
              color: C.bone,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              boxShadow: `0 8px 24px rgba(232, 107, 58, 0.3)`,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.style.transform = 'translateY(-2px)';
              e.style.boxShadow = `0 12px 32px rgba(232, 107, 58, 0.4)`;
            }}
            onMouseLeave={(e) => {
              e.style.transform = 'translateY(0)';
              e.style.boxShadow = `0 8px 24px rgba(232, 107, 58, 0.3)`;
            }}>
              <span>⬇</span> Download for Windows
            </a>
          </div>

          {/* Stats Line */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            paddingTop: 40,
            borderTop: `1px solid ${C.border}`,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: F.ui,
          }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.ember, marginBottom: 4 }}>47%</div>
              <div style={{ fontSize: 12, color: C.bone40 }}>More focused time</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.moss, marginBottom: 4 }}>3.2x</div>
              <div style={{ fontSize: 12, color: C.bone40 }}>Task completion</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.bone, marginBottom: 4 }}>10k+</div>
              <div style={{ fontSize: 12, color: C.bone40 }}>Users focused</div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Horizontal */}
      <section style={{
        padding: '40px',
        background: C.graphite,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* 5-Video Horizontal Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          maxWidth: '100%',
        }}>
          {[
            '/videos/20260427 Youtube Korea.mp4',
            '/videos/Woman_looking_at_202604281549 (1).mp4',
            '/videos/Woman_looking_at_202604281549.mp4',
            '/videos/Woman_looking_at_202604281602.mp4',
            '/videos/Woman_looking_at_202604281603.mp4',
          ].map((videoPath, idx) => (
            <div key={idx} style={{
              background: C.ink,
              overflow: 'hidden',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <video
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                autoPlay
                muted
                loop
                playsInline
              >
                <source src={videoPath} type="video/mp4" />
              </video>
            </div>
          ))}
        </div>
      </section>

      {/* The Core Problem */}
      <section style={{
        padding: '60px 40px',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 80,
        }}>
          <h2 style={{
            fontSize: 48,
            fontFamily: F.title,
            fontWeight: 600,
            margin: 0,
            marginBottom: 24,
          }}>
            You Know the Problem
          </h2>
          <p style={{
            fontSize: 28,
            fontWeight: 600,
            color: C.bone,
            margin: 0,
            lineHeight: 1.4,
            maxWidth: 800,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            You open YouTube for 5 minutes. Two hours later, you are still there.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 30,
        }}>
          {[
            { num: '1', title: 'Planning Paralysis', desc: 'Breaking down projects takes forever' },
            { num: '2', title: 'Time Blindness', desc: 'You lose track of what you\'re actually doing' },
            { num: '3', title: 'Distraction Wins', desc: 'Willpower alone doesn\'t work' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: 30,
              background: C.graphite,
              border: `1px solid ${C.border2}`,
              borderRadius: 8,
            }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: C.ember20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 600,
                color: C.ember,
                marginBottom: 16,
              }}>
                {item.num}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: C.bone40, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Solution - Interactive Demo */}
      <section style={{
        padding: '60px 40px',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 60,
        }}>
          <h2 style={{
            fontSize: 48,
            fontFamily: F.title,
            fontWeight: 600,
            margin: 0,
            marginBottom: 16,
          }}>
            Real-Time Distraction Detection
          </h2>
          <p style={{
            fontSize: 16,
            color: C.bone40,
            margin: 0,
          }}>
            Project Focus watches what you're doing. When it detects you're off-task, it interrupts with a focus moment.
          </p>
        </div>

        <PopupDemo />
      </section>

      {/* How It Works */}
      <section style={{
        padding: '60px 40px',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: 48,
          fontFamily: F.title,
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 80,
          margin: '0 0 80px',
        }}>
          The Process
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 30 }}>
          {[
            {
              icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 10C12 9.44772 12.4477 9 13 9H27C27.5523 9 28 9.44772 28 10V28C28 28.5523 27.5523 29 27 29H13C12.4477 29 12 28.5523 12 28V10Z" stroke={C.ember} strokeWidth="2"/>
                  <path d="M16 14H24M16 19H24M16 24H20" stroke={C.ember} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              title: 'Define',
              desc: 'Submit your task or project'
            },
            {
              icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="8" stroke={C.ember} strokeWidth="2"/>
                  <path d="M20 12V20M20 20L25 25" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 10L14 14M26 14L30 10M30 30L26 26M14 26L10 30" stroke={C.ember} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              title: 'Plan',
              desc: 'AI generates structured milestones'
            },
            {
              icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="14" width="20" height="18" rx="2" stroke={C.ember} strokeWidth="2"/>
                  <path d="M10 18H30M14 10V14M26 10V14" stroke={C.ember} strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 22L18 24L24 18" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'Schedule',
              desc: 'Automatic calendar integration'
            },
            {
              icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="9" stroke={C.ember} strokeWidth="2"/>
                  <path d="M20 14V20L24 24" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 10C8 12 7 15 7 18C7 26.8366 12.7909 34 20 34C27.2091 34 33 26.8366 33 18C33 9.16344 27.2091 2 20 2" stroke={C.ember} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ),
              title: 'Monitor',
              desc: 'Real-time distraction detection'
            },
          ].map((item, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding: 40,
              background: C.graphite,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              position: 'relative',
              transition: 'border-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.ember;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
            }}>
              {item.icon}
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: C.bone }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: C.bone40, margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '60px 40px',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: 48,
          fontFamily: F.title,
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 80,
          margin: '0 0 80px',
        }}>
          Core Capabilities
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 32,
        }}>
          {[
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4C6.89543 4 6 4.89543 6 6V26C6 27.1046 6.89543 28 8 28H24C25.1046 28 26 27.1046 26 26V12L18 4H8Z" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 4V12H26" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16H20M12 20H20" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'AI-Powered Task Planning',
              desc: 'Describe your objectives. Our system breaks down complex goals into actionable milestones with time estimates.',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="11" stroke={C.ember} strokeWidth="2"/>
                  <path d="M16 8V16L22 20" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="24" cy="10" r="2" fill={C.ember}/>
                </svg>
              ),
              title: 'Real-Time Activity Monitoring',
              desc: 'Continuous monitoring across your workspace. Instant detection of off-task activity on YouTube, social media, and other platforms.',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 4C8.89543 4 8 4.89543 8 6V26C8 27.1046 8.89543 28 10 28H22C23.1046 28 24 27.1046 24 26V6C24 4.89543 23.1046 4 22 4H10Z" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H20M12 14H20M12 20H20" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'Customizable Distraction Rules',
              desc: 'Define your own distraction criteria. Create personalized interruption rules based on your workflow and priorities.',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="10" width="20" height="16" rx="2" stroke={C.ember} strokeWidth="2"/>
                  <path d="M6 14H26M10 6V10M22 6V10" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18L14 20L18 16" stroke={C.ember} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'Intelligent Scheduling',
              desc: 'Seamless calendar integration. Tasks automatically align with your schedule without conflicts or overcommitment.',
            },
          ].map((feature, i) => (
            <div key={i} style={{
              padding: 40,
              background: C.graphite,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              transition: 'border-color 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.ember;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
            }}>
              <div>{feature.icon}</div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
                color: C.bone,
              }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: 14, color: C.bone40, margin: 0, lineHeight: 1.8 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{
        padding: '60px 40px',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: 48,
          fontFamily: F.title,
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 80,
          margin: '0 0 80px',
        }}>
          Simple, Transparent Pricing
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 30,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {[
            {
              name: 'Pro',
              price: '$9.99',
              desc: 'Start your 14-day free trial',
              features: ['Unlimited tasks', 'AI-powered planning', 'Real-time detection', 'Personalized rules', 'Smart scheduling', 'Focus interrupts', 'Distraction reports'],
              cta: 'Start Free Trial',
              highlight: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              desc: 'For teams & organizations',
              features: ['Everything in Pro', 'Team management', 'Advanced analytics', 'Custom integrations', 'Slack integration', 'Dedicated support', 'SLA'],
              cta: 'Contact Sales',
              highlight: false,
            },
          ].map((plan, i) => (
            <div key={i} style={{
              padding: 40,
              background: plan.highlight ? C.ember10 : C.graphite,
              border: `2px solid ${plan.highlight ? C.ember : C.border2}`,
              borderRadius: 8,
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: C.ember,
                  color: C.bone,
                  padding: '4px 12px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0, marginBottom: 8 }}>{plan.name}</h3>
              <p style={{ fontSize: 12, color: C.bone40, margin: '0 0 20px' }}>{plan.desc}</p>

              <div style={{ marginBottom: 30 }}>
                <span style={{ fontSize: 40, fontWeight: 600 }}>{plan.price}</span>
                {plan.price !== '$0' && plan.price !== 'Custom' && (
                  <span style={{ fontSize: 12, color: C.bone40 }}>/mo</span>
                )}
              </div>

              <button onClick={e => e.target.closest('[data-enter]') && onEnterApp?.()} style={{
                width: '100%',
                padding: '12px',
                background: plan.highlight ? C.ember : C.surface,
                border: `1px solid ${plan.highlight ? C.ember : C.border}`,
                borderRadius: 4,
                color: plan.highlight ? C.bone : C.ember,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 30,
                fontFamily: F.ui,
              }} data-enter>
                {plan.cta}
              </button>

              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{
                    fontSize: 12,
                    color: C.bone40,
                    padding: '8px 0',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Download Desktop App Section */}
      <section style={{
        padding: '60px 40px',
        maxWidth: 1400,
        margin: '0 auto 40px',
      }}>
        {/* Main Card */}
        <div style={{
          background: `linear-gradient(135deg, ${C.surface}80, ${C.graphite}80)`,
          border: `1px solid ${C.ember20}`,
          borderRadius: 20,
          padding: '80px 60px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Gradient Background Elements */}
          <div style={{
            position: 'absolute',
            width: 300,
            height: 300,
            background: `radial-gradient(circle, ${C.ember10}, transparent 70%)`,
            right: '-100px',
            top: '-100px',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${C.moss10}, transparent 70%)`,
            left: '-50px',
            bottom: '50px',
            borderRadius: '50%',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Icon */}
            <div style={{
              fontSize: 60,
              marginBottom: 24,
              display: 'inline-block',
              background: `linear-gradient(135deg, ${C.ember20}, ${C.moss10})`,
              padding: '20px',
              borderRadius: 12,
              border: `1px solid ${C.ember10}`,
            }}>
              🖥️
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: 44,
              fontFamily: F.title,
              fontWeight: 600,
              margin: '0 0 12px',
              background: `linear-gradient(135deg, ${C.bone}, ${C.bone40})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Get the Power of Focus
            </h2>

            {/* Subheading */}
            <p style={{
              fontSize: 18,
              color: C.bone40,
              margin: '0 0 12px',
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}>
              Download the desktop app. Watch your back while you work.
            </p>
            <p style={{
              fontSize: 14,
              color: C.bone20,
              margin: '0 0 48px',
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Runs silently in the background. Detects distractions in real-time. Interrupts before you lose focus.
            </p>

            {/* Download Button */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
              <a
                href="https://github.com/projectmock1804/Project-Focus/releases/latest/download/Project-Focus-Setup.exe"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: F.ui,
                  fontSize: 16,
                  padding: '18px 44px',
                  background: `linear-gradient(135deg, ${C.ember}, ${C.ember}dd)`,
                  border: 'none',
                  borderRadius: 10,
                  color: C.bone,
                  cursor: 'pointer',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: `0 12px 40px rgba(232, 107, 58, 0.35)`,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.style.transform = 'translateY(-4px)';
                  e.style.boxShadow = `0 16px 48px rgba(232, 107, 58, 0.45)`;
                }}
                onMouseLeave={(e) => {
                  e.style.transform = 'translateY(0)';
                  e.style.boxShadow = `0 12px 40px rgba(232, 107, 58, 0.35)`;
                }}
              >
                <span>⬇</span> Download for Windows
              </a>
            </div>

            {/* Features Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 24,
              marginBottom: 48,
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              {[
                { icon: '🔕', title: 'No Terminal', desc: 'Clean installer, no command line' },
                { icon: '🤫', title: 'Silent', desc: 'Runs in background, no distractions' },
                { icon: '⚡', title: 'Instant Alerts', desc: 'Popup blocks distractions instantly' },
                { icon: '🪟', title: 'Windows Ready', desc: 'Works perfectly on Windows 10/11' },
              ].map(item => (
                <div key={item.title} style={{
                  padding: '20px',
                  background: `rgba(242, 240, 235, 0.03)`,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{item.icon}</div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.bone,
                    marginBottom: 4,
                    fontFamily: F.ui,
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: C.bone40,
                    fontFamily: F.ui,
                    lineHeight: 1.5,
                  }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* SmartScreen Notice */}
            <div style={{
              background: `linear-gradient(135deg, rgba(232,107,58,0.08), rgba(107,142,90,0.08))`,
              border: `1px solid ${C.border2}`,
              borderRadius: 14,
              padding: '20px 28px',
              textAlign: 'left',
              maxWidth: 520,
              margin: '0 auto',
              fontFamily: F.ui,
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.bone,
                    marginBottom: 6,
                  }}>
                    Windows SmartScreen Notice
                  </div>
                  <p style={{
                    fontSize: 12,
                    color: C.bone40,
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
                    New apps may trigger Windows protection. Click <strong style={{ color: C.bone }}>More info</strong> → <strong style={{ color: C.bone }}>Run anyway</strong>. This is normal and your app is safe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 40px',
        textAlign: 'center',
        background: C.graphite,
        borderRadius: 8,
        maxWidth: 1400,
        margin: '0 auto 80px',
      }}>
        <h2 style={{
          fontSize: 40,
          fontFamily: F.title,
          fontWeight: 600,
          marginBottom: 20,
          margin: 0,
        }}>
          Ready to Reclaim Your Time?
        </h2>
        <p style={{
          fontSize: 16,
          color: C.bone40,
          marginBottom: 30,
          margin: '0 0 30px',
        }}>
          Join people who've stopped letting distractions win.
        </p>
        <button onClick={onEnterApp} style={{
          fontFamily: F.ui,
          fontSize: 14,
          padding: '14px 32px',
          background: C.ember,
          border: 'none',
          borderRadius: 6,
          color: C.bone,
          cursor: 'pointer',
          fontWeight: 600,
        }}>
          Start Free Trial
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px',
        borderTop: `1px solid ${C.border}`,
        textAlign: 'center',
        color: C.bone40,
        fontSize: 12,
      }}>
        <p style={{ margin: 0 }}>© 2026 Project Focus. Built for deep work.</p>
      </footer>
    </div>
  );
}
