import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Hash, Loader2, X, CheckCircle, AlertCircle, Info, ChevronUp } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import ContextBar from './ContextBar';
import MessageBubble from './MessageBubble';
import ThreadPanel from './ThreadPanel';
import api, { getStoredUser, getApiBaseUrl, getSocketUrl } from '../api';

/* ─── Toast System ─── */
let toastId = 0;
const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
};

const ToastContainer = ({ toasts, onRemove }) => (
  <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
    <AnimatePresence>
      {toasts.map(toast => {
        const colors = {
          success: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', icon: <CheckCircle style={{ width: '15px', height: '15px' }} /> },
          error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: <AlertCircle style={{ width: '15px', height: '15px' }} /> },
          info:    { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.3)', icon: <Info style={{ width: '15px', height: '15px' }} /> },
        };
        const c = colors[toast.type] || colors.info;
        return (
          <motion.div key={toast.id}
            initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontFamily: 'var(--font-sans)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', minWidth: '220px', maxWidth: '320px', pointerEvents: 'all' }}
          >
            {c.icon}
            <span style={{ flex: 1, color: 'var(--text-primary)' }}>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}>
              <X style={{ width: '13px', height: '13px' }} />
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
);

/* ─── Typing Indicator ─── */
const TypingIndicator = ({ typers }) => {
  if (!typers.length) return null;
  const label = typers.length === 1 ? `${typers[0]} is typing…` : `${typers.join(', ')} are typing…`;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 8px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[0,1,2].map(i => <span key={i} className="typing-dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />)}
      </div>
      {label}
    </motion.div>
  );
};

/* ─── Day Divider ─── */
const DAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: undefined, year: 'numeric', month: 'long', day: 'numeric' });
const dayLabel = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return DAY_FMT.format(d);
};

const DayDivider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 8px 8px', userSelect: 'none' }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)', background: 'var(--bg-base)', padding: '0 8px' }}>
      {label}
    </span>
    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
  </div>
);

/* ─── Insert day dividers between messages ─── */
const withDividers = (messages) => {
  const out = [];
  let lastDay = null;
  for (const msg of messages) {
    const label = dayLabel(msg.created_at);
    if (label !== lastDay) {
      out.push({ type: 'divider', id: `div-${msg.id}`, label });
      lastDay = label;
    }
    out.push({ type: 'message', ...msg });
  }
  return out;
};

/* ─── Tag config ─── */
const TAGS = ['Update', 'Question', 'Decision', 'Idea'];
const TAG_COLORS = {
  Update:   { active: '#818cf8', activeBg: 'rgba(129,140,248,0.2)' },
  Question: { active: '#fbbf24', activeBg: 'rgba(251,191,36,0.2)' },
  Decision: { active: '#34d399', activeBg: 'rgba(52,211,153,0.2)' },
  Idea:     { active: '#f472b6', activeBg: 'rgba(244,114,182,0.2)' },
};
const FILTERS = ['All', 'Updates', 'Questions', 'Decisions', 'Ideas'];

/* ─── Main ChatArea ─── */
const ChatArea = ({ channelId = '1', channels = [], currentUser }) => {
  const socketRef      = useRef(null);
  const normalizedChannelId = channelId ? String(channelId) : null;
  const [messages, setMessages]       = useState([]);
  const [filter, setFilter]           = useState('All');
  const [tag, setTag]                 = useState('Update');
  const [inputText, setInputText]     = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typers, setTypers]           = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(false);

  const [activeThread, setActiveThread]     = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const listRef        = useRef(null);
  const topSentinelRef = useRef(null);  // IntersectionObserver target
  const typingTimerRef = useRef(null);
  const isTypingRef    = useRef(false);
  const oldestIdRef    = useRef(null);  // cursor for infinite scroll
  const { toasts, addToast, removeToast } = useToasts();

  const getUser = () => currentUser || getStoredUser() || { id: 0, username: 'Unknown', name: 'Unknown' };

  /* ── Load history via REST ── */
  const loadHistory = useCallback(async (chId, beforeId = null) => {
    const isInitial = beforeId === null;
    if (isInitial) setHistoryLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: '50' });
      if (beforeId) params.set('before', String(beforeId));

      const { data } = await api.get(`/api/channels/${chId}/messages?${params}`);
      const incoming = data.messages || [];

      setHasMore(data.hasMore ?? false);
      if (incoming.length > 0) {
        oldestIdRef.current = incoming[0].id;
      }

      if (isInitial) {
        setMessages(incoming);
        // Scroll to bottom after initial load
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 80);
      } else {
        const el = listRef.current;
        const previousScrollHeight = el?.scrollHeight || 0;
        const previousScrollTop = el?.scrollTop || 0;

        // Prepend older messages, preserve scroll position
        setMessages(prev => [...incoming, ...prev]);

        // Using requestAnimationFrame to ensure the DOM has updated with new messages
        requestAnimationFrame(() => {
          if (el) {
            const heightDiff = el.scrollHeight - previousScrollHeight;
            el.scrollTop = previousScrollTop + heightDiff;
          }
        });
      }
    } catch (err) {
      console.warn('History load failed, using socket fallback');
      if (isInitial) setMessages([]);
    } finally {
      if (isInitial) setHistoryLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  /* ── Infinite scroll via IntersectionObserver ── */
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && oldestIdRef.current && normalizedChannelId) {
              loadHistory(normalizedChannelId, oldestIdRef.current);
        }
      },
      { root: listRef.current, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [normalizedChannelId, hasMore, loadingMore, loadHistory]);

  /* ── Thread Handling ── */
  const handleOpenThread = async (msg) => {
    setActiveThread(msg);
    setThreadMessages([]);
    try {
      const { data } = await api.get(`/api/messages/${msg.id}/replies`);
      setThreadMessages(data.replies || []);
    } catch (err) {
      console.error('Failed to load thread replies:', err);
      addToast('Failed to load thread', 'error');
    }
  };

  const handleCloseThread = () => {
    setActiveThread(null);
    setThreadMessages([]);
  };

  const handleSendReply = (content) => {
    const sock = socketRef.current;
    if (sock && isConnected && activeThread && normalizedChannelId) {
      const user = getUser();
      sock.emit('send_message', {
        channelId: Number(normalizedChannelId),
        userId: user.id || 1,
        content,
        tag: null, // replies typically untagged or use parent tag? Let's use null
        parentId: activeThread.id,
        user: { name: user.username || user.name },
      });
    } else {
      addToast('Must be connected to reply', 'error');
    }
  };

  /* ── Socket connection — re-runs when channelId changes ── */
  useEffect(() => {
    if (!normalizedChannelId) return;

    setMessages([]);
    oldestIdRef.current = null;
    setHasMore(false);

    // Load REST history immediately
    loadHistory(normalizedChannelId);

    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, { reconnectionDelay: 1000, reconnectionAttempts: 5 });
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_channel', { channelId: Number(normalizedChannelId) });
      addToast('Connected to Kōru', 'success', 2500);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      addToast('Disconnected — reconnecting…', 'error', 4000);
    });

    newSocket.on('connect_error', () => {
      addToast('Connection failed. Running in offline mode.', 'error', 4000);
    });

    newSocket.on('new_message', (msg) => {
      if (msg.parent_id) {
        // It's a reply
        setMessages(prev => prev.map(m => 
          m.id === msg.parent_id ? { ...m, reply_count: (m.reply_count || 0) + 1 } : m
        ));
        
        setActiveThread(currThread => {
          if (currThread && currThread.id === msg.parent_id) {
            setThreadMessages(prev => [...prev, msg]);
          }
          return currThread;
        });
      } else {
        // Top-level message
        setMessages(prev => [...prev, msg]);
        setTimeout(() => {
          const el = listRef.current;
          if (!el || el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 60);
      }
    });

    newSocket.on('reaction_updated', ({ messageId, reactions }) => {
      // Update both main messages and thread messages
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
      setThreadMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
      setActiveThread(curr => curr && curr.id === messageId ? { ...curr, reactions } : curr);
    });

    newSocket.on('thread_resolved', ({ messageId, summary }) => {
      const updates = { resolved: true, resolution_summary: summary };
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...updates } : m));
      setThreadMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...updates } : m));
      setActiveThread(curr => curr && curr.id === messageId ? { ...curr, ...updates } : curr);
    });

    newSocket.on('user_typing', ({ username }) => {
      setTypers(prev => prev.includes(username) ? prev : [...prev, username]);
    });

    newSocket.on('user_stopped_typing', ({ username }) => {
      setTypers(prev => prev.filter(u => u !== username));
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [normalizedChannelId]);

  /* ── Typing helpers ── */
  const emitTypingStop = useCallback(() => {
    const sock = socketRef.current;
    if (!sock || !isTypingRef.current) return;
    const user = getUser();
    if (!normalizedChannelId) return;
    sock.emit('typing_stop', { channelId: Number(normalizedChannelId), userId: user.id, username: user.username || user.name });
    isTypingRef.current = false;
  }, [normalizedChannelId]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); return; }
    const sock = socketRef.current;
    if (!sock) return;
    const user = getUser();
    if (!normalizedChannelId) return;
    if (!isTypingRef.current) {
      sock.emit('typing_start', { channelId: Number(normalizedChannelId), userId: user.id, username: user.username || user.name });
      isTypingRef.current = true;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitTypingStop, 1500);
  };

  /* ── Send message ── */
  const handleSend = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!inputText.trim() || !normalizedChannelId) return;
    const user = getUser();
    const sock = socketRef.current;

    if (sock && isConnected) {
      sock.emit('send_message', {
        channelId: Number(normalizedChannelId),
        userId: user.id || 1,
        content: inputText.trim(),
        tag,
        user: { name: user.username || user.name },
      });
    } else {
      const offlineMsg = {
        id: Date.now(),
        content: inputText.trim(),
        tag,
        created_at: new Date().toISOString(),
        user: { name: user.username || user.name || 'You' },
        reactions: [],
        resolved: false,
        resolution_summary: null,
      };
      setMessages(prev => [...prev, offlineMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      addToast('Message saved locally (offline)', 'info', 2000);
    }

    emitTypingStop();
    clearTimeout(typingTimerRef.current);
    setInputText('');
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await api.post(`/api/messages/${messageId}/reactions`, { emoji });
      // The socket event 'reaction_updated' will update the UI.
    } catch (err) {
      console.error('Reaction failed:', err);
      addToast('Failed to toggle reaction', 'error');
    }
  };

  const handleResolve = async (messageId, summary) => {
    try {
      await api.patch(`/api/messages/${messageId}/resolve`, {
        resolved: true,
        resolution_summary: summary
      });
      // The socket event 'thread_resolved' will update the UI.
    } catch (err) {
      console.error('Resolve failed:', err);
      addToast('Failed to resolve thread', 'error');
    }
  };

  /* ── Filter + day dividers ── */
  const filtered = messages.filter(m => {
    if (filter === 'All') return true;
    const tagMap = { Updates: 'update', Questions: 'question', Decisions: 'decision', Ideas: 'idea' };
    return (m.tag || '').toLowerCase() === (tagMap[filter] || filter.toLowerCase());
  });
  const items = withDividers(filtered);

  const activeChannel = channels.find(ch => String(ch.id) === String(normalizedChannelId));
  const channelName = activeChannel?.name || 'general';
  const channelDescription = activeChannel?.description
    || (channelName === 'general' ? 'Team-wide announcements and discussion' : `#${channelName} channel`);

  const openQuestionsCount = messages.filter(m => m.tag === 'Question' && !m.resolved).length;
  const recentDecisions = messages
    .filter(m => m.tag === 'Decision' && (m.resolved || m.resolution_summary))
    .slice(-2)
    .map(m => m.resolution_summary || m.content);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: 'var(--bg-base)', overflow: 'hidden', fontFamily: 'var(--font-sans)', borderRight: activeThread ? '1px solid var(--border-subtle)' : 'none' }}>

        {/* Decorative orb */}
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />

      {/* Header */}
      <div style={{ height: '56px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,15,30,0.8)', backdropFilter: 'blur(12px)', flexShrink: 0, zIndex: 20, gap: '10px' }}>
        <Hash style={{ width: '16px', height: '16px', color: 'var(--accent)', flexShrink: 0 }} />
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{channelName}</h2>
        <span style={{ height: '16px', width: '1px', background: 'var(--border-subtle)', margin: '0 4px' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {channelDescription}
        </span>
        {!isConnected && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', padding: '3px 10px', borderRadius: '999px' }}>
            <Loader2 style={{ width: '11px', height: '11px' }} className="animate-spin" /> Connecting…
          </span>
        )}
        {isConnected && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--green)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', padding: '3px 10px', borderRadius: '999px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} className="animate-breath" />
            Live
          </span>
        )}
      </div>

        {/* Context Bar */}
        <ContextBar decisions={recentDecisions} openQuestions={openQuestionsCount} />

        {/* Filter tabs */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0, borderBottom: '1px solid var(--border-subtle)' }} className="scrollbar-hide">
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <button key={f} id={`filter-${f.toLowerCase()}`} onClick={() => setFilter(f)}
              style={{ padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, border: active ? 'none' : '1px solid rgba(255,255,255,0.08)', background: active ? 'var(--accent)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: active ? '0 0 12px rgba(129,140,248,0.4)' : 'none', fontFamily: 'var(--font-sans)' }}>
              {f}
            </button>
          );
        })}
      </div>

      {/* Messages list */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0 8px 4px', display: 'flex', flexDirection: 'column' }} className="scrollbar-thin">

        {/* Infinite scroll sentinel — sits at the very top */}
        <div ref={topSentinelRef} style={{ height: '1px', flexShrink: 0 }} />

        {/* Load more spinner */}
        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
            <Loader2 style={{ width: '18px', height: '18px', color: 'var(--accent)' }} className="animate-spin" />
          </div>
        )}

        {/* Load more button fallback */}
        {hasMore && !loadingMore && (
          <button onClick={() => loadHistory(normalizedChannelId, oldestIdRef.current)}
            style={{ alignSelf: 'center', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', color: 'var(--accent)', borderRadius: '999px', padding: '5px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            <ChevronUp style={{ width: '13px', height: '13px' }} /> Load older messages
          </button>
        )}

        {/* Initial loading */}
        {historyLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
            <Loader2 style={{ width: '20px', height: '20px', color: 'var(--accent)' }} className="animate-spin" />
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>Loading messages…</span>
          </div>
        ) : items.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5, gap: '12px' }}>
            <Hash style={{ width: '48px', height: '48px' }} />
            <p style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--font-sans)' }}>No messages yet — break the ice!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <AnimatePresence initial={false}>
              {items.map(item =>
                item.type === 'divider'
                  ? <DayDivider key={item.id} label={item.label} />
                  : (
                    <MessageBubble
                      key={item.id}
                      message={item}
                      onReact={(emoji) => handleReact(item.id, emoji)}
                      onResolve={handleResolve}
                      onOpenThread={handleOpenThread}
                      currentUser={getUser()}
                    />
                  )
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typers.length > 0 && <TypingIndicator typers={typers} />}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div style={{ padding: '0 16px 16px', flexShrink: 0, zIndex: 20 }}>
        {/* Tag selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Tag:</span>
          {TAGS.map(t => {
            const active = tag === t;
            const cfg = TAG_COLORS[t];
            return (
              <button key={t} id={`tag-${t.toLowerCase()}`} type="button" onClick={() => setTag(t)}
                style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', border: active ? 'none' : '1px solid rgba(255,255,255,0.1)', background: active ? cfg.activeBg : 'transparent', color: active ? cfg.active : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'var(--font-sans)', boxShadow: active ? `0 0 10px ${cfg.active}44` : 'none' }}>
                {t}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <form onSubmit={handleSend}
          style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: '10px 12px', transition: 'border-color 0.2s, box-shadow 0.2s' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.1)'; }}
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; } }}>
          <textarea
            id="message-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={`Type a ${tag.toLowerCase()}… (Enter to send)`}
            rows={1}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-sans)', lineHeight: 1.6, maxHeight: '120px', minHeight: '22px', padding: 0 }}
            className="scrollbar-hide"
          />
          <motion.button id="send-message-btn" type="submit" disabled={!inputText.trim()}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} className="ripple-btn"
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: inputText.trim() ? 'var(--accent)' : 'rgba(129,140,248,0.2)', border: 'none', cursor: inputText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s, box-shadow 0.2s', boxShadow: inputText.trim() ? '0 0 16px rgba(129,140,248,0.4)' : 'none' }}>
            <Send style={{ width: '15px', height: '15px', color: 'white' }} />
          </motion.button>
        </form>
      </div>
      
      </div>
      
      {/* Thread Panel */}
      <AnimatePresence>
        {activeThread && (
          <ThreadPanel
            activeThread={activeThread}
            threadMessages={threadMessages}
            onClose={handleCloseThread}
            onSendReply={handleSendReply}
            currentUser={getUser()}
            onReact={handleReact}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ChatArea;
