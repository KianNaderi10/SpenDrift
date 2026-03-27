'use client';
import Link from 'next/link';
import { useTheme } from './theme-context';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { toggle } = useTheme();
  const [isDark, setIsDark] = useState(false);

  // Read theme from DOM after mount — avoids any server/client mismatch
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const archetypes = [
    { emoji: '🏠', name: 'The Homebody',        color: '#60a5fa', desc: 'Bills, groceries, and comfort spending define you.' },
    { emoji: '🍜', name: 'The Foodie',          color: '#fbbf24', desc: 'You live to eat — dining dominates your spending.' },
    { emoji: '🛍️', name: 'The Shopaholic',     color: '#f472b6', desc: 'Retail therapy is real. Shopping is your outlet.' },
    { emoji: '🌎', name: 'The Explorer',        color: '#34d399', desc: 'You invest in travel, entertainment, and adventures.' },
    { emoji: '⚡', name: 'The Minimalist',      color: '#2dd4bf', desc: 'You spend with intention. Every purchase is deliberate.' },
    { emoji: '💎', name: 'The Wealth Builder',  color: '#a78bfa', desc: "You've mastered spending. Income exceeds expenses." },
    { emoji: '🎮', name: 'The Gamer',           color: '#22d3ee', desc: 'Gaming, subscriptions, and tech gear eat up your budget.' },
    { emoji: '💪', name: 'The Wellness Seeker', color: '#f43f5e', desc: 'Gym, supplements, and self-care dominate your spend.' },
    { emoji: '🍺', name: 'The Socialite',       color: '#fb923c', desc: 'Bars, events, and going out are your love language.' },
    { emoji: '📱', name: 'The Tech Junkie',     color: '#0ea5e9', desc: 'Gadgets, apps, and the latest devices always call your name.' },
    { emoji: '🐾', name: 'The Pet Parent',      color: '#b45309', desc: 'Your pet lives better than most people. No regrets.' },
    { emoji: '🎨', name: 'The Creative',        color: '#c026d3', desc: 'Hobbies, art, and music spending fuel your passion.' },
    { emoji: '🚗', name: 'The Road Warrior',    color: '#64748b', desc: 'Gas, car payments, and transport are your biggest drain.' },
    { emoji: '🎓', name: 'The Scholar',         color: '#eab308', desc: 'Books, courses, and education are your investment.' },
    { emoji: '🛒', name: 'The Impulse Buyer',    color: '#ef4444', desc: 'FOMO purchases, unplanned splurges — you\'ll deal with it later.' },
    { emoji: '👨‍👩‍👧', name: 'The Family First',   color: '#84cc16', desc: 'Kids, family dining, and household needs come before everything.' },
    { emoji: '🎰', name: 'The Gambler',           color: '#dc2626', desc: 'Betting, casino runs, and high-risk spending. The thrill is the point.' },
    { emoji: '👑', name: 'The Status Seeker',     color: '#d4af37', desc: 'Designer brands, luxury goods, and premium everything. You spend to be seen.' },
    { emoji: '💝', name: 'The Philanthropist',    color: '#fb7185', desc: 'Donations and giving dominate your budget. Your spending makes the world better.' },
    { emoji: '📈', name: 'The Speculator',        color: '#7c3aed', desc: 'Crypto, stocks, and high-risk investments are your playground.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: 64,
        background: 'var(--sidebar-bg)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--text)' }}>Spen</span>
          <span style={{ color: '#16a34a' }}>Drift</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            suppressHydrationWarning
            onClick={toggle}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--text-muted)',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link href="/login" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 16, fontWeight: 600 }}>
            Sign In
          </Link>
          <Link href="/register" style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            padding: '9px 20px',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 64px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--text)' }}>Spen</span>
            <span style={{ color: '#16a34a' }}>Drift</span>
          </span>
          <div style={{
            display: 'inline-block',
            background: 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: 20,
            padding: '8px 18px',
          }}>
            <span style={{ color: '#16a34a', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>SPENDING PERSONALITY TRACKER</span>
          </div>
        </div>

        <h1 style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginBottom: 28, letterSpacing: '-2px', color: 'var(--text)' }}>
          Know where your money goes.{' '}
          <span style={{ color: '#16a34a' }}>Before it&apos;s gone.</span>
        </h1>

        <p style={{ fontSize: 22, color: 'var(--text)', lineHeight: 1.8, marginBottom: 56, maxWidth: 760, opacity: 0.75 }}>
          Spendrift reveals your spending personality — your archetype. Track habits, spot drift, and evolve your money story one transaction at a time.
        </p>

        <div style={{ display: 'flex', gap: 16, marginBottom: 96, flexWrap: 'wrap' }}>
          <Link href="/register" style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            padding: '16px 40px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 20,
          }}>
            Get Started — Free
          </Link>
          <Link href="/login" style={{
            background: 'transparent',
            border: '2px solid #16a34a',
            color: '#16a34a',
            padding: '16px 40px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 20,
          }}>
            Sign In
          </Link>
        </div>

        {/* Archetype Previews */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 20, color: 'var(--text)', marginBottom: 28, fontWeight: 700, letterSpacing: 3 }}>DISCOVER YOUR ARCHETYPE</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {archetypes.map(a => (
              <div key={a.name} style={{
                background: `${a.color}18`,
                borderTop: `1px solid ${a.color}50`,
                borderRight: `1px solid ${a.color}50`,
                borderBottom: `1px solid ${a.color}50`,
                borderLeft: `6px solid ${a.color}`,
                borderRadius: 20,
                padding: '32px',
                boxShadow: `0 4px 20px ${a.color}20`,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: `${a.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, marginBottom: 20,
                }}>
                  {a.emoji}
                </div>
                <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 10, lineHeight: 1.4 }}>{a.name}</div>
                <p style={{ fontSize: 17, color: 'var(--text)', margin: 0, lineHeight: 1.9, opacity: 0.65 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 20, color: 'var(--text)', marginTop: 64, letterSpacing: 1 }}>
          No credit card required · Your data stays private
        </p>
      </div>
    </div>
  );
}
