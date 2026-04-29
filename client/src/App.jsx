import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Login from './pages/Login';
import api, { isTokenValid, clearAuth, getStoredUser } from './api';

function App() {
  // null = still checking (avoids flash of login screen)
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [currentUser, setCurrentUser]         = useState(null);
  const [activeChannel, setActiveChannel]     = useState('1');

  /* ── On mount: validate stored token against server ── */
  useEffect(() => {
    const validate = async () => {
      // 1. Quick client-side check (no network) — token present + not expired
      if (!isTokenValid()) {
        clearAuth();
        setIsAuthenticated(false);
        return;
      }

      // 2. Verify with server via /me (catches revoked / tampered tokens)
      try {
        const { data } = await api.get('/api/auth/me');
        setCurrentUser(data.user);
        setIsAuthenticated(true);
      } catch {
        // 401 interceptor already cleared storage; just mark unauthenticated
        clearAuth();
        setIsAuthenticated(false);
      }
    };

    validate();
  }, []);

  /* ── Called by Login on success ── */
  const handleLoginSuccess = useCallback((user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  }, []);

  /* ── Called by Sidebar logout button ── */
  const handleLogout = useCallback(() => {
    clearAuth();
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  /* ── While we're checking auth, render nothing (avoids route flash) ── */
  if (isAuthenticated === null) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
      }}>
        <div style={{
          width: '32px', height: '32px',
          borderRadius: '50%',
          border: '2px solid rgba(129,140,248,0.2)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const AppLayout = () => (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatArea channelId={activeChannel} />
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Root — redirect to /app if already authenticated */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/app" replace />
              : <Login onLoginSuccess={handleLoginSuccess} />
          }
        />

        {/* Legacy /register path — just go to login (register is a tab) */}
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Protected /app */}
        <Route
          path="/app"
          element={isAuthenticated ? <AppLayout /> : <Navigate to="/" replace />}
        />
        <Route
          path="/app/:workspaceSlug/:channelId"
          element={isAuthenticated ? <AppLayout /> : <Navigate to="/" replace />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
