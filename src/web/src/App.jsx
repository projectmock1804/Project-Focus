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

  // Check URL for admin page access — /admin URL only (no secret in URL params)
  const isAdminUrl = window.__adminAccess || window.location.pathname === '/admin';

  // Start with 'auth' in Electron (skip landing page), 'landing' in browser
  const initialPage = isElectron ? 'auth' : 'landing';

  const [view, setView] = useState({ page: initialPage, taskId: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [freeTrialEndsAt, setFreeTrialEndsAt] = useState(null);
  const [paidUntil, setPaidUntil] = useState(null);
  const { toasts, showToast } = useToast();

  // Fetch subscription status when userId changes — uses auth token
  useEffect(() => {
    if (userId && isAuthenticated) {
      auth.currentUser?.getIdToken()
        .then(token => fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        }))
        .then(res => res.json())
        .then(data => {
          setSubscriptionStatus(data.status || 'free');
          setFreeTrialEndsAt(data.expiresAt && data.status === 'free_trial' ? data.expiresAt : null);
          setPaidUntil(data.expiresAt && data.status === 'paid' ? data.expiresAt : null);
        })
        .catch(err => console.error('Failed to fetch subscription status:', err));
    }
  }, [userId, isAuthenticated]);

  // Firebase auth state listener — persists sessions across page refreshes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // In Electron app, everyone goes to dashboard
        // In web, keep on landing page (user chooses to access dashboard via app download)
        setIsAuthenticated(true);
        setUserId(user.uid);
        setIsAdmin(false);  // Never auto-set admin
        localStorage.setItem('userId', user.uid);
        localStorage.removeItem('isAdmin');
        // Only auto-navigate to dashboard in Electron
        if (isElectron) {
          setView({ page: 'dashboard', taskId: null });
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setIsAdmin(false);
        setSubscriptionStatus('free');
        setFreeTrialEndsAt(null);
        setPaidUntil(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [isElectron]);

  // Auto-navigate away from landing page when authenticated (only in Electron)
  useEffect(() => {
    if (isElectron && isAuthenticated && view.page === 'landing') {
      // In Electron, authenticated users go to dashboard
      setView({ page: 'dashboard', taskId: null });
    }
  }, [isAuthenticated, isAdmin, isElectron]);

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

    // Web version always shows landing page (unless in admin flow)
    if (!isElectron) {
      return <Landing onEnterApp={() => setView({ page: 'auth' })} />;
    }

    // Electron app - requires authentication to proceed
    if (!isAuthenticated) {
      return <Auth onSignIn={handleSignIn} />;
    }

    // Authenticated users in Electron - show appropriate page
    if (view.page === 'admin') {
      return isAdmin ? <Admin onLogout={handleLogout} /> : <Dashboard onNavigateToTask={navigateToTask} showToast={showToast} onLogout={handleLogout} subscriptionStatus={subscriptionStatus} freeTrialEndsAt={freeTrialEndsAt} paidUntil={paidUntil} />;
    }

    if (view.page === 'task' && view.taskId) {
      return <TaskDetail taskId={view.taskId} onBack={navigateToDashboard} />;
    }

    // Default to dashboard in Electron
    return <Dashboard onNavigateToTask={navigateToTask} showToast={showToast} onLogout={handleLogout} subscriptionStatus={subscriptionStatus} freeTrialEndsAt={freeTrialEndsAt} paidUntil={paidUntil} />;
  };

  return (
    <ToastProvider toasts={toasts} showToast={showToast}>
      {renderPage()}
    </ToastProvider>
  );
}
