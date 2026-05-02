import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import UpgradePage from './pages/UpgradePage.jsx';
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

  // Start with 'auth' in Electron (skip landing page), 'landing' in browser
  const initialPage = isElectron ? 'auth' : 'landing';

  const [view, setView] = useState({ page: initialPage, taskId: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const { toasts, showToast } = useToast();

  // Firebase auth state listener — persists sessions across page refreshes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isAdminUser = localStorage.getItem('isAdmin') === 'true';
        setIsAuthenticated(true);
        setUserId(user.uid);
        setIsAdmin(isAdminUser);
        localStorage.setItem('userId', user.uid);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setIsAdmin(false);
        setSubscriptionStatus(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch subscription status when user authenticates
  useEffect(() => {
    // Only check subscription if auth has loaded and user is actually authenticated
    if (!authLoading && isAuthenticated && userId && !isAdmin) {
      setSubscriptionLoading(true);
      fetch(`/api/subscription/status?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setSubscriptionStatus(data);
          setSubscriptionLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch subscription status:', err);
          // Default to allowing access if check fails
          setSubscriptionStatus({ hasAccess: true, status: 'free_trial', daysLeft: 14 });
          setSubscriptionLoading(false);
        });
    } else if (!authLoading && !isAuthenticated) {
      // Reset subscription status if user is not authenticated
      setSubscriptionStatus(null);
      setSubscriptionLoading(false);
    }
  }, [authLoading, isAuthenticated, userId, isAdmin]);

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

  function handleSignIn(uid) {
    setIsAuthenticated(true);
    setUserId(uid);

    // Check if admin
    const isAdminUser = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(isAdminUser);

    // Navigate to dashboard or admin
    if (isAdminUser) {
      setView({ page: 'admin', taskId: null });
    } else {
      setView({ page: 'dashboard', taskId: null });
    }
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

  if (authLoading || (isAuthenticated && !isAdmin && subscriptionLoading)) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0E0E0C' }}>
        <div style={{ color: 'rgba(242,240,235,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const renderPage = () => {
    // Not authenticated - show auth flow
    if (!isAuthenticated) {
      if (view.page === 'auth') {
        return <Auth onSignIn={handleSignIn} />;
      }
      // Default to auth page for non-authenticated users
      return <Landing onEnterApp={() => setView({ page: 'auth' })} />;
    }

    // Authenticated users only
    // Check subscription status before showing dashboard
    if (!isAdmin && subscriptionStatus && !subscriptionStatus.hasAccess) {
      return <UpgradePage subscriptionInfo={subscriptionStatus} onLogout={handleLogout} />;
    }

    if (view.page === 'admin') {
      return isAdmin ? <Admin onLogout={handleLogout} /> : <Dashboard onNavigateToTask={navigateToTask} showToast={showToast} onLogout={handleLogout} subscriptionStatus={subscriptionStatus} />;
    }

    if (view.page === 'task' && view.taskId) {
      return <TaskDetail taskId={view.taskId} onBack={navigateToDashboard} />;
    }

    return <Dashboard onNavigateToTask={navigateToTask} showToast={showToast} onLogout={handleLogout} subscriptionStatus={subscriptionStatus} />;
  };

  return (
    <ToastProvider toasts={toasts} showToast={showToast}>
      {renderPage()}
    </ToastProvider>
  );
}
