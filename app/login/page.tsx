'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../theme-context';

const ARCHETYPES_PREVIEW = [
  { emoji: '🍜', name: 'The Foodie',          color: '#d97706' },
  { emoji: '🌎', name: 'The Explorer',        color: '#16a34a' },
  { emoji: '💎', name: 'The Wealth Builder',  color: '#7c3aed' },
  { emoji: '⚡', name: 'The Minimalist',      color: '#2563eb' },
  { emoji: '🛍️', name: 'The Shopaholic',     color: '#db2777' },
  { emoji: '📱', name: 'The Tech Enthusiast', color: '#0891b2' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const bg       = isDark ? '#0a0a0a' : '#fafafa';
  const cardBg   = isDark ? '#1a1a1a' : '#ffffff';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5';
  const text     = isDark ? '#fafafa' : '#0a0a0a';
  const muted    = isDark ? '#8a8a8a' : '#6b6b6b';
  const inputBg  = isDark ? '#1f1f1f' : '#ffffff';

  const inputStyle: React.CSSProperties = {
    width: '100%', background: inputBg, border: `1px solid ${border}`,
    borderRadius: 10, padding: '12px 14px', fontSize: 15,
    color: text, outline: 'none', boxSizing: 'border-box',
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push(callbackUrl);
    } else {
      setError('Incorrect email or password. Please try again.');
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
            Welcome back.<br />Let&apos;s see where<br />your money drifted.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 40 }}>
            Track your habits. Discover your archetype.<br />Drift toward better.
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
            <p style={{ color: muted, fontSize: 14, marginTop: 8 }}>Welcome back. Let&apos;s see where your money drifted.</p>
          </div>

          {/* Subtitle — desktop */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: muted, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>SIGN IN</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: text, letterSpacing: '-0.5px' }}>Welcome back</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
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
                  placeholder="••••••••"
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: muted }}>
            No account?{' '}
            <Link href="/register" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>
              Get started free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fafafa' }} />}>
      <LoginForm />
    </Suspense>
  );
}
