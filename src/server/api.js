'use strict';

// Clear require cache to ensure fresh load
delete require.cache[require.resolve('../llm/estimator')];

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { parseTask, estimateProgress } = require('../llm/estimator');
const {
  createTask,
  getTodayTasks,
  getTasksByUser,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskProgress,
  logSession,
  getTaskSessionTotals,
  createRawTaskRequest,
  incrementUserStats,
  getAdminStats,
  recordComplaint,
  getComplaints,
  ensureIndexes,
  signUpUser,
  ensureUser,
  checkSubscriptionStatus,
  upgradeToPaid,
  db,
  auth,
} = require('../db/firebase');

const router = express.Router();

// =============================================================================
// In-memory distraction log storage
// =============================================================================
const distractionsLog = {};

// =============================================================================
// Middleware
// =============================================================================

console.log('[API] Router initialization starting');

// Admin secret — must be set via environment variable (min 32 chars, cryptographically random)
const ADMIN_SECRET = process.env.ADMIN_SECRET;
if (!ADMIN_SECRET || ADMIN_SECRET.length < 32) {
  console.error('[API] CRITICAL: ADMIN_SECRET env var is missing or too short. Admin endpoints will be inaccessible.');
}

// Request logger
router.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.path} ${new Date().toISOString()}`);
  next();
});

console.log('[API] Router initialization complete');

// =============================================================================
// Auth Middleware — validate Firebase ID token
// =============================================================================
async function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.substring(7);
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error('[API] Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// =============================================================================
// Authentication Endpoints
// Auth is handled client-side via Firebase SDK.
// These endpoints sync the user doc to Firestore after client-side auth.
// =============================================================================

// Called after email/password signup (Firebase Auth user already created client-side)
// Requires valid Firebase ID token — uid is taken from verified token, not request body
router.post('/auth/signup', verifyAuth, async (req, res) => {
  const { displayName } = req.body;
  const { uid, email } = req.user;
  try {
    await signUpUser(uid, email, displayName || email.split('@')[0]);
    res.json({ success: true, userId: uid });
  } catch (err) {
    console.error('[API] /auth/signup error:', err);
    res.status(400).json({ error: 'Failed to complete signup' });
  }
});

// Called after any sign-in (email/password or Google) — upserts Firestore user doc
// Requires valid Firebase ID token — uid is taken from verified token, not request body
router.post('/auth/ensure-user', verifyAuth, async (req, res) => {
  const { displayName } = req.body;
  const { uid, email } = req.user;
  try {
    await ensureUser(uid, email, displayName || email.split('@')[0]);
    res.json({ success: true, userId: uid });
  } catch (err) {
    console.error('[API] /auth/ensure-user error:', err);
    res.status(400).json({ error: 'Failed to sync user' });
  }
});

// =============================================================================
// GET /api/subscription/status
// Check user's own subscription status — requires auth
// =============================================================================
router.get('/subscription/status', verifyAuth, async (req, res) => {
  const userId = req.user.uid;
  try {
    const status = await checkSubscriptionStatus(userId);
    res.json(status);
  } catch (err) {
    console.error('[API] /subscription/status error:', err);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// =============================================================================
// POST /api/subscription/upgrade
// Upgrade authenticated user to paid plan (called after successful payment verification)
// =============================================================================
router.post('/subscription/upgrade', verifyAuth, async (req, res) => {
  const userId = req.user.uid; // Always use authenticated user's UID — never trust body
  const { monthsToAdd } = req.body;

  try {
    const result = await upgradeToPaid(userId, monthsToAdd || 1);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[API] /subscription/upgrade error:', err);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// =============================================================================
// POST /api/task/parse
// Accepts a Telegram-style message text, runs Claude analysis, saves to Sheets
// =============================================================================
router.post('/task/parse', verifyAuth, async (req, res) => {
  const { text } = req.body;
  const userId = req.user.uid;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text field is required' });
  }

  if (text.trim().length > 2000) {
    return res.status(400).json({ error: 'text must be less than 2000 characters' });
  }

  try {
    const parsed = await parseTask(text.trim());
    const taskId = await createTask(parsed, userId);

    return res.json({
      taskId,
      task: parsed,
    });
  } catch (err) {
    console.error('[API] /task/parse error:', err);
    return res.status(500).json({ error: 'Failed to parse task' });
  }
});

// =============================================================================
// POST /api/task/create-multi-stage
// Create a raw task request from multi-stage form data + create placeholder task
// =============================================================================
router.post('/task/create-multi-stage', verifyAuth, async (req, res) => {
  const { formData } = req.body;
  const resolvedUserId = req.user.uid;

  if (!formData || typeof formData !== 'object') {
    return res.status(400).json({ error: 'formData object is required' });
  }

  try {
    console.log('[API] /task/create-multi-stage:', formData.title);
    const taskRequestId = await createRawTaskRequest(formData, resolvedUserId);

    // Also create a placeholder task so user sees it immediately
    // (status will be updated to 'pending' after AI planning)
    const placeholderTask = {
      title: formData.title || 'Untitled',
      deadline: formData.deadline || new Date().toISOString(),
      output: formData.output || '',
      estimatedHours: 0,
      confidence: 0,
      riskFactors: [],
      status: 'planning_review',
      milestones: [],
      taskRequestId: taskRequestId,
    };
    const taskId = await createTask(placeholderTask, resolvedUserId);

    return res.json({
      taskRequestId,
      taskId,
      status: 'pending_planning',
    });
  } catch (err) {
    console.error('[API] /task/create-multi-stage error:', err);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// =============================================================================
// GET /api/tasks
// Returns all tasks for the given userId (not just today)
// Excludes deleted tasks by default (use ?includedeleted=true to include)
// =============================================================================
router.get('/tasks', verifyAuth, async (req, res) => {
  const userId = req.user.uid;
  const includeDeleted = req.query.includedeleted === 'true';

  try {
    const tasks = await getTasksByUser(userId);
    const filtered = includeDeleted ? tasks : tasks.filter(t => t.status !== 'deleted');
    return res.json({ tasks: filtered });
  } catch (err) {
    console.error('[API] /tasks error:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// =============================================================================
// GET /api/tasks/today
// Returns all tasks with a deadline matching today for the given userId
// Excludes deleted tasks
// =============================================================================
router.get('/tasks/today', verifyAuth, async (req, res) => {
  const userId = req.user.uid;

  try {
    const tasks = await getTodayTasks(userId);
    const filtered = tasks.filter(t => t.status !== 'deleted');
    return res.json({ tasks: filtered });
  } catch (err) {
    console.error('[API] /tasks/today error:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// =============================================================================
// GET /api/task/:id
// Returns a single task by ID
// =============================================================================
router.get('/task/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const task = getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json({ task });
  } catch (err) {
    console.error(`[API] /task/${id} error:`, err);
    return res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// =============================================================================
// PUT /api/task/:id/update
// Update task details: title, deadline, progress, milestones, etc.
// =============================================================================
router.put('/task/:id/update', async (req, res) => {
  const { id } = req.params;
  const { title, deadline, estimatedHours, milestones, progress, status, output, priority } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    console.log(`[API] /task/${id}/update - looking for task`);
    const task = getTaskById(id);
    console.log(`[API] /task/${id}/update - task found:`, task ? 'YES' : 'NO');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Build updates object
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (deadline !== undefined) updates.deadline = deadline;
    if (estimatedHours !== undefined) updates.estimatedHours = estimatedHours;
    if (milestones !== undefined) updates.milestones = milestones;
    if (priority !== undefined) updates.priority = priority;
    if (progress !== undefined) updates.progress = progress;
    if (output !== undefined) updates.output = output;
    if (status !== undefined) {
      updates.status = status;
      const now = new Date().toISOString();
      if (status === 'in_progress' && !task.startedAt) updates.startedAt = now;
      if (status === 'completed') {
        if (!task.startedAt) updates.startedAt = now;
        updates.completedAt = now;
      }
      if (status === 'pending') updates.completedAt = null;
    }

    // Save updated task
    const updated = updateTask(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found during update' });
    }

    return res.json({ taskId: id, task: updated });
  } catch (err) {
    console.error(`[API] /task/${id}/update error:`, err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// =============================================================================
// POST /api/task/:id/delete
// Soft delete: move task to 'deleted' status instead of removing
// =============================================================================
router.post('/task/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    const task = getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Soft delete: store previous status and mark as deleted
    const updated = updateTask(id, {
      status: 'deleted',
      previousStatus: task.status,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Task not found during deletion' });
    }

    return res.json({ ok: true, taskId: id });
  } catch (err) {
    console.error(`[API] /task/${id}/delete error:`, err);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

// =============================================================================
// POST /api/task/:id/restore
// Restore a deleted task to its previous status
// =============================================================================
router.post('/task/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    const task = getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'deleted') {
      return res.status(400).json({ error: 'Task is not in deleted state' });
    }

    // Restore to previous status
    const previousStatus = task.previousStatus || 'pending';
    const updated = updateTask(id, {
      status: previousStatus,
      previousStatus: null,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Task not found during restore' });
    }

    return res.json({ ok: true, taskId: id, status: previousStatus });
  } catch (err) {
    console.error(`[API] /task/${id}/restore error:`, err);
    return res.status(500).json({ error: 'Failed to restore task' });
  }
});

// =============================================================================
// GET /api/task/:id/progress
// Returns current progress and milestone status for a task
// =============================================================================
router.get('/task/:id/progress', async (req, res) => {
  const { id } = req.params;

  try {
    const task = getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const totals = await getTaskSessionTotals(id);
    const progressInfo = estimateProgress(task, totals.focusedMinutes);

    return res.json({
      taskId: id,
      title: task.title,
      deadline: task.deadline,
      progress: task.progress,
      estimatedHours: task.estimatedHours,
      status: task.status,
      milestones: task.milestones,
      startedAt: task.startedAt || null,
      completedAt: task.completedAt || null,
      session: totals,
      expected: progressInfo,
    });
  } catch (err) {
    console.error(`[API] /task/${id}/progress error:`, err);
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// =============================================================================
// POST /api/session/log
// PC agent posts focus/distraction data; updates task progress
// =============================================================================
router.post('/session/log', async (req, res) => {
  const { taskId, focusedMinutes, distractedMinutes, windowTitle } = req.body;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ error: 'taskId is required and must be a string' });
  }

  const focused = Math.max(0, Number(focusedMinutes) || 0);
  const distracted = Math.max(0, Number(distractedMinutes) || 0);
  const title = String(windowTitle || '').slice(0, 500);

  if (focused + distracted > 1440) {
    return res.status(400).json({ error: 'Total time cannot exceed 24 hours' });
  }

  try {
    const task = await getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Log the session event
    const sessionId = await logSession({
      taskId,
      focusedMinutes: focused,
      distractedMinutes: distracted,
      windowTitle: title,
    });

    // Recalculate cumulative progress
    const totals = await getTaskSessionTotals(taskId);
    const progressInfo = estimateProgress(task, totals.focusedMinutes);

    // progress is percentage based on expected ratio
    const progressPct = Math.min(progressInfo.expectedRatio * 100, 100);
    const newStatus = progressPct >= 100 ? 'completed' : totals.focusedMinutes > 0 ? 'in_progress' : 'pending';

    await updateTaskProgress(taskId, progressPct, newStatus);

    return res.json({
      sessionId,
      taskId,
      progressPct: Math.round(progressPct),
      status: newStatus,
      totals,
      expected: progressInfo,
    });
  } catch (err) {
    console.error('[API] /session/log error:', err);
    return res.status(500).json({ error: 'Failed to log session' });
  }
});

// =============================================================================
// Test endpoints
// =============================================================================
router.get('/test-get', (_req, res) => {
  res.json({ message: 'GET test works' });
});

router.put('/test-put', (_req, res) => {
  res.json({ message: 'PUT test works' });
});

// Debug: simple PUT that should definitely work
router.put('/simple-put', (_req, res) => {
  res.json({ message: 'Simple PUT works', body: _req.body });
});

// =============================================================================
// POST /api/notification
// Send notification to Electron (Windows popup)
// =============================================================================
router.post('/notification', async (req, res) => {
  const { type, title, message, duration, action } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    // Forward to Electron IPC server on port 3001
    const http = require('http');
    const payload = JSON.stringify({
      type: type || 'alert',
      title: title || 'Focus Alert',
      message,
      distractedMinutes: duration || 0,
      windowTitle: action || '',
    });

    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: '/popup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const ipcReq = http.request(options, (ipcRes) => {
      let data = '';
      ipcRes.on('data', (chunk) => (data += chunk));
      ipcRes.on('end', () => {
        if (ipcRes.statusCode === 200) {
          res.json({ ok: true, sent: true });
        } else {
          res.status(500).json({ error: 'IPC server error' });
        }
      });
    });

    ipcReq.on('error', (err) => {
      console.error('[API] Notification IPC error:', err.message);
      res.status(503).json({ error: 'IPC server unavailable' });
    });

    ipcReq.write(payload);
    ipcReq.end();
  } catch (err) {
    console.error('[API] /notification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================================================
// Inspirational Quote (Local List - No API Cost)
// =============================================================================
const quotes = [
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Focus is the gateway to success. — Unknown",
  "Your focus determines your reality. — George Lucas",
  "The secret to getting ahead is getting started. — Mark Twain",
  "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "The future depends on what you do today. — Mahatma Gandhi",
  "Great things never came from comfort zones. — Unknown",
  "Discipline is choosing what you want most over what you want now. — Unknown",
  "Success usually comes to those who are too busy to be looking for it. — Henry David Thoreau",
];

router.get('/quote', (_req, res) => {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  // Parse "text — Author" format
  const match = randomQuote.match(/^(.+?)\s*—\s*(.+)$/);
  if (match) {
    res.json({
      quote: match[1].trim(),
      author: match[2].trim()
    });
  } else {
    res.json({
      quote: randomQuote,
      author: 'Unknown'
    });
  }
});

// =============================================================================
// Distraction logging (from PC agent)
// =============================================================================
router.post('/distractions/log', (req, res) => {
  const { app, duration } = req.body;
  if (!app || duration === undefined) {
    return res.status(400).json({ error: 'app and duration required' });
  }

  const today = new Date().toDateString();
  if (!distractionsLog[today]) {
    distractionsLog[today] = [];
  }

  distractionsLog[today].push({
    app,
    duration: Number(duration),
    timestamp: Date.now(),
  });

  console.log(`[API] Logged distraction: ${app} ${duration}m`);
  res.json({ ok: true });
});

router.get('/distractions/today', (_req, res) => {
  const today = new Date().toDateString();
  const items = distractionsLog[today] || [];

  // Aggregate by app name
  const aggregated = {};
  items.forEach(item => {
    aggregated[item.app] = (aggregated[item.app] || 0) + item.duration;
  });

  res.json({
    date: today,
    distractions: aggregated,
    total: items.length,
  });
});

// =============================================================================
// Admin endpoints
// =============================================================================
function verifyAdminSecret(req, res) {
  if (!ADMIN_SECRET) {
    res.status(503).json({ error: 'Admin endpoint not configured' });
    return false;
  }
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/admin/stats', async (req, res) => {
  if (!verifyAdminSecret(req, res)) return;
  try {
    const { db } = require('../db/firebase');
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(d => d.data());

    const now = new Date();
    const paid = users.filter(u => u.subscriptionStatus === 'paid' && u.paidUntil && new Date(u.paidUntil) > now);
    const trial = users.filter(u => u.subscriptionStatus !== 'paid' && u.freeTrialEndsAt && new Date(u.freeTrialEndsAt) > now);
    const expired = users.filter(u => {
      const trialEnd = u.freeTrialEndsAt ? new Date(u.freeTrialEndsAt) : null;
      const paidEnd = u.paidUntil ? new Date(u.paidUntil) : null;
      return (!trialEnd || trialEnd < now) && (!paidEnd || paidEnd < now);
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newUsers = users.filter(u => u.createdAt && u.createdAt > sevenDaysAgo);

    res.json({
      totalUsers: users.length,
      paidUsers: paid.length,
      trialUsers: trial.length,
      expiredUsers: expired.length,
      newUsersLast7Days: newUsers.length,
      estimatedMRR: paid.length * 9900,
    });
  } catch (err) {
    console.error('[API] /admin/stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users - full user list
router.get('/admin/users', async (req, res) => {
  if (!verifyAdminSecret(req, res)) return;
  try {
    const { db } = require('../db/firebase');
    const snap = await db.collection('users').get();
    const users = snap.docs.map(doc => {
      const d = doc.data();
      return {
        uid: d.uid,
        email: d.email,
        displayName: d.displayName,
        createdAt: d.createdAt,
        subscriptionStatus: d.subscriptionStatus || 'free',
        freeTrialEndsAt: d.freeTrialEndsAt,
        paidUntil: d.paidUntil,
        tasksCreated: d.tasksCreated || 0,
        tasksCompleted: d.tasksCompleted || 0,
      };
    });
    users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json({ users, total: users.length });
  } catch (err) {
    console.error('[API] /admin/users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:uid/subscription - change subscription status
router.post('/admin/users/:uid/subscription', async (req, res) => {
  if (!verifyAdminSecret(req, res)) return;
  const { uid } = req.params;
  const { status, monthsToAdd } = req.body;
  try {
    const { db } = require('../db/firebase');
    if (status === 'paid') {
      const paidUntil = new Date();
      paidUntil.setMonth(paidUntil.getMonth() + (monthsToAdd || 1));
      await db.collection('users').doc(uid).update({
        subscriptionStatus: 'paid',
        paidUntil: paidUntil.toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.json({ success: true, paidUntil: paidUntil.toISOString() });
    } else if (status === 'trial_reset') {
      const freeTrialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      await db.collection('users').doc(uid).update({
        subscriptionStatus: 'free',
        freeTrialEndsAt: freeTrialEndsAt.toISOString(),
        paidUntil: null,
        updatedAt: new Date().toISOString(),
      });
      res.json({ success: true, freeTrialEndsAt: freeTrialEndsAt.toISOString() });
    } else {
      await db.collection('users').doc(uid).update({
        subscriptionStatus: 'free',
        updatedAt: new Date().toISOString(),
      });
      res.json({ success: true });
    }
  } catch (err) {
    console.error('[API] /admin/users/:uid/subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/complaints', async (req, res) => {
  if (!verifyAdminSecret(req, res)) return;
  try {
    const complaints = await getComplaints();
    res.json({ complaints });
  } catch (err) {
    console.error('[API] /admin/complaints error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/complaint', async (req, res) => {
  const { userId, complaint } = req.body;

  if (!complaint || typeof complaint !== 'string') {
    return res.status(400).json({ error: 'complaint text is required' });
  }

  try {
    const { recordComplaint } = require('../db/firebase');
    const complaintId = await recordComplaint(userId || 'anonymous', complaint);
    res.json({ ok: true, complaintId });
  } catch (err) {
    console.error('[API] /complaint error:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// =============================================================================
// Health check
// =============================================================================
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// =============================================================================
// Express app factory
// =============================================================================
async function createApp() {
  const app = express();

  // Initialize Firebase indexes
  await ensureIndexes();

  // Rate limiting — global
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

  // Stricter rate limit for AI-powered endpoints (cost protection)
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many AI requests, please wait a moment' },
  });

  app.use('/api', globalLimiter);
  app.use('/api/task/parse', aiLimiter);

  // Middleware ordering is important
  app.use(express.json({ limit: '1mb' }));
  app.use(cors({
    origin: [
      'https://project-focus-mo3i.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com;"
    );
    next();
  });

  // API routes
  app.use('/api', router);

  // Serve React frontend static files
  const distPath = path.join(__dirname, '../../src/web/dist');
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Global error handler (must be last)
  app.use((err, _req, res, _next) => {
    console.error('[API] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp, router };
