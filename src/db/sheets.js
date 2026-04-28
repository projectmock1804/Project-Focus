'use strict';

require('dotenv').config();
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const crypto = require('crypto');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const KEY_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './google-service-account-key.json';

// Sheet name constants
const SHEETS = {
  TASKS: 'Tasks',
  SESSIONS: 'Sessions',
};

// Tasks columns: id, userId, title, deadline, progress, estimatedHours, status, milestones, createdAt
const TASKS_HEADER = ['id', 'userId', 'title', 'deadline', 'progress', 'estimatedHours', 'status', 'milestones', 'createdAt'];

// Sessions columns: id, taskId, focusedMinutes, distractedMinutes, windowTitle, timestamp
const SESSIONS_HEADER = ['id', 'taskId', 'focusedMinutes', 'distractedMinutes', 'windowTitle', 'timestamp'];

let _auth = null;
let _sheets = null;

/**
 * Initialize Google Sheets API client with service account credentials.
 * Lazy-initialised on first use.
 */
async function getSheets() {
  if (_sheets) return _sheets;

  const keyFilePath = path.resolve(KEY_FILE);

  _auth = new GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  _sheets = google.sheets({ version: 'v4', auth: _auth });
  return _sheets;
}

/**
 * Ensure both required sheets (tabs) exist in the spreadsheet.
 * Creates them with headers if they do not exist.
 */
async function ensureSheets() {
  const sheets = await getSheets();

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingTitles = meta.data.sheets.map((s) => s.properties.title);

  const requests = [];

  if (!existingTitles.includes(SHEETS.TASKS)) {
    requests.push({ addSheet: { properties: { title: SHEETS.TASKS } } });
  }
  if (!existingTitles.includes(SHEETS.SESSIONS)) {
    requests.push({ addSheet: { properties: { title: SHEETS.SESSIONS } } });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
  }

  // Write headers if sheets are empty
  await _ensureHeader(sheets, SHEETS.TASKS, TASKS_HEADER);
  await _ensureHeader(sheets, SHEETS.SESSIONS, SESSIONS_HEADER);
}

async function _ensureHeader(sheets, sheetName, header) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:Z1`,
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [header] },
    });
  }
}

/**
 * Read all rows from a sheet and return as array of objects keyed by header.
 */
async function _readSheet(sheetName, header) {
  const sheets = await getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:Z`,
  });

  const rows = res.data.values || [];
  return rows.map((row) => {
    const obj = {};
    header.forEach((col, i) => {
      obj[col] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
}

/**
 * Append a row to a sheet.
 */
async function _appendRow(sheetName, header, data) {
  const sheets = await getSheets();

  const row = header.map((col) => (data[col] !== undefined ? String(data[col]) : ''));

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

/**
 * Find the row index (1-based, including header) of a row where column matches value.
 * Returns -1 if not found.
 */
async function _findRowIndex(sheetName, keyColumn, keyValue, header) {
  const rows = await _readSheet(sheetName, header);
  const idx = rows.findIndex((r) => r[keyColumn] === keyValue);
  return idx === -1 ? -1 : idx + 2; // +2: 1-based + header row
}

/**
 * Update a specific row by row number (1-based, including header).
 */
async function _updateRow(sheetName, rowNumber, header, data) {
  const sheets = await getSheets();

  const row = header.map((col) => (data[col] !== undefined ? String(data[col]) : ''));

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

// =============================================================================
// Tasks CRUD
// =============================================================================

/**
 * Create a new task row in the Tasks sheet.
 *
 * @param {Object} task - Task data from Claude estimator
 * @param {string} userId - Telegram user ID or user identifier
 * @returns {string} Generated task ID
 */
async function createTask(task, userId) {
  await ensureSheets();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const row = {
    id,
    userId: String(userId),
    title: task.title,
    deadline: task.deadline,
    progress: '0',
    estimatedHours: String(task.estimatedHours),
    status: 'pending',
    milestones: JSON.stringify(task.milestones),
    createdAt: now,
  };

  await _appendRow(SHEETS.TASKS, TASKS_HEADER, row);
  return id;
}

/**
 * Get all tasks for a user.
 *
 * @param {string} userId
 * @returns {Promise<Object[]>} Array of task objects
 */
async function getTasksByUser(userId) {
  await ensureSheets();
  const rows = await _readSheet(SHEETS.TASKS, TASKS_HEADER);
  return rows
    .filter((r) => r.userId === String(userId))
    .map(_deserializeTask);
}

/**
 * Get tasks scheduled for today (deadline date matches today).
 *
 * @param {string} userId
 * @returns {Promise<Object[]>}
 */
async function getTodayTasks(userId) {
  const tasks = await getTasksByUser(userId);
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter((t) => {
    if (!t.deadline) return false;
    return t.deadline.startsWith(today);
  });
}

/**
 * Get a single task by ID.
 *
 * @param {string} taskId
 * @returns {Promise<Object|null>}
 */
async function getTaskById(taskId) {
  await ensureSheets();
  const rows = await _readSheet(SHEETS.TASKS, TASKS_HEADER);
  const row = rows.find((r) => r.id === taskId);
  return row ? _deserializeTask(row) : null;
}

/**
 * Update task progress (0–100).
 *
 * @param {string} taskId
 * @param {number} progress - 0 to 100
 * @param {string} [status] - Optional status override
 */
async function updateTaskProgress(taskId, progress, status) {
  await ensureSheets();
  const rowIndex = await _findRowIndex(SHEETS.TASKS, 'id', taskId, TASKS_HEADER);
  if (rowIndex === -1) throw new Error(`Task not found: ${taskId}`);

  const rows = await _readSheet(SHEETS.TASKS, TASKS_HEADER);
  const existing = rows.find((r) => r.id === taskId);
  if (!existing) throw new Error(`Task not found: ${taskId}`);

  const updated = {
    ...existing,
    progress: String(Math.round(progress)),
    status: status || existing.status,
  };

  await _updateRow(SHEETS.TASKS, rowIndex, TASKS_HEADER, updated);
}

function _deserializeTask(row) {
  let milestones = [];
  try {
    milestones = JSON.parse(row.milestones || '[]');
  } catch {
    milestones = [];
  }
  return {
    ...row,
    progress: parseFloat(row.progress) || 0,
    estimatedHours: parseFloat(row.estimatedHours) || 0,
    milestones,
  };
}

// =============================================================================
// Sessions CRUD
// =============================================================================

/**
 * Log a focus/distraction session event.
 *
 * @param {Object} session
 * @param {string} session.taskId
 * @param {number} session.focusedMinutes
 * @param {number} session.distractedMinutes
 * @param {string} session.windowTitle - Active window title at log time
 * @returns {string} Session log ID
 */
async function logSession(session) {
  await ensureSheets();

  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const row = {
    id,
    taskId: session.taskId,
    focusedMinutes: String(session.focusedMinutes || 0),
    distractedMinutes: String(session.distractedMinutes || 0),
    windowTitle: session.windowTitle || '',
    timestamp,
  };

  await _appendRow(SHEETS.SESSIONS, SESSIONS_HEADER, row);
  return id;
}

/**
 * Get all session logs for a task.
 *
 * @param {string} taskId
 * @returns {Promise<Object[]>}
 */
async function getSessionsByTask(taskId) {
  await ensureSheets();
  const rows = await _readSheet(SHEETS.SESSIONS, SESSIONS_HEADER);
  return rows
    .filter((r) => r.taskId === taskId)
    .map((r) => ({
      ...r,
      focusedMinutes: parseFloat(r.focusedMinutes) || 0,
      distractedMinutes: parseFloat(r.distractedMinutes) || 0,
    }));
}

/**
 * Calculate total focused and distracted minutes for a task.
 *
 * @param {string} taskId
 * @returns {Promise<{focusedMinutes: number, distractedMinutes: number}>}
 */
async function getTaskSessionTotals(taskId) {
  const sessions = await getSessionsByTask(taskId);
  return sessions.reduce(
    (acc, s) => ({
      focusedMinutes: acc.focusedMinutes + s.focusedMinutes,
      distractedMinutes: acc.distractedMinutes + s.distractedMinutes,
    }),
    { focusedMinutes: 0, distractedMinutes: 0 }
  );
}

module.exports = {
  ensureSheets,
  createTask,
  getTasksByUser,
  getTodayTasks,
  getTaskById,
  updateTaskProgress,
  logSession,
  getSessionsByTask,
  getTaskSessionTotals,
};
