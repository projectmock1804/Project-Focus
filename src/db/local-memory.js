'use strict';

/**
 * Local JSON file-based database — drop-in replacement for sheets.js
 * Stores data in ./data/tasks.json and ./data/sessions.json
 * Data persists across server restarts.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.resolve(__dirname, '../../data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const TASK_REQUESTS_FILE = path.join(DATA_DIR, 'task-requests.json');

// Atomic write locks to prevent concurrent corruption
const writeLocks = new Map();

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  ensureDataDir();
  const tempFile = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, filePath);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

function readTasks() {
  return readJSON(TASKS_FILE, []);
}

function writeTasks(tasks) {
  writeJSON(TASKS_FILE, tasks);
}

/**
 * Update an existing task with new data.
 * @param {string} taskId
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated task or null if not found
 */
function updateTask(taskId, updates) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx < 0) return null;

  const task = tasks[idx];
  Object.assign(task, updates);
  task.updatedAt = new Date().toISOString();

  writeTasks(tasks);
  return task;
}

/**
 * Create a new task.
 * @param {Object} task - Parsed task from Gemini
 * @param {string} userId
 * @returns {string} taskId
 */
function createTask(task, userId) {
  const tasks = readTasks();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const milestones = (task.milestones || []).map(m => ({
    ...m,
    startedAt: null,
    completedAt: null,
    deadline: m.deadline || null,
  }));

  // Calculate priority based on existing tasks (auto-increment)
  const maxPriority = tasks.length > 0 ? Math.max(...tasks.map(t => t.priority ?? 0)) : 0;

  const newTask = {
    id,
    userId: String(userId),
    title: task.title,
    deadline: task.deadline,
    output: task.output || '',
    progress: 0,
    estimatedHours: task.estimatedHours,
    confidence: task.confidence || 0,
    riskFactors: task.riskFactors || [],
    status: 'pending',
    priority: maxPriority + 1,
    milestones,
    startedAt: null,
    completedAt: null,
    createdAt: now,
  };

  tasks.push(newTask);
  writeTasks(tasks);
  return id;
}

/**
 * Get all tasks for a user.
 */
function getTasksByUser(userId) {
  const tasks = readTasks();
  return tasks.filter((t) => t.userId === String(userId));
}

/**
 * Get tasks for today (deadline date matches today in local time).
 */
function getTodayTasks(userId) {
  const tasks = getTasksByUser(userId);
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter((t) => {
    if (!t.deadline) return false;
    return t.deadline.startsWith(today);
  });
}

/**
 * Get a single task by id.
 */
function getTaskById(taskId) {
  const tasks = readTasks();
  return tasks.find((t) => t.id === taskId) || null;
}

/**
 * Delete a task by id.
 */
function deleteTask(taskId) {
  const tasks = readTasks();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx < 0) return false;
  tasks.splice(idx, 1);
  writeTasks(tasks);
  return true;
}

/**
 * Update task progress (0–100) and optional status.
 */
function updateTaskProgress(taskId, progress, status) {
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) throw new Error(`Task not found: ${taskId}`);
  tasks[idx].progress = Math.round(progress);
  if (status) tasks[idx].status = status;
  writeTasks(tasks);
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

function readSessions() {
  return readJSON(SESSIONS_FILE, []);
}

function writeSessions(sessions) {
  writeJSON(SESSIONS_FILE, sessions);
}

/**
 * Log a focus/distraction session.
 */
function logSession(session) {
  const sessions = readSessions();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  sessions.push({
    id,
    taskId: session.taskId,
    focusedMinutes: session.focusedMinutes || 0,
    distractedMinutes: session.distractedMinutes || 0,
    windowTitle: session.windowTitle || '',
    timestamp,
  });

  writeSessions(sessions);
  return id;
}

/**
 * Get all sessions for a task.
 */
function getSessionsByTask(taskId) {
  return readSessions().filter((s) => s.taskId === taskId);
}

/**
 * Total focused + distracted minutes for a task.
 */
function getTaskSessionTotals(taskId) {
  const sessions = getSessionsByTask(taskId);
  return sessions.reduce(
    (acc, s) => ({
      focusedMinutes: acc.focusedMinutes + (s.focusedMinutes || 0),
      distractedMinutes: acc.distractedMinutes + (s.distractedMinutes || 0),
    }),
    { focusedMinutes: 0, distractedMinutes: 0 }
  );
}

// ---------------------------------------------------------------------------
// Task Requests (multi-stage form submissions)
// ---------------------------------------------------------------------------

function readTaskRequests() {
  return readJSON(TASK_REQUESTS_FILE, []);
}

function writeTaskRequests(requests) {
  writeJSON(TASK_REQUESTS_FILE, requests);
}

/**
 * Create a raw task request from multi-stage form data.
 * @param {Object} formData - Form submission data
 * @param {string} userId
 * @returns {string} taskRequestId
 */
function createRawTaskRequest(formData, userId) {
  const requests = readTaskRequests();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newRequest = {
    id,
    userId: String(userId),
    stage: 'raw',
    formData,
    createdAt: now,
    updatedAt: now,
  };

  requests.push(newRequest);
  writeTaskRequests(requests);
  return id;
}

// Initialize priorities for all tasks that don't have one
function initializePriorities() {
  const tasks = readTasks();
  let hasChanges = false;

  // Group tasks by userId and assign priorities based on creation order within each user
  const tasksByUser = {};
  tasks.forEach(task => {
    const userId = task.userId || 'default';
    if (!tasksByUser[userId]) tasksByUser[userId] = [];
    tasksByUser[userId].push(task);
  });

  // Reset priorities for tasks in each user group
  Object.values(tasksByUser).forEach(userTasks => {
    userTasks.forEach((task, index) => {
      // Assign priority based on index (1-based)
      const newPriority = index + 1;
      if (task.priority !== newPriority) {
        task.priority = newPriority;
        hasChanges = true;
      }
    });
  });

  if (hasChanges) {
    writeTasks(tasks);
    console.log('[DB] Initialized priorities for all tasks');
  }
}

// ensureSheets is a no-op here (compatibility shim)
function ensureSheets() {
  ensureDataDir();
  initializePriorities();
  return Promise.resolve();
}

module.exports = {
  ensureSheets,
  createTask,
  getTasksByUser,
  getTodayTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskProgress,
  logSession,
  getSessionsByTask,
  getTaskSessionTotals,
  createRawTaskRequest,
  readTasks,
  writeTasks,
};
