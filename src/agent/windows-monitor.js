'use strict';

require('dotenv').config();
const { execSync } = require('child_process');
const axios = require('axios');
const notifier = require('node-notifier');
const path = require('path');
const fs = require('fs');
const os = require('os');

const POLL_INTERVAL_MS = parseInt(process.env.AGENT_POLL_INTERVAL_MS, 10) || 500;
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3000';

// =============================================================================
// Distraction Detection — Hybrid Approach (Process + Title Keywords)
// =============================================================================

// Apps that are inherently distracting (detected by process name)
// Note: These are matched case-insensitively as substrings
const DISTRACTION_APPS = [
  'telegram',
  'discord',
  'kakao',
  'slack',
  'whatsapp',
  'viber',
  'skype',
  'line',
  'messenger',
  'teams',
  'zoom',
];

// Website/content keywords (for browsers: chrome, firefox, edge, etc.)
const DISTRACTION_KEYWORDS = [
  // 동영상/스트리밍
  'youtube',
  'netflix',
  'twitch',
  'tiktok',

  // 소셜미디어
  'reddit',
  'twitter',
  'facebook',
  'instagram',
  'x.com',
  'threads',

  // 커뮤니티
  'dcinside',
  'dc.naver',
  '인벤',
  '루리웹',
  '뽐뿌',
  '오늘의유머',
  '유머',
  '네이버카페',
  '카페',

  // 쇼핑
  'coupang',
  'amazon',
  'ebay',
  '쿠팡',
  '배민',
  '당근마켓',
  'shopping',

  // 뉴스/스포츠
  'naver sports',
  'sports',
  'espn',
  'news',

  // 블로그
  'naver blog',
  'blog',
  'medium',

  // 게임
  'steam',
  'game',
  'playstation',
  'xbox',
  '게임',
  'roblox',

  // 기타
  '나무위키',
  '에브리타임',
  'wikipedia',
  'wiki',
];

// How many seconds of distraction before we send an alert
const DISTRACTION_ALERT_THRESHOLD_SEC = 2; // 2 seconds

// =============================================================================
// Get active window title using PowerShell via temporary script file
// =============================================================================

const PS_SCRIPT_CONTENT = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
}
"@
$handle = [Win32]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 256
[Win32]::GetWindowText($handle, $sb, 256) | Out-Null
$sb.ToString()`;

/**
 * Get the currently focused window title via PowerShell.
 * Uses temporary script file for reliable execution.
 * Returns empty string on any error.
 */
function getActiveWindowTitle() {
  const crypto = require('crypto');
  try {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `ps-window-${crypto.randomBytes(4).toString('hex')}.ps1`);

    // Write script using UTF-8 encoding
    fs.writeFileSync(tempFile, PS_SCRIPT_CONTENT, 'utf8');

    try {
      const result = execSync(
        `powershell -NoProfile -NonInteractive -File "${tempFile.replace(/"/g, '\\"')}" 2>&1`,
        {
          encoding: 'utf8',
          timeout: 1500,
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      const title = result.trim();
      if (!title) {
        console.log('[Agent] WARNING: getActiveWindowTitle returned empty string');
      }
      return title;
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (err) {
    console.error('[Agent] getActiveWindowTitle error:', err.message);
    return '';
  }
}

const PS_PROCESS_SCRIPT = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32Process {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]
  public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int lpdwProcessId);
}
"@

\$h = [Win32Process]::GetForegroundWindow()
\$p = 0
[Win32Process]::GetWindowThreadProcessId(\$h, [ref]\$p) | Out-Null
\$proc = Get-Process -Id \$p -ErrorAction SilentlyContinue
if (\$proc) {
  \$proc.Name
}`;

/**
 * Get the executable name of the active window's process.
 * Uses temporary script file with P/Invoke.
 * Returns process name like "chrome", "kakaotalk", etc.
 * Returns empty string on error.
 */
function getActiveProcessName() {
  const crypto = require('crypto');
  try {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `ps-process-${crypto.randomBytes(4).toString('hex')}.ps1`);

    // Write script using UTF-8 encoding
    fs.writeFileSync(tempFile, PS_PROCESS_SCRIPT, 'utf8');

    try {
      const result = execSync(
        `powershell -NoProfile -NonInteractive -File "${tempFile.replace(/"/g, '\\"')}" 2>&1`,
        {
          encoding: 'utf8',
          timeout: 1500,
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      const processName = result.trim().toLowerCase();
      if (processName && processName.length > 0) {
        return processName.endsWith('.exe') ? processName : `${processName}.exe`;
      }
      return '';
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (err) {
    console.error('[Agent] getActiveProcessName error:', err.message);
    return '';
  }
}

/**
 * Hybrid distraction detection: Process-based + Title-based
 *
 * Returns true if:
 * 1. Process name matches DISTRACTION_APPS (e.g., telegram.exe, kakaotalk.exe)
 * 2. OR window title contains any DISTRACTION_KEYWORDS (for browsers, etc.)
 */
function isDistractionHybrid(title, processName) {
  if (!title) {
    console.log('[Agent] isDistraction: title is empty/null');
    return false;
  }

  // Check 1: Process-based distraction (messaging apps, etc.)
  if (processName) {
    const procLower = processName.toLowerCase();
    const processMatch = DISTRACTION_APPS.some((app) => procLower.includes(app));
    if (processMatch) {
      const matchedApp = DISTRACTION_APPS.find((app) => procLower.includes(app));
      console.log(`[Agent] isDistraction: PROCESS MATCH - app="${matchedApp}" in process="${processName}"`);
      return true;
    }
  }

  // Check 2: Title-based distraction (websites in browser)
  const titleLower = title.toLowerCase();
  const titleMatch = DISTRACTION_KEYWORDS.some((kw) => titleLower.includes(kw));
  if (titleMatch) {
    const matchedKw = DISTRACTION_KEYWORDS.find((kw) => titleLower.includes(kw));
    console.log(`[Agent] isDistraction: TITLE MATCH - keyword="${matchedKw}" in title="${title}"`);
    return true;
  }

  return false;
}

/**
 * Legacy function for backward compatibility (title-only detection)
 */
function isDistraction(title) {
  // This now delegates to hybrid with empty process name
  return isDistractionHybrid(title, '');
}

// =============================================================================
// Session state
// =============================================================================
const state = {
  activeTaskId: null,
  taskStartTime: null,
  focusedSeconds: 0,
  distractedSeconds: 0,
  distractedConsecutiveSec: 0,
  lastWindowTitle: '',
  lastLoggedTitle: null,
  lastLogTime: Date.now(),
  alertedForDelay: false,
};

// How often to POST session data to server (milliseconds)
const LOG_INTERVAL_MS = 30 * 1000; // 30 seconds

// Electron IPC server URL (only active when run inside Electron desktop)
const ELECTRON_IPC_URL = 'http://127.0.0.1:3001';
const IN_ELECTRON = !!process.env.ELECTRON_IPC;

/**
 * Show distraction popup via Electron IPC server, or fall back to node-notifier.
 */
function showDistractionAlert(distractedMinutes, windowTitle) {
  console.log(`[Agent] showDistractionAlert called: IN_ELECTRON=${IN_ELECTRON}, minutes=${distractedMinutes.toFixed(1)}, title="${windowTitle}"`);

  if (IN_ELECTRON) {
    console.log(`[Agent] Sending POST to ${ELECTRON_IPC_URL}/popup`);
    axios.post(`${ELECTRON_IPC_URL}/popup`, {
      distractedMinutes,
      windowTitle,
    }).then((res) => {
      console.log('[Agent] Popup sent successfully to Electron:', res.status);
    }).catch((err) => {
      console.error('[Agent] Failed to send popup to Electron:', err.message);
      // Fallback to notifier only if Electron IPC fails
      notifier.notify({
        title: 'Project Focus — 집중 이탈',
        message: `${Math.round(distractedMinutes)}분째 딴짓 중: ${windowTitle.slice(0, 50)}`,
        sound: false,
        wait: false,
      });
    });
  } else {
    // Fallback: use node-notifier when not in Electron
    console.log('[Agent] Using node-notifier (not in Electron)');
    notifier.notify({
      title: 'Project Focus — 집중 이탈',
      message: `${Math.round(distractedMinutes)}분째 딴짓 중: ${windowTitle.slice(0, 50)}`,
      sound: false,
      wait: false,
    });
  }
}

/**
 * Send desktop notification using node-notifier (for non-distraction alerts).
 */
function showNotification(title, message) {
  if (IN_ELECTRON) {
    // Non-critical notifications: just log in Electron context
    console.log(`[Agent] Notification: ${title} — ${message}`);
  } else {
    notifier.notify({
      title,
      message,
      icon: path.join(__dirname, '../../src/web/public/favicon.ico'),
      sound: false,
      wait: false,
    });
  }
}

/**
 * Post accumulated session data to the server.
 */
async function flushSession() {
  if (!state.activeTaskId) return;

  const focusedMinutes = state.focusedSeconds / 60;
  const distractedMinutes = state.distractedSeconds / 60;

  if (focusedMinutes < 0.1 && distractedMinutes < 0.1) return;

  try {
    const response = await axios.post(`${SERVER_BASE_URL}/api/session/log`, {
      taskId: state.activeTaskId,
      focusedMinutes: parseFloat(focusedMinutes.toFixed(2)),
      distractedMinutes: parseFloat(distractedMinutes.toFixed(2)),
      windowTitle: state.lastWindowTitle,
    });

    const data = response.data;

    // Check if behind schedule
    if (data.expected && data.expected.expectedRatio > 0) {
      const actualPct = data.progressPct;
      const expectedPct = Math.round(data.expected.expectedRatio * 100);

      if (actualPct < expectedPct - 15 && !state.alertedForDelay) {
        const behindBy = expectedPct - actualPct;
        showNotification(
          'Project Focus — 진도 지연',
          `예상보다 ${behindBy}% 뒤처지고 있습니다. 집중이 필요합니다!`
        );
        state.alertedForDelay = true;
      } else if (actualPct >= expectedPct - 5) {
        state.alertedForDelay = false;
      }
    }

    // Reset counters after successful flush (they accumulate from zero again)
    state.focusedSeconds = 0;
    state.distractedSeconds = 0;

    console.log(`[Agent] Session flushed — task=${state.activeTaskId} focused=${focusedMinutes.toFixed(1)}m distracted=${distractedMinutes.toFixed(1)}m progress=${data.progressPct}%`);
  } catch (err) {
    console.error('[Agent] Failed to flush session:', err.message);
  }
}

/**
 * Main polling tick — runs every POLL_INTERVAL_MS.
 * Uses hybrid distraction detection (process + title).
 */
function tick() {
  const title = getActiveWindowTitle();
  const processName = getActiveProcessName();
  state.lastWindowTitle = title;

  const pollSec = POLL_INTERVAL_MS / 1000;

  // Debug: log window title every 10 seconds if it changes
  if (title !== state.lastLoggedTitle) {
    state.lastLoggedTitle = title;
    console.log(`[Agent] Window title changed: "${title}" (process: ${processName || 'unknown'})`);
  }

  if (isDistractionHybrid(title, processName)) {
    state.distractedSeconds += pollSec;
    state.distractedConsecutiveSec += pollSec;

    // Log every 5 seconds while distracted (for debugging)
    if (state.activeTaskId && Math.round(state.distractedConsecutiveSec * 10) % 50 === 0) {
      console.log(`[Agent] DISTRACTED on task "${state.activeTaskId}": "${title}" (${state.distractedConsecutiveSec.toFixed(1)}s/${DISTRACTION_ALERT_THRESHOLD_SEC}s)`);
    }

    // Alert after threshold of continuous distraction
    if (state.distractedConsecutiveSec >= DISTRACTION_ALERT_THRESHOLD_SEC) {
      console.log(`[Agent] *** ALERT THRESHOLD REACHED: ${state.distractedConsecutiveSec.toFixed(1)}s on "${title}" ***`);
      showDistractionAlert(state.distractedConsecutiveSec / 60, title);
      // Reset so we don't spam
      state.distractedConsecutiveSec = 0;
    }
  } else {
    if (state.distractedConsecutiveSec > 0) {
      console.log(`[Agent] Focus regained: "${title}" (was distracted for ${state.distractedConsecutiveSec.toFixed(1)}s)`);
    }
    state.focusedSeconds += pollSec;
    state.distractedConsecutiveSec = 0;
  }

  // Flush to server periodically
  const now = Date.now();
  if (now - state.lastLogTime >= LOG_INTERVAL_MS) {
    state.lastLogTime = now;
    flushSession().catch((err) => {
      console.error(`[Agent] Failed to flush session: ${err.message}`);
    });
  }
}

/**
 * Set the currently active task for tracking.
 *
 * @param {string} taskId
 */
function setActiveTask(taskId) {
  if (state.activeTaskId && state.activeTaskId !== taskId) {
    // Flush previous task before switching
    flushSession().catch((err) => {
      console.error(`[Agent] Failed to flush previous task: ${err.message}`);
    });
  }
  state.activeTaskId = taskId;
  state.taskStartTime = Date.now();
  state.focusedSeconds = 0;
  state.distractedSeconds = 0;
  state.distractedConsecutiveSec = 0;
  state.alertedForDelay = false;
  console.log(`[Agent] Active task set: ${taskId}`);
}

/**
 * Stop tracking the current task.
 */
async function stopTracking() {
  await flushSession();
  state.activeTaskId = null;
  state.taskStartTime = null;
  console.log('[Agent] Tracking stopped');
}

/**
 * Start the polling loop.
 */
function start() {
  console.log(`[Agent] Windows monitor starting (poll=${POLL_INTERVAL_MS}ms, server=${SERVER_BASE_URL})`);

  // Check if a task ID was passed as CLI argument
  const cliTaskId = process.argv[2];
  if (cliTaskId) {
    setActiveTask(cliTaskId);
    console.log(`[Agent] Tracking task from CLI: ${cliTaskId}`);
  } else {
    console.log('[Agent] No task ID specified. Call setActiveTask(id) or pass task ID as CLI argument.');
  }

  // Listen for stdin input to set active task (e.g., from UI)
  console.log(`[Agent] stdin.isTTY = ${process.stdin.isTTY}`);
  if (process.stdin.isTTY !== true) {  // Not a TTY (piped or inherited)
    try {
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (data) => {
        const taskId = data.toString().trim();
        if (taskId && taskId.length > 0) {
          console.log(`[Agent] stdin: setting task ${taskId}`);
          setActiveTask(taskId);
        }
      });
      console.log(`[Agent] stdin listener ready`);
    } catch (e) {
      console.error(`[Agent] stdin setup failed:`, e.message);
    }
  }

  console.log(`[Agent] Starting polling loop with setInterval(tick, ${POLL_INTERVAL_MS}ms)...`);
  const pollInterval = setInterval(tick, POLL_INTERVAL_MS);
  console.log(`[Agent] *** POLLING LOOP STARTED ***`);

  // Log tick execution every 5 seconds for debugging
  let tickCount = 0;
  const tickMonitor = setInterval(() => {
    tickCount++;
    console.log(`[Agent] Tick monitor: ${tickCount} ticks executed, activeTask=${state.activeTaskId || 'NONE'}, focused=${state.focusedSeconds.toFixed(1)}s, distracted=${state.distractedSeconds.toFixed(1)}s`);
  }, 5000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[Agent] Shutting down...');
    clearInterval(pollInterval);
    clearInterval(tickMonitor);
    await stopTracking();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('[Agent] Uncaught exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Agent] Unhandled rejection:', reason);
  });
}

// Run if called directly
if (require.main === module) {
  start();
}

module.exports = {
  start,
  setActiveTask,
  stopTracking,
  isDistraction,
  isDistractionHybrid,
  getActiveWindowTitle,
  getActiveProcessName,
  DISTRACTION_APPS,
  DISTRACTION_KEYWORDS,
};
