import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Zap, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { saveAuth } from '../api';

/* ─── Validation ─────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (fields, isLogin) => {
  const errs = {};
  if (!isLogin && !fields.username.trim()) {
    errs.username = 'Username is required';
  } else if (!isLogin && fields.username.trim().length < 2) {
    errs.username = 'Username must be at least 2 characters';
  }
  if (!fields.email.trim()) {
    errs.email = 'Email is required';
  } else if (!EMAIL_RE.test(fields.email)) {
    errs.email = 'Enter a valid email address';
  }
  if (!fields.password) {
    errs.password = 'Password is required';
  } else if (fields.password.length < 6) {
    errs.password = 'Password must be at least 6 characters';
  }
  return errs;
};

/* ─── Styled input component ─────────────────────────────── */
const Field = ({ id, label, name, type, placeholder, value, onChange, onBlur, error, touched, rightEl }) => {
  const hasError = touched && error;
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '6px',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={name === 'password' ? 'current-password' : name === 'email' ? 'email' : name}
          style={{
            width: '100%',
            padding: rightEl ? '10px 42px 10px 14px' : '10px 14px',
            borderRadius: '10px',
            border: hasError
              ? '1px solid rgba(239,68,68,0.6)'
              : '1px solid rgba(255,255,255,0.1)',
            background: hasError ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.04)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = hasError
              ? 'rgba(239,68,68,0.7)'
              : 'rgba(129,140,248,0.55)';
            e.target.style.boxShadow = hasError
              ? '0 0 0 3px rgba(239,68,68,0.1)'
              : '0 0 0 3px rgba(129,140,248,0.12)';
          }}
          onBlurCapture={(e) => {
            e.target.style.borderColor = hasError
              ? 'rgba(239,68,68,0.6)'
              : 'rgba(255,255,255,0.1)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p
            key={`err-${name}`}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '5px' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            style={{
              fontSize: '12px',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-sans)',
              margin: '5px 0 0',
            }}
          >
            <AlertCircle style={{ width: '11px', height: '11px', flexShrink: 0 }} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Login Page ────────────────────────────────────── */
const Login = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched]   = useState({});
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const navigate = useNavigate();

  /* Keep validation in sync as user types */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    setServerError('');
    setSuccessMsg('');
    if (touched[name]) {
      const errs = validate(next, isLoginMode);
      setFieldErrors(prev => ({ ...prev, [name]: errs[name] || '' }));
    }
  }, [formData, touched, isLoginMode]);

  /* Mark field as touched when user leaves it */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errs = validate(formData, isLoginMode);
    setFieldErrors(prev => ({ ...prev, [name]: errs[name] || '' }));
  }, [formData, isLoginMode]);

  /* Map server error strings to friendly messages */
  const mapServerError = (msg = '') => {
    if (!msg) return 'Something went wrong. Please try again.';
    if (/already exists/i.test(msg)) return 'That email or username is already taken.';
    if (/invalid credentials/i.test(msg)) return 'Incorrect email or password.';
    if (/server error/i.test(msg)) return 'Server error — please try again in a moment.';
    return msg;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Touch all fields to surface any remaining errors
    const allTouched = { username: true, email: true, password: true };
    setTouched(allTouched);
    const errs = validate(formData, isLoginMode);
    setFieldErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const payload  = isLoginMode
        ? { email: formData.email.trim(), password: formData.password }
        : { username: formData.username.trim(), email: formData.email.trim(), password: formData.password };

      const { data } = await api.post(endpoint, payload);
      // Persist token + user under the canonical keys
      saveAuth(data.token, data.user);
      onLoginSuccess(data.user);
      navigate('/app');
    } catch (err) {
      /* Demo bypass — works even when DB is offline */
      if (isLoginMode && formData.email.trim() === 'demo@example.com') {
        const demoUser = { id: 1, username: 'Demo User', name: 'Demo User', email: 'demo@example.com', role: 'Decision Maker' };
        // Use a fake but structurally valid JWT payload for demo mode
        saveAuth('demo_token', demoUser);
        onLoginSuccess(demoUser);
        navigate('/app');
        return;
      }
      const msg = err.response?.data?.error || '';
      setServerError(mapServerError(msg));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(m => !m);
    setFormData({ username: '', email: '', password: '' });
    setFieldErrors({});
    setTouched({});
    setServerError('');
    setSuccessMsg('');
    setShowPw(false);
  };

  /* ── Form field definitions ── */
  const registerFields = [
    {
      id: 'field-username', label: 'Username', name: 'username',
      type: 'text', placeholder: 'johndoe',
    },
    {
      id: 'field-email', label: 'Email Address', name: 'email',
      type: 'email', placeholder: 'you@example.com',
    },
  ];
  const loginFields = [
    {
      id: 'field-email', label: 'Email Address', name: 'email',
      type: 'email', placeholder: 'you@example.com',
    },
  ];
  const sharedFields = isLoginMode ? loginFields : registerFields;

  return (
    <div
      style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}
    >
      {/* ── Decorative orbs ── */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.13) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '35%', right: '18%', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      {/* ── Dot grid ── */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(129,140,248,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: '420px', position: 'relative',
          background: 'rgba(13,21,37,0.88)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(129,140,248,0.08)',
          padding: '36px 32px 28px',
        }}
      >
        {/* Top gradient line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', borderRadius: '18px 18px 0 0', background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.65), transparent)' }} />

        {/* ── Logo ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 280, damping: 18 }}
            style={{
              width: '52px', height: '52px', borderRadius: '14px', marginBottom: '14px',
              background: 'rgba(129,140,248,0.12)',
              border: '1px solid rgba(129,140,248,0.32)',
              boxShadow: '0 0 28px rgba(129,140,248,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Zap style={{ width: '24px', height: '24px', color: 'var(--accent)' }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0, fontFamily: 'var(--font-sans)', lineHeight: 1 }}
          >
            <span style={{ color: 'var(--text-primary)' }}>Kō</span>
            <span style={{ color: 'var(--accent)' }}>ru</span>
          </motion.h1>

          {/* Mode subtitle — animates on switch */}
          <AnimatePresence mode="wait">
            <motion.p
              key={isLoginMode ? 'login-sub' : 'reg-sub'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-sans)' }}
            >
              {isLoginMode ? 'Welcome back — sign in to continue' : 'Create an account to get started'}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── Global server error / success ── */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              key="server-err"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.09)',
                border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <AlertCircle style={{ width: '15px', height: '15px', color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: '#f87171', lineHeight: 1.4 }}>{serverError}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              key="success"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(52,211,153,0.09)',
                border: '1px solid rgba(52,211,153,0.25)',
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <CheckCircle2 style={{ width: '15px', height: '15px', color: 'var(--green)', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '13px', color: 'var(--green)', lineHeight: 1.4 }}>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Fields that change between modes (username + shared email, or just email) */}
          <AnimatePresence initial={false}>
            {sharedFields.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
              >
                <Field
                  {...f}
                  value={formData[f.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors[f.name]}
                  touched={touched[f.name]}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Password field — always present, with show/hide toggle */}
          <Field
            id="field-password"
            label="Password"
            name="password"
            type={showPw ? 'text' : 'password'}
            placeholder={isLoginMode ? '••••••••' : 'Min. 6 characters'}
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldErrors.password}
            touched={touched.password}
            rightEl={
              <button
                type="button"
                id="toggle-password-btn"
                onClick={() => setShowPw(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', padding: 0, display: 'flex', alignItems: 'center',
                }}
                title={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw
                  ? <EyeOff style={{ width: '16px', height: '16px' }} />
                  : <Eye    style={{ width: '16px', height: '16px' }} />
                }
              </button>
            }
          />

          {/* Submit button */}
          <motion.button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '11px',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: loading ? 'none' : '0 0 22px rgba(129,140,248,0.38)',
              transition: 'box-shadow 0.2s, opacity 0.2s',
            }}
          >
            {loading && <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />}
            {loading
              ? (isLoginMode ? 'Signing in…' : 'Creating account…')
              : (isLoginMode ? 'Sign In' : 'Create Account')
            }
          </motion.button>
        </form>

        {/* ── Toggle mode link ── */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
          <button
            id="auth-toggle-btn"
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent)', fontWeight: 600, fontSize: '13px',
              fontFamily: 'var(--font-sans)', padding: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--accent)'; }}
          >
            {isLoginMode ? 'Create one' : 'Sign in instead'}
          </button>
        </div>

        {/* ── Demo hint ── */}
        <div
          style={{
            marginTop: '16px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(129,140,248,0.06)',
            border: '1px solid rgba(129,140,248,0.12)',
            fontSize: '11px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.5,
          }}
        >
          Try the demo: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>demo@example.com</span> / any password
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
