'use strict';

/**
 * Firebase Firestore database module
 * Replaces local-memory.js with cloud-based storage
 * Handles: tasks, sessions, users, task requests, admin data
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!serviceAccount) {
  console.warn('[Firebase] No service account found. Using emulator or default credentials.');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// Collection names
const TASKS_COLLECTION = 'tasks';
const SESSIONS_COLLECTION = 'sessions';
const USERS_COLLECTION = 'users';
const TASK_REQUESTS_COLLECTION = 'taskRequests';
const ADMIN_STATS_COLLECTION = 'adminStats';

// ============================================================================
// Tasks Operations
// ============================================================================

async function createTask(task, userId) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Get max priority for this user
  const tasksSnap = await db
    .collection(TASKS_COLLECTION)
    .where('userId', '==', String(userId))
    .orderBy('priority', 'desc')
    .limit(1)
    .get();

  const maxPriority = tasksSnap.empty ? 0 : tasksSnap.docs[0].data().priority ?? 0;

  const milestones = (task.milestones || []).map(m => ({
    ...m,
    startedAt: null,
    completedAt: null,
    deadline: m.deadline || null,
  }));

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
    updatedAt: now,
  };

  await db.collection(TASKS_COLLECTION).doc(id).set(newTask);
  return id;
}

async function getTaskById(taskId) {
  const doc = await db.collection(TASKS_COLLECTION).doc(taskId).get();
  return doc.exists ? doc.data() : null;
}

async function getTasksByUser(userId) {
  const snap = await db
    .collection(TASKS_COLLECTION)
    .where('userId', '==', String(userId))
    .get();
  return snap.docs.map(doc => doc.data());
}

async function getTodayTasks(userId) {
  const tasks = await getTasksByUser(userId);
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(t => t.deadline && t.deadline.startsWith(today));
}

async function updateTask(taskId, updates) {
  const task = await getTaskById(taskId);
  if (!task) return null;

  const now = new Date().toISOString();
  const finalUpdates = {
    ...updates,
    updatedAt: now,
  };

  // Handle status transitions
  if (updates.status) {
    if (updates.status === 'in_progress' && !task.startedAt) {
      finalUpdates.startedAt = now;
    }
    if (updates.status === 'completed') {
      if (!task.startedAt) finalUpdates.startedAt = now;
      finalUpdates.completedAt = now;
    }
    if (updates.status === 'pending') {
      finalUpdates.completedAt = null;
    }
  }

  await db.collection(TASKS_COLLECTION).doc(taskId).update(finalUpdates);
  return { ...task, ...finalUpdates };
}

async function deleteTask(taskId) {
  // Soft delete
  const task = await getTaskById(taskId);
  if (!task) return null;

  return updateTask(taskId, {
    status: 'deleted',
    previousStatus: task.status,
  });
}

async function restoreTask(taskId) {
  const task = await getTaskById(taskId);
  if (!task || task.status !== 'deleted') return null;

  const previousStatus = task.previousStatus || 'pending';
  return updateTask(taskId, {
    status: previousStatus,
    previousStatus: null,
  });
}

async function updateTaskPriority(taskId, newPriority) {
  return updateTask(taskId, { priority: newPriority });
}

// ============================================================================
// Sessions Operations
// ============================================================================

async function logSession(sessionData) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const session = {
    id,
    taskId: sessionData.taskId,
    focusedMinutes: sessionData.focusedMinutes || 0,
    distractedMinutes: sessionData.distractedMinutes || 0,
    windowTitle: sessionData.windowTitle || '',
    createdAt: now,
  };

  await db.collection(SESSIONS_COLLECTION).doc(id).set(session);
  return id;
}

async function getTaskSessionTotals(taskId) {
  const snap = await db
    .collection(SESSIONS_COLLECTION)
    .where('taskId', '==', taskId)
    .get();

  let focusedMinutes = 0;
  let distractedMinutes = 0;

  snap.docs.forEach(doc => {
    const data = doc.data();
    focusedMinutes += data.focusedMinutes || 0;
    distractedMinutes += data.distractedMinutes || 0;
  });

  return { focusedMinutes, distractedMinutes };
}

async function updateTaskProgress(taskId, progressPct, status) {
  return updateTask(taskId, { progress: progressPct, status });
}

// ============================================================================
// Users Operations
// ============================================================================

async function createUser(uid, userData) {
  const now = new Date().toISOString();

  const user = {
    uid,
    email: userData.email || '',
    displayName: userData.displayName || '',
    createdAt: now,
    updatedAt: now,
    tasksCreated: 0,
    tasksCompleted: 0,
  };

  await db.collection(USERS_COLLECTION).doc(uid).set(user);
  return user;
}

async function getUserById(uid) {
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
  return doc.exists ? doc.data() : null;
}

async function updateUser(uid, updates) {
  const now = new Date().toISOString();
  await db.collection(USERS_COLLECTION).doc(uid).update({
    ...updates,
    updatedAt: now,
  });
}

async function incrementUserStats(uid, field) {
  const user = await getUserById(uid);
  if (!user) return;

  await db.collection(USERS_COLLECTION).doc(uid).update({
    [field]: (user[field] || 0) + 1,
  });
}

// ============================================================================
// Task Requests (Raw form data before AI planning)
// ============================================================================

async function createRawTaskRequest(formData, userId) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const request = {
    id,
    userId: String(userId),
    title: formData.title,
    output: formData.output,
    deadline: formData.deadline,
    reportTo: formData.reportTo,
    priorityLevel: formData.priorityLevel,
    createdAt: now,
  };

  await db.collection(TASK_REQUESTS_COLLECTION).doc(id).set(request);
  return id;
}

async function getTaskRequest(requestId) {
  const doc = await db.collection(TASK_REQUESTS_COLLECTION).doc(requestId).get();
  return doc.exists ? doc.data() : null;
}

// ============================================================================
// Admin Stats
// ============================================================================

async function recordAdminEvent(eventType, data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.collection(ADMIN_STATS_COLLECTION).doc(id).set({
    id,
    eventType,
    data,
    createdAt: now,
  });
}

async function getAdminStats() {
  // Get total users
  const usersSnap = await db.collection(USERS_COLLECTION).get();
  const totalUsers = usersSnap.size;

  // Get total tasks created
  const tasksSnap = await db.collection(TASKS_COLLECTION).get();
  const totalTasks = tasksSnap.size;

  // Get completed tasks
  const completedSnap = await db
    .collection(TASKS_COLLECTION)
    .where('status', '==', 'completed')
    .get();
  const completedTasks = completedSnap.size;

  // Get today's stats
  const today = new Date().toISOString().split('T')[0];
  const todaySnap = await db
    .collection(TASKS_COLLECTION)
    .where('createdAt', '>=', today)
    .get();
  const tasksCreatedToday = todaySnap.size;

  return {
    totalUsers,
    totalTasks,
    completedTasks,
    tasksCreatedToday,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0,
  };
}

async function recordComplaint(userId, complaint) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.collection('complaints').doc(id).set({
    id,
    userId,
    complaint,
    status: 'new',
    createdAt: now,
  });

  return id;
}

async function getComplaints() {
  const snap = await db.collection('complaints').get();
  return snap.docs.map(doc => doc.data());
}

// ============================================================================
// Authentication Helpers
// ============================================================================

// Called after client-side Firebase Auth creates the user
async function signUpUser(uid, email, displayName) {
  await createUser(uid, { email, displayName });
  return { uid, email, displayName };
}

// Upsert user doc — called after Google sign-in or any auth
async function ensureUser(uid, email, displayName) {
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    await createUser(uid, { email, displayName });
  }
  return { uid, email, displayName };
}

async function getUserByEmail(email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (err) {
    return null;
  }
}

// ============================================================================
// Initialization
// ============================================================================

async function ensureIndexes() {
  // Firestore indexes are created automatically
  console.log('[Firebase] Indexes ensured (auto-managed by Firestore)');
}

module.exports = {
  // Task operations
  createTask,
  getTaskById,
  getTasksByUser,
  getTodayTasks,
  updateTask,
  deleteTask,
  restoreTask,
  updateTaskPriority,

  // Session operations
  logSession,
  getTaskSessionTotals,
  updateTaskProgress,

  // User operations
  createUser,
  getUserById,
  updateUser,
  incrementUserStats,

  // Task request operations
  createRawTaskRequest,
  getTaskRequest,

  // Admin operations
  recordAdminEvent,
  getAdminStats,
  recordComplaint,
  getComplaints,

  // Auth operations
  signUpUser,
  ensureUser,
  getUserByEmail,

  // Initialization
  ensureIndexes,
  db,
  auth,
};
