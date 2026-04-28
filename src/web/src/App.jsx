import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import { useToast } from './hooks/useToast.js';
import { ToastProvider } from './components/Toast.jsx';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState({ page: 'landing', taskId: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
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
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
    setView({ page: 'landing', taskId: null });
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

  if (authLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0E0E0C' }}>
        <div style={{ color: 'rgba(242,240,235,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const renderPage = () => {
    // Unauthenticated pages
    if (view.page === 'landing') {
      return isAuthenticated ?
        <Landing onEnterApp={() => isAdmin ? setView({ page: 'admin' }) : setView({ page: 'dashboard' })} /> :
        <Landing onEnterApp={() => setView({ page: 'auth' })} />;
    }

    if (view.page === 'auth') {
      return <Auth onSignIn={handleSignIn} />;
    }

    // Authenticated pages
    if (!isAuthenticated) {
      return <Landing onEnterApp={() => setView({ page: 'auth' })} />;
    }

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
