import React, { useState } from 'react';
import { Hash, LogOut, ChevronDown, Plus, Settings, Trash2, User, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { getStoredUser } from '../api';

const AVATAR_COLORS = [
  '#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa',
];

const getAvatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const Sidebar = ({
  activeChannel = '1',
  onChannelSelect = () => {},
  currentUser: userProp,
  onLogout,
  workspaces = [],
  activeWorkspace = null,
  channels = [],
  members = [],
  onWorkspaceSelect = () => {},
  loadingDetails = false,
  onCreateWorkspace = () => {},
  onManageWorkspace = () => {},
  onAddChannel = () => {},
  onDeleteChannel = () => {},
  onProfileClick = () => {},
}) => {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  // Prefer the prop passed from App (has fresh /me data); fall back to stored
  const currentUser = userProp || getStoredUser() || { username: 'You', role: 'Member' };
  const activeWorkspaceName = activeWorkspace?.name || 'Workspace';
  const activeWorkspaceRole = activeWorkspace?.role || currentUser.role || 'Member';
  const onlineCount = members.filter(member => member.online).length;

  const handleLogout = () => {
    if (onLogout) onLogout(); // App.jsx calls clearAuth() then sets state
  };

  const sidebarStyle = {
    width: 'var(--sidebar-width)',
    minWidth: 'var(--sidebar-width)',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-subtle)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    zIndex: 20,
    position: 'relative',
  };

  return (
    <div style={sidebarStyle}>

      {/* Workspace Switcher */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'background 0.2s',
          position: 'relative',
        }}
        className="hover:bg-white/[0.03]"
        id="workspace-switcher"
        onMouseEnter={() => setShowWorkspaceMenu(true)}
        onMouseLeave={() => setShowWorkspaceMenu(false)}
        onClick={() => setShowWorkspaceMenu(prev => !prev)}
      >
        {/* Logo circle */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent), #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '14px',
            color: 'white',
            boxShadow: '0 0 12px rgba(129,140,248,0.4)',
            flexShrink: 0,
          }}
        >
          {(activeWorkspaceName || 'W').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {activeWorkspaceName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            {onlineCount} online
          </div>
        </div>
        <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--text-secondary)', flexShrink: 0 }} />

        {showWorkspaceMenu && (
          <div
            style={{
              position: 'absolute',
              top: '54px',
              left: '14px',
              width: '240px',
              background: 'rgba(14, 20, 38, 0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px',
              boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
              zIndex: 50,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px' }}>
              Workspaces
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {workspaces.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 8px' }}>
                  No workspaces yet.
                </div>
              )}
              {workspaces.map(workspace => {
                const isActive = workspace.id === activeWorkspace?.id;
                return (
                  <button
                    key={workspace.id}
                    onClick={() => onWorkspaceSelect(workspace)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: isActive ? '1px solid rgba(129,140,248,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      background: isActive ? 'rgba(129,140,248,0.12)' : 'rgba(255,255,255,0.02)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s, border-color 0.2s',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{workspace.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {workspace.member_count || 0} members · {workspace.channel_count || 0} channels
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => { setShowWorkspaceMenu(false); onCreateWorkspace(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px dashed rgba(129,140,248,0.4)',
                  background: 'rgba(129,140,248,0.05)',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '4px'
                }}
              >
                <Plus style={{ width: '14px', height: '14px' }} /> Create New Workspace
              </button>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '6px' }}>
              Workspace Details
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Role: <strong style={{ color: 'var(--text-primary)' }}>{activeWorkspaceRole}</strong></span>
              <span>Members: <strong style={{ color: 'var(--text-primary)' }}>{activeWorkspace?.member_count ?? members.length}</strong></span>
              <span>Channels: <strong style={{ color: 'var(--text-primary)' }}>{activeWorkspace?.channel_count ?? channels.length}</strong></span>
              
              {(activeWorkspaceRole === 'Owner' || activeWorkspaceRole === 'Admin') && (
                <button 
                  onClick={() => { setShowWorkspaceMenu(false); onManageWorkspace(); }}
                  style={{
                    marginTop: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <Settings style={{width:'11px', height:'11px'}}/> Manage Workspace Settings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4">

        {/* Channels section */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              padding: '0 16px',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Channels
            </span>
            <motion.button
              whileHover={{ scale: 1.1, color: 'var(--accent)' }}
              whileTap={{ scale: 0.9 }}
              id="add-channel-btn"
              onClick={onAddChannel}
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
            </motion.button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 8px' }}>
            {loadingDetails && (
              <div style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Loading channels…
              </div>
            )}
            {!loadingDetails && channels.length === 0 && (
              <div style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                No channels yet.
              </div>
            )}
            {channels.map((ch, idx) => {
              const isActive = String(ch.id) === String(activeChannel);
              return (
                <ChannelItem
                  key={ch.id}
                  channel={ch}
                  isActive={isActive}
                  index={idx}
                  onSelect={() => onChannelSelect(ch)}
                  onDelete={() => onDeleteChannel(ch)}
                  isAdmin={activeWorkspaceRole === 'Owner' || activeWorkspaceRole === 'Admin'}
                />
              );
            })}
          </div>
        </div>

        {/* Members section */}
        <div>
          <div style={{ padding: '0 16px', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Members
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 8px' }}>
            {loadingDetails && (
              <div style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Loading members…
              </div>
            )}
            {!loadingDetails && members.length === 0 && (
              <div style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                No members yet.
              </div>
            )}
            {members.map((member, idx) => (
              <MemberItem key={member.id} member={member} index={idx + channels.length} />
            ))}
          </div>
        </div>
      </div>

      {/* User footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: `${getAvatarColor(currentUser.username || 'Y')}22`,
            border: `1px solid ${getAvatarColor(currentUser.username || 'Y')}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: getAvatarColor(currentUser.username || 'Y'),
            flexShrink: 0,
          }}
        >
          {(currentUser.username || 'Y').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {currentUser.username || 'You'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} className="animate-breath" />
            Online
          </div>
        </div>
        <motion.button
          id="logout-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s',
          }}
          title="Log out"
        >
          <LogOut style={{ width: '15px', height: '15px' }} />
        </motion.button>
      </div>
    </div>
  );
};

/* ── Channel Item ── */
const ChannelItem = ({ channel, isActive, index, onSelect, onDelete, isAdmin }) => {
  const [hovered, setHovered] = useState(false);

  const sidebarItemClass = `sidebar-item-${Math.min(index + 1, 6)}`;

  return (
    <button
      id={`channel-${channel.id}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={sidebarItemClass}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s, box-shadow 0.15s',
        position: 'relative',
        background: isActive
          ? 'rgba(129,140,248,0.1)'
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
        boxShadow: isActive ? 'inset -2px 0 0 var(--accent)' : 'none',
        gap: '8px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Active left bar glow */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '15%',
            bottom: '15%',
            width: '3px',
            borderRadius: '0 3px 3px 0',
            background: 'var(--accent)',
            boxShadow: '-2px 0 8px var(--accent)',
          }}
          className="channel-active-glow"
        />
      )}

      <Hash
        style={{
          width: '14px',
          height: '14px',
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
      />

      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: '13px',
          fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--text-primary)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.15s',
        }}
      >
        {channel.name}
      </span>

      {hovered && isAdmin && channel.name !== 'general' && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
          }}
          className="hover:text-red-400"
        >
          <Trash2 style={{ width: '12px', height: '12px' }} />
        </motion.button>
      )}

      {channel.unread > 0 && (
        <span
          className="animate-bounce-in"
          style={{
            background: 'var(--accent)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '999px',
            lineHeight: '16px',
            boxShadow: '0 0 8px rgba(129,140,248,0.5)',
          }}
        >
          {channel.unread}
        </span>
      )}
    </button>
  );
};

/* ── Member Item ── */
const MemberItem = ({ member, index }) => {
  const [hovered, setHovered] = useState(false);
  const color = getAvatarColor(member.name);
  const sidebarItemClass = `sidebar-item-${Math.min(index + 1, 6)}`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={sidebarItemClass}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: '6px',
        gap: '8px',
        transition: 'background 0.15s',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        cursor: 'default',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: `${color}22`,
            border: `1px solid ${color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color,
          }}
        >
          {member.name.charAt(0).toUpperCase()}
        </div>
        {/* Online dot */}
        {member.online ? (
          <div
            className="animate-breath"
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--green)',
              border: '2px solid var(--bg-sidebar)',
              boxShadow: '0 0 6px rgba(52,211,153,0.7)',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--text-muted)',
              border: '2px solid var(--bg-sidebar)',
            }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: member.online ? 'var(--text-primary)' : 'var(--text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}
        >
          {member.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
          {member.role}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
