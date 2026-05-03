import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import { useToast } from './hooks/useToast.js';
import { ToastProvider } from './components/Toast.jsx';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Detect if running in Electron via URL param (set by main.js) or userAgent
  const isElectron = (typeof window !== 'undefined') && (
    new URLSearchParams(window.location.search).get('mode') === 'desktop' ||
    navigator.userAgent.includes('Electron')
  );

  // Check URL for admin page access (두 가지 방법으로 접근 가능)
  // 방법 1: /admin URL로 직접 접근
  // 방법 2: ?admin=dev-admin-2026 파라미터로 접근
  const urlParams = new URLSearchParams(window.location.search);
  const adminSecret = urlParams.get('admin');
  const isAdminUrl = window.location.pathname === '/admin' || adminSecret === 'dev-admin-2026';

  // Start with 'auth' in Electron (skip landing page), 'landing' in browser
  const initialPage = isElectron ? 'auth' : 'landing';

  const [view, setView] = useState({ page: initialPage, taskId: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const { toasts, showToast } = useToast();

  // Firebase auth state listener — persists sessions across page refreshes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // In Electron app, everyone goes to dashboard
        // Admin page is only accessible via /admin URL in web browser
        setIsAuthenticated(true);
        setUserId(user.uid);
        setIsAdmin(false);  // Never auto-set admin in Electron
        localStorage.setItem('userId', user.uid);
        localStorage.removeItem('isAdmin');
        // Always go to dashboard in Electron
        setView({ page: 'dashboard', taskId: null });
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Auto-navigate away from landing page when authenticated
  useEffect(() => {
    if (isAuthenticated && view.page === 'landing') {
      if (isAdmin) {
        setView({ page: 'admin', taskId: null });
      } else {
        setView({ page: 'dashboard', taskId: null });
      }
    }
  }, [isAuthenticated, isAdmin]);

  function handleSignIn(uid, email) {
    // In Electron app, never set admin - always go to dashboard
    // In web browser, admin is determined by email (only for web access)
    const isAdminUser = !isElectron && email === 'projectmock1804@gmail.com';
    if (isAdminUser) localStorage.setItem('isAdmin', 'true');
    else localStorage.removeItem('isAdmin');
    setIsAuthenticated(true);
    setUserId(uid);
    setIsAdmin(isAdminUser);
    setView({ page: isAdminUser ? 'admin' : 'dashboard', taskId: null });
  }

  function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('displayName');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setUserId(null);
    setIsAdmin(false);
    // In Electron, go to auth page. In browser, go to landing page.
    setView({ page: isElectron ? 'auth' : 'landing', taskId: null });
  }

  function navigateToTask(taskId) {
    setView({ page: 'task', taskId });
  }

  function navigateToDashboard() {
    setView({ page: 'dashboard', taskId: null });
  }

  function navigateToLanding() {
    setView({ page: 'landing', taskId: null });
  }

  function handleAdminAccess() {
    setAdminAuthenticated(true);
  }

  function handleAdminLogout() {
    setAdminAuthenticated(false);
    // Redirect to admin login
    window.location.href = '/admin';
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0E0E0C' }}>
        <div style={{ color: 'rgba(242,240,235,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const renderPage = () => {
    // Admin page access (no Firebase auth required, just secret)
    if (isAdminUrl) {
      if (!adminAuthenticated) {
        return <AdminLogin onAdminAccess={handleAdminAccess} />;
      }
      return <Admin onLogout={handleAdminLogout} />;
    }

    // Not authenticated - show auth flow
    if (!isAuthenticated) {
      if (view.page === 'auth') {
        return <Auth onSignIn={handleSignIn} />;
      }
      // Default to auth page for non-authenticated users (or landing in browser)
      return <Landing onEnterApp={() => setView({ page: 'auth' })} />;
    }

    // Authenticated users - check for admin page access via email
    if (view.page === 'admin') {
      return isAdmin ? <Admin onLogout={handleLogout} /> : <Dashboard onNavigateToTask={navigateToTask} showToast={showToast} onLogout={handleLogout} />;
    }

    if (view.page === 'task' && view.taskId) {
      return <TaskDetail taskId={view.taskId} onBack={navigateToDashboard} />;
    }

    return <Dashboard onNavigateToTask={navigateToTask} showToast={showToast} onLogout={handleLogout} />;
  };

  return (
    <ToastProvider toasts={toasts} showToast={showToast}>
      {renderPage()}
    </ToastProvider>
  );
}
