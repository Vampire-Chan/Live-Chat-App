import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { X, Layout, Hash, Shield, User as UserIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Login from './pages/Login';
import api, { isTokenValid, clearAuth, getStoredUser } from './api';

const WorkspaceLayout = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const { workspaceSlug, channelId } = useParams();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Modals state
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadWorkspaces = async () => {
      setLoadingWorkspace(true);
      try {
        const { data } = await api.get('/api/workspaces');
        if (!mounted) return;
        const list = data.workspaces || [];
        setWorkspaces(list);

        const selected = list.find(ws => ws.slug === workspaceSlug) || list[0] || null;
        setActiveWorkspace(selected);
      } catch (err) {
        console.error('Failed to load workspaces:', err);
      } finally {
        if (mounted) setLoadingWorkspace(false);
      }
    };

    loadWorkspaces();
    return () => {
      mounted = false;
    };
  }, [workspaceSlug]);

  useEffect(() => {
    if (!activeWorkspace) {
      setChannels([]);
      setMembers([]);
      return;
    }

    let mounted = true;

    const loadWorkspaceDetails = async () => {
      setLoadingDetails(true);
      try {
        const [channelsRes, membersRes] = await Promise.all([
          api.get(`/api/workspaces/${activeWorkspace.id}/channels`),
          api.get(`/api/workspaces/${activeWorkspace.id}/members`),
        ]);

        if (!mounted) return;
        setChannels(channelsRes.data.channels || []);
        setMembers(membersRes.data.members || []);
      } catch (err) {
        console.error('Failed to load workspace details:', err);
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    };

    loadWorkspaceDetails();
    return () => {
      mounted = false;
    };
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (!activeWorkspace || channels.length === 0) return;

    // Find existing channel from URL or default to first
    const currentChannelMatch = channels.find(ch => String(ch.id) === String(channelId));
    const defaultChannel = channels[0];
    const targetChannel = currentChannelMatch || defaultChannel;

    setActiveChannel(String(targetChannel.id));

    // Sync URL if it's missing the channel ID or if the workspace slug is wrong
    const isCorrectPath = workspaceSlug === activeWorkspace.slug && String(channelId) === String(targetChannel.id);
    if (!isCorrectPath) {
      navigate(`/app/${activeWorkspace.slug}/${targetChannel.id}`, { replace: true });
    }
  }, [activeWorkspace?.slug, channels, channelId, workspaceSlug, navigate]);

  const handleWorkspaceSelect = (workspace) => {
    if (!workspace || workspace.id === activeWorkspace?.id) return;
    setActiveWorkspace(workspace);
    setActiveChannel(null);
    setChannels([]);
    setMembers([]);
    navigate(`/app/${workspace.slug}`, { replace: true });
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    const name = e.target.wsName.value;
    if (!name?.trim()) return;

    try {
      const { data } = await api.post('/api/workspaces', { name });
      const newWs = data.workspace || data;
      setWorkspaces(prev => [...prev, newWs]);
      setShowWorkspaceModal(false);
      handleWorkspaceSelect(newWs);
    } catch (err) {
      alert(`Failed to create workspace: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    const name = e.target.chName.value;
    const description = e.target.chDesc.value;

    if (!activeWorkspace?.id) return alert('No active workspace selected');

    try {
      const { data } = await api.post(`/api/workspaces/${activeWorkspace.id}/channels`, { name, description });
      const newChannel = data.channel || data;
      setChannels(prev => [...prev, newChannel]);
      setShowChannelModal(false);
      handleChannelSelect(newChannel);
    } catch (err) {
      alert(`Failed to create channel: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteChannel = async (channel) => {
    if (channel.name === 'general') return alert('Cannot delete #general');
    if (!window.confirm(`Delete #${channel.name}? All messages will be lost.`)) return;
    
    try {
      await api.delete(`/api/channels/${channel.id}`);
      setChannels(prev => prev.filter(c => c.id !== channel.id));
      if (String(activeChannel) === String(channel.id)) {
        handleChannelSelect(channels[0]);
      }
    } catch (err) {
      alert(`Failed to delete channel: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleChannelSelect = (channel) => {
    const channelIdValue = String(channel.id || channel);
    setActiveChannel(channelIdValue);
    if (activeWorkspace) {
      navigate(`/app/${activeWorkspace.slug}/${channelIdValue}`);
    }
  };

  const decoratedMembers = members.map(member => ({
    ...member,
    online: member.id === currentUser?.id,
  }));

  if (loadingWorkspace) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid rgba(129,140,248,0.2)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar
        activeChannel={activeChannel}
        onChannelSelect={handleChannelSelect}
        currentUser={currentUser}
        onLogout={onLogout}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        channels={channels}
        members={decoratedMembers}
        onWorkspaceSelect={handleWorkspaceSelect}
        loadingDetails={loadingDetails}
        onCreateWorkspace={() => setShowWorkspaceModal(true)}
        onAddChannel={() => setShowChannelModal(true)}
        onDeleteChannel={handleDeleteChannel}
        onProfileClick={() => setShowProfileModal(true)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <ChatArea
          channelId={activeChannel}
          channels={channels}
          currentUser={currentUser}
        />
      </div>

      {/* --- Modals Render --- */}
      {showWorkspaceModal && (
        <Modal title="Create Workspace" onClose={() => setShowWorkspaceModal(false)}>
          <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>WORKSPACE NAME</label>
              <input name="wsName" autoFocus required placeholder="Acme Corp" style={inputStyle} />
            </div>
            <button type="submit" style={btnStyle}>Create Workspace</button>
          </form>
        </Modal>
      )}

      {showChannelModal && (
        <Modal title="Create Channel" onClose={() => setShowChannelModal(false)}>
          <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>CHANNEL NAME</label>
              <input name="chName" autoFocus required placeholder="engineering" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>DESCRIPTION (OPTIONAL)</label>
              <input name="chDesc" placeholder="Discussion about tech stack" style={inputStyle} />
            </div>
            <button type="submit" style={btnStyle}>Create Channel</button>
          </form>
        </Modal>
      )}

      {showProfileModal && (
        <Modal title="User Profile" onClose={() => setShowProfileModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 800, color: 'white', boxShadow: '0 8px 24px rgba(129,140,248,0.4)' }}>
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{currentUser?.username}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{currentUser?.email}</p>
            </div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Shield style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Global Role: {currentUser?.role || 'Member'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layout style={{ width: '16px', height: '16px', color: 'var(--accent)' }} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Workspaces: {workspaces.length}</span>
              </div>
            </div>
            <button onClick={() => alert('Profile editing coming soon!')} style={{ ...btnStyle, background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)' }}>Edit Profile</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Shared Internal Components ---
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
    <div style={{ background: 'var(--bg-sidebar)', width: '100%', maxWidth: '400px', borderRadius: '16px', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X style={{ width: '20px', height: '20px' }} /></button>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  </div>
);

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  padding: '10px 12px',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const btnStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(129,140,248,0.3)',
};

function App() {
  // null = still checking (avoids flash of login screen)
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [currentUser, setCurrentUser]         = useState(null);

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
          element={isAuthenticated ? <WorkspaceLayout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/app/:workspaceSlug"
          element={isAuthenticated ? <WorkspaceLayout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/app/:workspaceSlug/:channelId"
          element={isAuthenticated ? <WorkspaceLayout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/" replace />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
