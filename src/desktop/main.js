'use strict';

/**
 * Electron main process for Project Focus desktop app.
 *
 * Responsibilities:
 * - Open browser window pointing at the Vite dev server (localhost:5173)
 * - Spawn the Express API server (index.js) as a child process
 * - Spawn the PC agent (src/agent/windows-monitor.js) as a child process
 * - Listen for IPC messages from the agent to show distraction popup windows
 */

const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Single-instance lock — prevents port conflicts when user launches twice
// ---------------------------------------------------------------------------
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Desktop] Another instance is already running. Exiting.');
  app.quit();
  process.exit(0);
}
app.on('second-instance', () => {
  // Focus the existing window if user tries to launch a second instance
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const IS_PACKAGED = app.isPackaged;
const PROD_WEB_URL = 'https://project-focus-mo3i.onrender.com';
const DEV_WEB_URL = 'http://localhost:5173';  // Vite dev server port
const WEB_URL = IS_PACKAGED ? PROD_WEB_URL : DEV_WEB_URL;
// Note: App.jsx automatically shows Dashboard if logged in, Landing if not
const API_PORT = 3000;
const ROOT_DIR = IS_PACKAGED
  ? path.join(process.resourcesPath, 'app')
  : path.resolve(__dirname, '../..');

let mainWindow = null;
let popupWindow = null;
let apiProcess = null;
let agentProcess = null;
let snoozeUntil = 0;  // Unix timestamp when snooze expires

// ---------------------------------------------------------------------------
// Helper: wait until a local port is accepting connections
// ---------------------------------------------------------------------------
function waitForPort(port, timeoutMs = 30000) {
  const net = require('net');
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function attempt() {
      const sock = new net.Socket();
      sock.setTimeout(500);
      sock.on('connect', () => { sock.destroy(); resolve(); });
      sock.on('error', () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error(`Port ${port} not ready`));
        setTimeout(attempt, 300);
      });
      sock.on('timeout', () => {
        sock.destroy();
        setTimeout(attempt, 300);
      });
      sock.connect(port, '127.0.0.1');
    }
    attempt();
  });
}

// ---------------------------------------------------------------------------
// Spawn API server
// ---------------------------------------------------------------------------
function startApiServer() {
  const entryPoint = path.join(ROOT_DIR, 'index.js');
  if (!fs.existsSync(entryPoint)) {
    console.error('[Desktop] index.js not found at', entryPoint);
    return;
  }

  apiProcess = spawn('node', [entryPoint], {
    cwd: ROOT_DIR,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  apiProcess.stdout.on('data', (d) => {
    try {
      process.stdout.write('[API] ' + d);
    } catch (err) {
      // Ignore write errors (stdout may be closed)
    }
  });
  apiProcess.stderr.on('data', (d) => {
    try {
      process.stderr.write('[API:ERR] ' + d);
    } catch (err) {
      // Ignore write errors (stderr may be closed)
    }
  });
  apiProcess.on('error', (err) => {
    console.error('[Desktop] API process error:', err.message);
  });
  apiProcess.on('exit', (code) => console.log(`[Desktop] API server exited (code=${code})`));
  console.log('[Desktop] API server spawned (pid=' + apiProcess.pid + ')');
}

// ---------------------------------------------------------------------------
// Spawn PC agent
// In production: uses Electron's utilityProcess (no external node.exe needed)
// In dev: spawns external node process
// ---------------------------------------------------------------------------
function startAgent() {
  const agentPath = path.join(ROOT_DIR, 'src/agent/windows-monitor.js');
  if (!fs.existsSync(agentPath)) {
    console.error('[Desktop] windows-monitor.js not found at', agentPath);
    return;
  }

  const agentEnv = {
    ...process.env,
    ELECTRON_IPC: '1',
    SERVER_BASE_URL: IS_PACKAGED
      ? 'https://project-focus-mo3i.onrender.com'
      : (process.env.SERVER_BASE_URL || 'http://localhost:3000'),
  };

  if (IS_PACKAGED) {
    // Production: use Electron's built-in Node.js via utilityProcess
    const { utilityProcess } = require('electron');
    agentProcess = utilityProcess.fork(agentPath, [], {
      env: agentEnv,
      serviceName: 'Project Focus Agent',
      stdio: 'pipe',
    });
    agentProcess.stdout.on('data', (d) => {
      try { process.stdout.write('[Agent] ' + d); } catch {}
    });
    agentProcess.stderr.on('data', (d) => {
      try { process.stderr.write('[Agent:ERR] ' + d); } catch {}
    });
    agentProcess.on('exit', (code) => console.log(`[Desktop] Agent exited (code=${code})`));
    console.log('[Desktop] PC agent started via utilityProcess');
  } else {
    // Dev: spawn as external node process
    agentProcess = spawn('node', [agentPath], {
      cwd: ROOT_DIR,
      env: agentEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    agentProcess.stdout.on('data', (d) => {
      try { process.stdout.write('[Agent] ' + d); } catch {}
    });
    agentProcess.stderr.on('data', (d) => {
      try { process.stderr.write('[Agent:ERR] ' + d); } catch {}
    });
    agentProcess.on('error', (err) => console.error('[Desktop] Agent error:', err.message));
    agentProcess.on('exit', (code) => console.log(`[Desktop] Agent exited (code=${code})`));
    console.log('[Desktop] PC agent spawned (pid=' + agentProcess.pid + ')');
  }
}

// ---------------------------------------------------------------------------
// Create main window
// ---------------------------------------------------------------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Project Focus',
    icon: path.join(__dirname, 'icon.svg'),
    backgroundColor: '#F4F3EF',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  // Add ?mode=desktop so React knows it's running inside Electron
  const loadURL = WEB_URL.includes('?') ? `${WEB_URL}&mode=desktop` : `${WEB_URL}?mode=desktop`;
  mainWindow.loadURL(loadURL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Desktop] Main window shown');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in dev mode (or when not packaged)
  if (!IS_PACKAGED) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// ---------------------------------------------------------------------------
// Detect site name from window title
// ---------------------------------------------------------------------------
function detectSiteName(windowTitle, displayMode = false) {
  const title = (windowTitle || '').toLowerCase();
  const siteMap = {
    reddit: 'Reddit',
    youtube: 'YouTube',
    twitter: 'Twitter',
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  };

  for (const [keyword, name] of Object.entries(siteMap)) {
    if (title.includes(keyword)) {
      return name;
    }
  }

  return displayMode ? 'This site' : (windowTitle || 'Unknown');
}

// ---------------------------------------------------------------------------
// Get random video from KOR Video/vertical folder (max 4 videos for non-YouTube)
// ---------------------------------------------------------------------------
function getRandomVideo(maxVideos = null) {
  try {
    const videoDir = path.join(app.getPath('userData'), '..', '..', 'Project Focus', 'KOR Video', 'vertical');
    const fs = require('fs');

    if (!fs.existsSync(videoDir)) {
      console.log('[Desktop] Video directory not found:', videoDir);
      return null;
    }

    const files = fs.readdirSync(videoDir).filter(f => /\.(mp4|webm|mov|mkv)$/i.test(f));

    if (files.length === 0) {
      console.log('[Desktop] No video files found in:', videoDir);
      return null;
    }

    // Limit to maxVideos if specified
    const availableFiles = maxVideos && files.length > maxVideos ? files.slice(0, maxVideos) : files;
    const randomFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
    return path.join(videoDir, randomFile);
  } catch (err) {
    console.error('[Desktop] Error selecting random video:', err.message);
    return null;
  }
}

// Distraction popup window
// ---------------------------------------------------------------------------
function showDistractionPopup({ distractedMinutes, windowTitle }) {
  // Check if snooze is active
  if (Date.now() < snoozeUntil) {
    return;  // Skip popup while snooze is active
  }

  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.focus();
    return;
  }

  // Detect site and select appropriate video
  const isYouTube = (windowTitle || '').toLowerCase().includes('youtube');
  let videoPath = null;

  if (!isYouTube) {
    // For non-YouTube distractions: random from 4 videos
    videoPath = getRandomVideo(4);
  }
  // For YouTube: no video path (use the default YouTube Korea video from static server)

  // Popup size based on whether showing video
  const hasVideo = isYouTube || videoPath;
  const popupWidth = hasVideo ? 700 : 550;
  const popupHeight = hasVideo ? 600 : 220;

  // Get the display where the mouse cursor is located
  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = targetDisplay.workArea;

  // Calculate popup position to center it on the target display
  const popupX = displayX + Math.round((displayWidth - popupWidth) / 2);
  const popupY = displayY + Math.round((displayHeight - popupHeight) / 2);

  popupWindow = new BrowserWindow({
    width: popupWidth,
    height: popupHeight,
    x: popupX,
    y: popupY,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#0E0E0C',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'popup-preload.js'),
    },
  });

  // Log distraction to API
  const mins = Math.round(distractedMinutes);
  const site = detectSiteName(windowTitle, false);

  fetch('http://localhost:3000/api/distractions/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app: site, duration: mins }),
  }).catch((err) => {
    console.error('[Desktop] Failed to log distraction:', err.message);
  });

  // Load popup from file
  const displaySite = detectSiteName(windowTitle, true);

  // Note: isYouTube flag tells popup.html whether to use the YouTube video endpoint
  // If videoPath exists, it's a local file URL; otherwise for YouTube, use the HTTP endpoint
  let popupUrl = `file://${path.join(__dirname, 'popup.html')}?site=${encodeURIComponent(displaySite)}&mins=${mins}&isYouTube=${isYouTube}`;
  if (videoPath) {
    popupUrl += `&video=${encodeURIComponent(videoPath)}`;
  }
  popupWindow.loadURL(popupUrl);
  console.log(`[Desktop] Showing popup: isYouTube=${isYouTube}, videoPath=${videoPath ? 'yes' : 'no'}, site=${displaySite}`);
  popupWindow.setAlwaysOnTop(true, 'screen-saver');

  popupWindow.on('closed', () => {
    popupWindow = null;
  });

  // Auto-dismiss after 30s
  setTimeout(() => {
    if (popupWindow && !popupWindow.isDestroyed()) popupWindow.close();
  }, 30000);
}

// ---------------------------------------------------------------------------
// IPC Electron: communicate with renderer (web) process
// ---------------------------------------------------------------------------
function setupElectronIPC() {
  // Receive task ID from renderer and send to agent
  ipcMain.on('set-active-task', (event, taskId) => {
    if (agentProcess && agentProcess.stdin && !agentProcess.stdin.destroyed) {
      agentProcess.stdin.write(`${taskId}\n`);
      console.log(`[Desktop] Sent task ID to agent: ${taskId}`);
    }
  });
}

// ---------------------------------------------------------------------------
// Static file server for video
// ---------------------------------------------------------------------------
function setupStaticServer() {
  const http = require('http');
  const server = http.createServer((req, res) => {
    // Serve video file
    if (req.url === '/video.mp4' || req.url.startsWith('/video.mp4?')) {
      const videoPath = path.join(ROOT_DIR, '20260427 Youtube Korea.mp4');
      if (!fs.existsSync(videoPath)) {
        res.writeHead(404);
        res.end('Video not found');
        return;
      }

      const stat = fs.statSync(videoPath);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
      });
      fs.createReadStream(videoPath).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn('[Desktop] Static server port 3002 already in use — popup videos may not work');
    } else {
      console.error('[Desktop] Static server error:', err.message);
    }
  });
  server.listen(3002, '127.0.0.1', () => {
    console.log('[Desktop] Static server listening on http://127.0.0.1:3002');
  });
}

// ---------------------------------------------------------------------------
// IPC: agent sends distraction events via HTTP to a local IPC endpoint
// We expose a small HTTP listener on port 3001 for the agent process
// ---------------------------------------------------------------------------
function startIpcServer() {
  const http = require('http');
  const MAX_BODY_SIZE = 10 * 1024;
  const REQUEST_TIMEOUT = 5000;
  const server = http.createServer((req, res) => {
    req.setTimeout(REQUEST_TIMEOUT);
    req.on('timeout', () => {
      console.warn('[Desktop] IPC request timeout');
      res.writeHead(408);
      res.end('Request timeout');
      req.destroy();
    });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'POST' && req.url === '/popup') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > MAX_BODY_SIZE) {
          res.writeHead(413);
          res.end('Payload too large');
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          showDistractionPopup(payload);
        } catch (err) {
          console.error('[Desktop] /popup JSON parse error:', err.message);
          res.writeHead(400);
          res.end('Bad JSON');
        }
      });
      req.on('error', (err) => {
        console.error('[Desktop] /popup request error:', err.message);
      });
    } else if (req.method === 'POST' && req.url === '/action') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > MAX_BODY_SIZE) {
          res.writeHead(413);
          res.end('Payload too large');
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          console.log(`[Desktop] /action received: ${payload.action}, popupWindow exists: ${popupWindow !== null}`);

          // Close popup immediately (before sending response)
          let closedPopup = false;
          if (popupWindow && !popupWindow.isDestroyed()) {
            console.log('[Desktop] Destroying popup window immediately...');
            try {
              popupWindow.destroy();  // Use destroy instead of close for immediate effect
              closedPopup = true;
              console.log('[Desktop] Popup destroyed successfully');
            } catch (closeErr) {
              console.error('[Desktop] Error destroying popup:', closeErr.message);
            }
            popupWindow = null;
          } else {
            console.log('[Desktop] Popup not found or already destroyed');
          }

          // Send response
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, closed: closedPopup }));

          // Handle other actions
          const validActions = ['backToWork', 'snooze', 'dismiss'];
          if (validActions.includes(payload.action)) {
            if (payload.action === 'backToWork') {
              // Set grace period to prevent immediate re-alert (5 seconds)
              snoozeUntil = Date.now() + (5 * 1000);
              console.log('[Desktop] Grace period activated (5 seconds)');
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.focus();
                console.log('[Desktop] Main window focused');
              }
            } else if (payload.action === 'snooze') {
              // Dynamic snooze: limit to 1-120 minutes (default 5)
              const minutes = Math.max(1, Math.min(120, Number(payload.minutes) || 5));
              snoozeUntil = Date.now() + (minutes * 60 * 1000);
              console.log(`[Desktop] Snooze activated (${minutes}m) until ${new Date(snoozeUntil)}`);
            }
          } else if (payload.action) {
            console.warn(`[Desktop] Unknown action: ${payload.action}`);
          }
        } catch (err) {
          console.error('[Desktop] /action error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    } else if (req.method === 'POST' && req.url === '/set-task') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > MAX_BODY_SIZE) {
          res.writeHead(413);
          res.end('Payload too large');
          req.destroy();
        }
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const taskId = String(payload.taskId || '').slice(0, 100);
          if (!taskId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'taskId is required' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, taskId }));
          if (agentProcess && agentProcess.stdin && !agentProcess.stdin.destroyed) {
            agentProcess.stdin.write(`${taskId}\n`);
            console.log(`[Desktop] Set active task via IPC: ${taskId}`);
          }
        } catch (err) {
          console.error('[Desktop] /set-task error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      req.on('error', (err) => {
        console.error('[Desktop] /set-task request error:', err.message);
      });
      return;
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.on('error', (err) => {
    console.error('[Desktop] IPC server error:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error('[Desktop] Port 3001 is already in use. Trying port 3003...');
      server.listen(3003, '127.0.0.1', () => {
        console.log('[Desktop] IPC server listening on http://127.0.0.1:3003 (fallback)');
      });
    }
  });

  server.listen(3001, '127.0.0.1', () => {
    console.log('[Desktop] IPC server listening on http://127.0.0.1:3001');
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  console.log('[Desktop] App ready — starting services... (packaged=' + IS_PACKAGED + ')');

  setupElectronIPC();
  setupStaticServer();
  startIpcServer();

  if (IS_PACKAGED) {
    // Production: no local API server (uses hosted render.com)
    // Start agent immediately
    startAgent();
    createMainWindow();
  } else {
    // Dev: start local API server and wait for Vite
    startApiServer();

    try {
      await waitForPort(API_PORT, 20000);
      console.log('[Desktop] API server is ready');
      startAgent();
    } catch (err) {
      console.warn('[Desktop] API server did not start in time:', err.message);
      startAgent();
    }

    try {
      await waitForPort(5173, 30000);
      console.log('[Desktop] Vite dev server is ready');
    } catch {
      console.warn('[Desktop] Vite dev server not detected — loading anyway');
    }

    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  // On Windows/Linux, quit when all windows closed
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createMainWindow();
});

app.on('before-quit', () => {
  if (apiProcess) { apiProcess.kill(); apiProcess = null; }
  if (agentProcess) { agentProcess.kill(); agentProcess = null; }
});
