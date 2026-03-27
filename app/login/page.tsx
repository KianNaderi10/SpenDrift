'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTheme } from '../theme-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const bg = isDark ? '#0a0a0a' : '#f8fafc';
  const cardBg = isDark ? '#1a1a1a' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const text = isDark ? '#f0f2f8' : '#0f172a';
  const muted = '#64748b';
  const inputBg = isDark ? '#1f1f1f' : '#ffffff';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 15,
    color: text,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push(callbackUrl);
    } else {
      toast.error('Invalid email or password');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: 16,
          color: muted,
          zIndex: 10,
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 32, fontWeight: 800 }}>
              <span style={{ color: text }}>Spen</span>
              <span style={{ color: '#16a34a' }}>Drift</span>
            </span>
          </Link>
          <p style={{ color: muted, fontSize: 15, marginTop: 8 }}>Welcome back. Let&apos;s see where your money drifted.</p>
        </div>

        {/* Card */}
        <div style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 20,
          padding: '36px 32px',
          marginBottom: 24,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 24 }}>Sign in to your account</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#374151' : isDark ? '#ffffff' : '#0a0a0a',
                color: isDark ? '#0a0a0a' : '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '13px',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Archetype preview chips */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {[
            { emoji: '🍜', color: '#d97706', label: 'Foodie' },
            { emoji: '🌎', color: '#16a34a', label: 'Explorer' },
            { emoji: '🛍️', color: '#db2777', label: 'Shopaholic' },
            { emoji: '⚡', color: '#2563eb', label: 'Minimalist' },
          ].map(a => (
            <div key={a.label} style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: '10px 12px',
              textAlign: 'center',
              flex: 1,
              boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 18 }}>{a.emoji}</div>
              <div style={{ fontSize: 10, color: a.color, fontWeight: 700, marginTop: 4 }}>{a.label}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: muted }}>
          No account?{' '}
          <Link href="/register" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>
            Get started free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc' }} />}>
      <LoginForm />
    </Suspense>
  );
}
