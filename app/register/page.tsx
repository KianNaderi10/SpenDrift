'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTheme } from '../theme-context';

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const bg = isDark ? '#0a0a0a' : '#fafafa';
  const cardBg = isDark ? '#1a1a1a' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5';
  const text = isDark ? '#fafafa' : '#0a0a0a';
  const muted = isDark ? '#8a8a8a' : '#6b6b6b';
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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? 'Registration failed');
      return;
    }
    toast.success('Account created! Signing you in...');
    // Auto sign-in
    const { signIn } = await import('next-auth/react');
    const signInRes = await signIn('credentials', { email, password, redirect: false });
    if (signInRes?.ok) {
      // Seed default budgets
      await fetch('/api/seed-budgets', { method: 'POST' });
      router.push('/dashboard');
    } else {
      router.push('/login');
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
          <p style={{ color: muted, fontSize: 15, marginTop: 8 }}>Start your spending personality journey.</p>
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
          <h2 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 24 }}>Create your account</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
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
                placeholder="Min 6 characters"
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#6b6b6b' : isDark ? '#22c55e' : '#16a34a',
                color: '#ffffff',
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: muted }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
