import React from 'react';
import { Target, HelpCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ContextBar = ({ decisions = [], openQuestions = 3 }) => {
  const defaultDecisions = decisions.length > 0 ? decisions : [
    'Migrate to PostgreSQL by Q3',
    'Use Inter for UI typography',
  ];

  return (
    <motion.div
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        margin: '12px 16px 0',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(129, 140, 248, 0.08)',
        border: '1px solid rgba(129, 140, 248, 0.2)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        padding: '10px 14px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        zIndex: 10,
      }}
    >
      {/* Subtle shimmer accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.5), transparent)',
        }}
      />

      {/* Left — Decisions */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--green)',
            flexShrink: 0,
          }}
        >
          <Target style={{ width: '13px', height: '13px' }} />
          Recent Decisions:
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {defaultDecisions.map((decision, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'default',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <CheckCircle style={{ width: '10px', height: '10px', color: 'var(--green)', flexShrink: 0 }} />
              {decision}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right — Open Questions */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: '999px',
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#fbbf24',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 0 10px rgba(251,191,36,0.1)',
        }}
      >
        <HelpCircle style={{ width: '12px', height: '12px' }} />
        {openQuestions} Open Questions
      </motion.div>
    </motion.div>
  );
};

export default ContextBar;
