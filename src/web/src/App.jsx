import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import Auth from './pages/Auth.jsx';
import Admin from './pages/Admin.jsx';
import { useToast } from './hooks/useToast.js';
import { ToastProvider } from './components/Toast.jsx';

export default function App() {
  const [view, setView] = useState({ page: 'landing', taskId: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toasts, showToast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    const isAdminUser = localStorage.getItem('isAdmin') === 'true';

    if (storedUserId && authToken) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
      setIsAdmin(isAdminUser);
    }
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
