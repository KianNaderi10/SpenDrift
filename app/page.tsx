'use client';
import Link from 'next/link';
import { useTheme } from './theme-context';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { toggle } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Scroll-reveal: add .visible when element enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const archetypes = [
    { emoji: '🏠', name: 'The Homebody',        color: '#60a5fa' },
    { emoji: '🍜', name: 'The Foodie',          color: '#fbbf24' },
    { emoji: '🛍️', name: 'The Shopaholic',     color: '#f472b6' },
    { emoji: '🌎', name: 'The Explorer',        color: '#34d399' },
    { emoji: '⚡', name: 'The Minimalist',      color: '#2dd4bf' },
    { emoji: '💎', name: 'The Wealth Builder',  color: '#a78bfa' },
    { emoji: '🎮', name: 'The Gamer',           color: '#818cf8' },
    { emoji: '🎨', name: 'The Creative',        color: '#fb923c' },
    { emoji: '📚', name: 'The Learner',         color: '#38bdf8' },
    { emoji: '🏋️', name: 'The Fitness Buff',   color: '#4ade80' },
    { emoji: '🚗', name: 'The Commuter',        color: '#94a3b8' },
    { emoji: '🐾', name: 'The Pet Parent',      color: '#f9a8d4' },
    { emoji: '🍷', name: 'The Socialite',       color: '#e879f9' },
    { emoji: '💊', name: 'The Health Nut',      color: '#6ee7b7' },
    { emoji: '🎵', name: 'The Music Lover',     color: '#fcd34d' },
    { emoji: '📱', name: 'The Tech Enthusiast', color: '#67e8f9' },
    { emoji: '🏡', name: 'The Nester',          color: '#fdba74' },
    { emoji: '✈️', name: 'The Jet-Setter',     color: '#86efac' },
    { emoji: '☕', name: 'The Café Dweller',    color: '#d4a574' },
    { emoji: '🎭', name: 'The Experience Seeker', color: '#f87171' },
  ];
  const row1 = archetypes.slice(0, 10);
  const row2 = archetypes.slice(10, 20);

  const steps = [
    { step: '01', title: 'Create your account',    desc: 'Sign up in seconds — no credit card, no hidden fees. Your data stays private.' },
    { step: '02', title: 'Connect your bank (optional)', desc: 'Link your bank to automatically sync transactions, or skip this and log them manually — totally up to you.' },
    { step: '03', title: 'Log your transactions',   desc: 'Every purchase is tracked and categorized to build your spending profile over time.' },
    { step: '04', title: 'Discover your archetype', desc: 'Our engine analyzes your habits and assigns you one of 20 spending personalities.' },
    { step: '05', title: 'Track your drift',        desc: 'Watch your archetype evolve over time as your spending habits shift and grow.' },
  ];

  const heroAnim = (delay: number): React.CSSProperties => ({ animation: `fadeInUp 0.6s ease ${delay}s both` });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Nav */}
      <nav className="landing-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--text)' }}>Spen</span>
          <span style={{ color: '#16a34a' }}>Drift</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button suppressHydrationWarning onClick={toggle} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            fontSize: 16, color: 'var(--text-muted)',
          }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link href="/login" className="mobile-hide" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 16, fontWeight: 600 }}>
            Sign In
          </Link>
          <Link href="/register" style={{
            background: 'var(--accent)', color: 'var(--accent-text)',
            padding: '9px 20px', borderRadius: 6,
            textDecoration: 'none', fontWeight: 700, fontSize: 16,
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero — load-based animations */}
      <div className="landing-hero" style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 64px 80px' }}>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 32, ...heroAnim(0) }}>
          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--text)' }}>Spen</span>
            <span style={{ color: '#16a34a' }}>Drift</span>
          </span>
          <div className="mobile-hide" style={{
            display: 'inline-block', background: 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.2)', borderRadius: 20, padding: '8px 18px',
          }}>
            <span style={{ color: '#16a34a', fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>SPENDING PERSONALITY TRACKER</span>
          </div>
        </div>

        <h1 className="landing-h1" style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-2px', color: 'var(--text)', ...heroAnim(0.1) }}>
          Know where your money goes.{' '}
          <span style={{ color: '#16a34a' }}>Before it&apos;s gone.</span>
        </h1>

        <p className="landing-subtext" style={{ fontSize: 22, color: 'var(--text)', lineHeight: 1.8, marginBottom: 40, maxWidth: 760, opacity: 0.75, ...heroAnim(0.2) }}>
          Spendrift reveals your spending personality — your archetype. Track habits, spot drift, and evolve your money story one transaction at a time.
        </p>

        <div className="landing-ctas" style={{ display: 'flex', gap: 12, marginBottom: 48, flexWrap: 'wrap', ...heroAnim(0.3) }}>
          <Link href="/register" className="cta-btn" style={{
            background: 'var(--accent)', color: 'var(--accent-text)',
            padding: '16px 40px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 700, fontSize: 20,
          }}>
            Get Started — Free
          </Link>
          <Link href="/login" className="cta-btn" style={{
            background: 'transparent', border: '2px solid #16a34a', color: '#16a34a',
            padding: '16px 40px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 700, fontSize: 20,
          }}>
            Sign In
          </Link>
        </div>

        {/* Stats Bar — scroll reveal */}
        <div className="stats-bar scroll-reveal" style={{ display: 'flex', marginBottom: 80, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { value: '20',   label: 'Spending archetypes' },
            { value: '15+',  label: 'Spending categories' },
            { value: '100%', label: 'Private & secure' },
            { value: 'Free', label: 'No credit card needed' },
          ].map((stat, i, arr) => (
            <div key={stat.label} className="stat-cell" style={{
              flex: 1, padding: '28px 24px', textAlign: 'center',
              background: 'var(--sidebar-bg)',
              borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div className="stat-value" style={{ fontSize: 32, fontWeight: 800, color: '#16a34a', marginBottom: 4, letterSpacing: '-1px' }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', opacity: 0.55, fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* How it Works — scroll reveal */}
        <div style={{ marginBottom: 80 }}>
          <p className="scroll-reveal" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 32, fontWeight: 700, letterSpacing: 3 }}>HOW IT WORKS</p>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {steps.map((s, i) => (
              <div key={s.step} className="landing-card scroll-reveal" style={{
                background: 'var(--sidebar-bg)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '24px 20px',
                transitionDelay: `${i * 0.07}s`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: '#16a34a', marginBottom: 12 }}>STEP {s.step}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 10, lineHeight: 1.4 }}>{s.title}</div>
                <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.8, opacity: 0.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Highlights — scroll reveal */}
        <div style={{ marginBottom: 80 }}>
          <p className="scroll-reveal" style={{ fontSize: 20, color: 'var(--text)', marginBottom: 12, fontWeight: 700, letterSpacing: 3 }}>WHY SPENDRIFT</p>
          <p className="scroll-reveal" style={{ fontSize: 16, color: 'var(--text)', marginBottom: 40, opacity: 0.55, transitionDelay: '0.05s' }}>Built around how you actually spend — not how a spreadsheet thinks you should.</p>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { emoji: '🧠', title: 'Identity-based finance', desc: 'Most apps show you numbers. SpenDrift shows you a mirror. Your archetype is a story about who you are as a spender — and who you could become.', color: '#a78bfa' },
              { emoji: '📊', title: 'Watch your drift over time', desc: "Archetypes aren't fixed. As your habits shift, your archetype evolves. Track that drift month by month and see your financial identity change in real time.", color: '#34d399' },
              { emoji: '🔒', title: 'Private by design', desc: 'Your financial data never leaves your control. No ads, no data selling, no third-party trackers. What you spend is your business — and only yours.', color: '#60a5fa' },
            ].map((f, i) => (
              <div key={f.title} className="landing-card scroll-reveal" style={{
                background: 'var(--sidebar-bg)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '36px 32px',
                transitionDelay: `${i * 0.1}s`,
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 20 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.3px', color: 'var(--text)' }}>{f.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)', opacity: 0.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Archetype Ticker — scroll reveal */}
        <div className="scroll-reveal" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 20, color: 'var(--text)', marginBottom: 12, fontWeight: 700, letterSpacing: 3 }}>DISCOVER YOUR ARCHETYPE</p>
          <p style={{ fontSize: 16, color: 'var(--text)', marginBottom: 32, opacity: 0.55 }}>All 20 spending personalities — sign up to find yours.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', borderRadius: 16 }}>
            {/* Row 1 — scrolls left */}
            <div style={{ overflow: 'hidden' }}>
              <div className="ticker-track-left">
                {[...row1, ...row1].map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: `${a.color}15`,
                    border: `1px solid ${a.color}40`,
                    borderRadius: 40, padding: '12px 20px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 — scrolls right */}
            <div style={{ overflow: 'hidden' }}>
              <div className="ticker-track-right">
                {[...row2, ...row2].map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: `${a.color}15`,
                    border: `1px solid ${a.color}40`,
                    borderRadius: 40, padding: '12px 20px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 20 }}>{a.emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom CTA Band */}
      <div className="landing-cta-band" style={{ background: '#16a34a', padding: '80px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 className="landing-cta-h2" style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1.5px', color: '#fff', marginBottom: 16, lineHeight: 1.15 }}>
            Ready to meet your spending self?
          </h2>
          <p className="landing-cta-p" style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.7 }}>
            Join SpenDrift and discover the archetype behind your habits. Free, private, and takes less than a minute.
          </p>
          <Link href="/register" className="cta-btn" style={{
            display: 'inline-block', background: '#fff', color: '#16a34a',
            padding: '16px 48px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px',
          }}>
            Get Started — Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--sidebar-bg)', padding: '48px 64px' }}>
        <div className="footer-main" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
              <span style={{ color: 'var(--text)' }}>Spen</span>
              <span style={{ color: '#16a34a' }}>Drift</span>
            </span>
            <p style={{ fontSize: 14, color: 'var(--text)', opacity: 0.45, marginTop: 8, maxWidth: 280, lineHeight: 1.6 }}>
              Know where your money goes. Track your spending personality and drift toward better habits.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--text)', opacity: 0.4, marginBottom: 14 }}>PRODUCT</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/register" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.7, textDecoration: 'none' }}>Get Started</Link>
                <Link href="/login" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.7, textDecoration: 'none' }}>Sign In</Link>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--text)', opacity: 0.4, marginBottom: 14 }}>PROJECT</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/about" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.7, textDecoration: 'none' }}>About</Link>
                <Link href="/contact" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.7, textDecoration: 'none' }}>Contact</Link>
                <a href="https://github.com/KianNaderi10/SpenDrift" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.7, textDecoration: 'none' }}>GitHub</a>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'var(--text)', opacity: 0.4, marginBottom: 14 }}>LEGAL</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link href="/privacy" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.7, textDecoration: 'none' }}>Privacy Policy</Link>
                <Link href="/terms" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.7, textDecoration: 'none' }}>Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom" style={{ maxWidth: 1200, margin: '32px auto 0', borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.35 }}>© {new Date().getFullYear()} SpenDrift. All rights reserved.</p>
          <p style={{ fontSize: 13, color: 'var(--text)', opacity: 0.35 }}>No credit card required · Your data stays private</p>
        </div>
      </footer>
    </div>
  );
}
