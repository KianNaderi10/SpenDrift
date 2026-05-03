'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTheme } from '../theme-context';

const ARCHETYPES_PREVIEW = [
  { emoji: '🏋️', name: 'The Fitness Buff',   color: '#16a34a' },
  { emoji: '🎨', name: 'The Creative',        color: '#ea580c' },
  { emoji: '☕', name: 'The Café Dweller',    color: '#d4a574' },
  { emoji: '✈️', name: 'The Jet-Setter',     color: '#86efac' },
  { emoji: '🎮', name: 'The Gamer',           color: '#818cf8' },
  { emoji: '🐾', name: 'The Pet Parent',      color: '#f9a8d4' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const bg      = isDark ? '#0a0a0a' : '#fafafa';
  const cardBg  = isDark ? '#1a1a1a' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5';
  const text    = isDark ? '#fafafa' : '#0a0a0a';
  const muted   = isDark ? '#8a8a8a' : '#6b6b6b';
  const inputBg = isDark ? '#1f1f1f' : '#ffffff';

  const inputStyle: React.CSSProperties = {
    width: '100%', background: inputBg, border: `1px solid ${border}`,
    borderRadius: 10, padding: '12px 14px', fontSize: 15,
    color: text, outline: 'none', boxSizing: 'border-box',
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function passwordStrength(p: string): { label: string; color: string; width: string } {
    if (p.length === 0) return { label: '', color: '', width: '0%' };
    if (p.length < 6)   return { label: 'Too short', color: '#dc2626', width: '25%' };
    if (p.length < 8)   return { label: 'Weak', color: '#d97706', width: '45%' };
    const hasUpper = /[A-Z]/.test(p);
    const hasNum   = /[0-9]/.test(p);
    const hasSpec  = /[^A-Za-z0-9]/.test(p);
    const score = [hasUpper, hasNum, hasSpec].filter(Boolean).length;
    if (score >= 2) return { label: 'Strong', color: '#16a34a', width: '100%' };
    return { label: 'Fair', color: '#d97706', width: '65%' };
  }

  const strength = passwordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Registration failed. Please try again.');
      return;
    }
    toast.success('Account created! Signing you in...');
    const { signIn } = await import('next-auth/react');
    const signInRes = await signIn('credentials', { email, password, redirect: false });
    if (signInRes?.ok) {
      await fetch('/api/seed-budgets', { method: 'POST' });
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* Left brand panel — desktop only */}
      <div className="auth-split-left" style={{
        width: '46%', background: '#0a0a0a',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#ffffff' }}>Spen</span>
            <span style={{ color: '#16a34a' }}>Drift</span>
          </span>
        </Link>

        <div>
          <h2 style={{
            fontSize: 38, fontWeight: 800, color: '#ffffff',
            letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16,
          }}>
            Discover your<br />spending<br />personality.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 40 }}>
            Are you a Foodie, a Minimalist, or a<br />Jet-Setter? Find out in minutes.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {ARCHETYPES_PREVIEW.map(a => (
              <div key={a.name} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
            20 spending personalities to discover
          </span>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', background: bg, overflowY: 'auto', minHeight: '100vh',
        position: 'relative',
      }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          suppressHydrationWarning
          style={{
            position: 'absolute', top: 16, right: 16,
            background: cardBg, border: `1px solid ${border}`,
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            fontSize: 16, color: muted, zIndex: 10,
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo — mobile only */}
          <div className="auth-logo-mobile" style={{ textAlign: 'center', marginBottom: 36 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 30, fontWeight: 800 }}>
                <span style={{ color: text }}>Spen</span>
                <span style={{ color: '#16a34a' }}>Drift</span>
              </span>
            </Link>
            <p style={{ color: muted, fontSize: 14, marginTop: 8 }}>Start your spending personality journey.</p>
          </div>

          {/* Subtitle — desktop */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: muted, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>GET STARTED</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: text, letterSpacing: '-0.5px' }}>Create your account</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                required
                placeholder="Your name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  placeholder="Min 6 characters"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: muted, fontSize: 16, padding: 4, lineHeight: 1,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 3, background: border, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: strength.width, height: '100%', background: strength.color, borderRadius: 4, transition: 'width 0.3s ease, background 0.3s ease' }} />
                  </div>
                  <p style={{ fontSize: 11, color: strength.color, fontWeight: 600, marginTop: 4 }}>{strength.label}</p>
                </div>
              )}
            </div>
            {error && (
              <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, marginTop: -6 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#6b6b6b' : isDark ? '#22c55e' : '#16a34a',
                color: '#ffffff', border: 'none', borderRadius: 10,
                padding: '13px', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: error ? 0 : 4, transition: 'background 0.2s',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: muted }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
