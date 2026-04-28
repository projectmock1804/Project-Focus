import React, { useState } from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import { useToast } from './hooks/useToast.js';
import { ToastProvider } from './components/Toast.jsx';

export default function App() {
  const [view, setView] = useState({ page: 'landing', taskId: null });
  const { toasts, showToast } = useToast();

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
    if (view.page === 'landing') {
      return <Landing onEnterApp={navigateToDashboard} />;
    }

    if (view.page === 'task' && view.taskId) {
      return <TaskDetail taskId={view.taskId} onBack={navigateToDashboard} />;
    }

    return <Dashboard onNavigateToTask={navigateToTask} showToast={showToast} />;
  };

  return (
    <ToastProvider toasts={toasts} showToast={showToast}>
      {renderPage()}
    </ToastProvider>
  );
}
