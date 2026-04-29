import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

const ThreadPanel = ({
  activeThread,
  threadMessages,
  onClose,
  onSendReply,
  currentUser,
  onReact,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new replies
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendReply(inputText.trim());
    setInputText('');
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!activeThread) return null;

  return (
    <motion.div
      initial={{ x: 350, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 350, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        width: '350px',
        background: 'var(--bg-sidebar)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 30,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Header */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Thread</h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="scrollbar-thin">
        {/* Original Message */}
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <MessageBubble
            message={activeThread}
            onReact={onReact}
            currentUser={currentUser}
            isThreadView={true}
          />
        </div>

        {/* Replies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {threadMessages.length} {threadMessages.length === 1 ? 'reply' : 'replies'}
          </div>
          <AnimatePresence initial={false}>
            {threadMessages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onReact={onReact}
                currentUser={currentUser}
                isThreadView={true}
              />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            background: 'var(--bg-input)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: '8px 12px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(129,140,248,0.1)';
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Reply..."
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
              maxHeight: '100px',
              minHeight: '20px',
              padding: 0,
            }}
            className="scrollbar-hide"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              background: 'none',
              border: 'none',
              color: inputText.trim() ? 'var(--accent)' : 'var(--text-muted)',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
            }}
          >
            <Send style={{ width: '16px', height: '16px' }} />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ThreadPanel;
