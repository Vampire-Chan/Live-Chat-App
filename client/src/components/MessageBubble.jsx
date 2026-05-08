import React, { useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LinkEmbed from './LinkEmbed';

const TAG_CONFIG = {
  Update:   { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8', label: 'UPDATE' },
  Question: { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24', label: 'QUESTION' },
  Decision: { bg: 'rgba(52,211,153,0.15)',  text: '#34d399', label: 'DECISION' },
  Idea:     { bg: 'rgba(244,114,182,0.15)', text: '#f472b6', label: 'IDEA' },
};

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅', '❌', '🤔', '💡', '🙌', '😮'];

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const MessageBubble = ({ message, onReact, onResolve, onOpenThread, currentUser, onUserClick, isThreadView = false }) => {
  const { user, content, created_at, tag, resolved, resolution_summary, reactions, reply_count } = message;
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [resolveSummary, setResolveSummary] = useState('');
  const [hovered, setHovered] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const timestamp = created_at
    ? new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const tagCfg = TAG_CONFIG[tag] || TAG_CONFIG.Update;

  // Avatar color based on username first char
  const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#a78bfa'];
  const avatarColor = COLORS[(user?.name || user?.username || 'U').charCodeAt(0) % COLORS.length];

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (resolveSummary.trim() && onResolve) {
      onResolve(message.id, resolveSummary.trim());
      setShowResolveInput(false);
      setResolveSummary('');
    }
  };

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick({
        id: user.id,
        username: user.username || user.name,
        avatar_url: user.avatar_url,
        role: user.role || 'Member'
      });
    }
  };

  // Find all URLs in content to render embeds
  const links = content.match(URL_REGEX) || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderLeft: hovered ? '2px solid rgba(129,140,248,0.25)' : '2px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
        fontFamily: 'var(--font-sans)',
        opacity: resolved ? 0.75 : 1,
      }}
    >
      {/* Avatar */}
      <div
        onClick={handleUserClick}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: user?.avatar_url ? 'transparent' : `${avatarColor}22`,
          border: user?.avatar_url ? 'none' : `1px solid ${avatarColor}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: avatarColor,
          flexShrink: 0,
          marginTop: '1px',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
      >
        {user?.avatar_url ? (
          <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        ) : (
          (user?.name || user?.username || 'U').charAt(0).toUpperCase()
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          {/* Username */}
          <span
            onClick={handleUserClick}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent)',
              lineHeight: 1,
              cursor: 'pointer'
            }}
          >
            {user?.name || user?.username || 'Unknown'}
          </span>

          {/* Timestamp */}
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            {timestamp}
          </span>

          {/* Tag badge */}
          <span
            className="tag-badge"
            style={{
              display: 'inline-block',
              background: tagCfg.bg,
              color: tagCfg.text,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '2px 7px',
              borderRadius: '4px',
              lineHeight: '16px',
              cursor: 'default',
            }}
          >
            {tagCfg.label}
          </span>

          {/* Resolved badge */}
          {resolved && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: 'var(--green-dim)',
                color: 'var(--green)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 7px',
                borderRadius: '4px',
                lineHeight: '16px',
              }}
            >
              <CheckCircle2 style={{ width: '9px', height: '9px' }} />
              Resolved
            </span>
          )}
        </div>

        {/* Message text */}
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            margin: 0,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {content.split(URL_REGEX).map((part, i) => {
            if (part.match(URL_REGEX)) {
              return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{part}</a>;
            }
            return part;
          })}
        </p>

        {/* Embeds */}
        {links.map((link, i) => (
          <LinkEmbed key={i} url={link} />
        ))}

        {/* Reactions */}
        {reactions && reactions.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {reactions.map((reaction, i) => {
              const hasReacted = currentUser && reaction.users && reaction.users.includes(currentUser.id);
              const tooltipText = reaction.usernames ? reaction.usernames.join(', ') : 'Someone';
              return (
                <motion.div
                  key={i}
                  style={{ position: 'relative' }}
                  whileHover="hover"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowPicker(false); onReact && onReact(reaction.emoji); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: hasReacted ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
                      border: hasReacted ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '999px',
                      padding: '3px 8px',
                      fontSize: '12px',
                      color: hasReacted ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!hasReacted) {
                        e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)';
                        e.currentTarget.style.background = 'rgba(129,140,248,0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!hasReacted) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                  >
                    <span>{reaction.emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: '11px' }}>{reaction.count}</span>
                  </motion.button>
                  
                  {/* Tooltip */}
                  <motion.div
                    variants={{ hover: { opacity: 1, y: 0 }, initial: { opacity: 0, y: 5 } }}
                    initial="initial"
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: '6px',
                      background: '#1a2235',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      zIndex: 20,
                    }}
                  >
                    {tooltipText}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Reply count indicator (main view only) */}
        {!isThreadView && reply_count > 0 && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => onOpenThread && onOpenThread(message)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 0',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <MessageSquare style={{ width: '13px', height: '13px' }} />
              {reply_count} {reply_count === 1 ? 'reply' : 'replies'}
            </button>
          </div>
        )}

        {/* Resolution summary */}
        <AnimatePresence>
          {resolved && resolution_summary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: '10px',
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2
                style={{
                  width: '16px',
                  height: '16px',
                  color: 'var(--green)',
                  flexShrink: 0,
                  marginTop: '1px',
                  filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.5))',
                }}
              />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>
                  Resolution
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                  {resolution_summary}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resolve inline input for Question tags */}
        <AnimatePresence>
          {showResolveInput && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleResolveSubmit}
              style={{ marginTop: '10px', display: 'flex', gap: '6px' }}
            >
              <input
                autoFocus
                value={resolveSummary}
                onChange={(e) => setResolveSummary(e.target.value)}
                placeholder="Describe the resolution..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(129,140,248,0.3)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--green-dim)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--green)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Resolve
              </button>
              <button
                type="button"
                onClick={() => setShowResolveInput(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Hover action toolbar */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              right: '12px',
              top: '-18px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#1a2235',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              zIndex: 10,
            }}
          >
            {/* Emoji picker toggle button */}
            <button
              onClick={() => setShowPicker(!showPicker)}
              style={{
                background: showPicker ? 'rgba(129,140,248,0.2)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: showPicker ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '16px',
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.1s, color 0.1s',
                fontWeight: 700,
              }}
              title="Add reaction"
              onMouseEnter={(e) => { if (!showPicker) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; } }}
              onMouseLeave={(e) => { if (!showPicker) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; } }}
            >
              +
            </button>

            {/* Divider */}
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

            {/* Thread button */}
            {!isThreadView && (
              <button
                onClick={() => onOpenThread && onOpenThread(message)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '3px 4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.1s',
                }}
                title="Reply in thread"
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <MessageSquare style={{ width: '13px', height: '13px' }} />
              </button>
            )}

            {/* Resolve button — only for Question tags, and only Reviewer/Decision Maker */}
            {!isThreadView && tag === 'Question' && !resolved && 
             (currentUser?.role === 'Reviewer' || currentUser?.role === 'Decision Maker') && (
              <>
                <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
                <button
                  onClick={() => setShowResolveInput(true)}
                  style={{
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.25)',
                    borderRadius: '5px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--green)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mark Resolved
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover Emoji Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              right: '48px',
              top: '-48px',
              background: '#1a2235',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 30,
            }}
            onMouseLeave={() => setShowPicker(false)}
          >
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setShowPicker(false);
                  onReact && onReact(emoji);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'transform 0.1s, background 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.2)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'none';
                }}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MessageBubble;
