import Link from 'next/link';

export default function AboutPage() {
  const team = [
    { name: 'Kian Naderi', role: 'Full-Stack Developer' },
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
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--text)' }}>Spen</span>
            <span style={{ color: '#16a34a' }}>Drift</span>
          </span>
        </Link>
        <Link href="/register" style={{
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          padding: '9px 20px',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 15,
        }}>
          Get Started
        </Link>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px 120px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#16a34a', marginBottom: 16 }}>ABOUT</p>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 24 }}>Built for CS 4800</h1>
        <p style={{ fontSize: 18, lineHeight: 1.8, opacity: 0.75, marginBottom: 64 }}>
          SpenDrift is a spending personality tracker built as a capstone project for CS 4800 — Software Engineering. The goal was to design and ship a full-stack web application that helps people understand their financial habits through the lens of personality archetypes, rather than raw numbers alone.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>The Idea</h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, opacity: 0.75 }}>
              Most budgeting apps tell you what you spent. SpenDrift tells you <em>who you are</em> as a spender. By categorizing transactions and mapping them to one of 20 spending archetypes — from The Minimalist to The Socialite — we give users a more intuitive, identity-based view of their financial life.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>The Stack</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Framework', value: 'Next.js 16 (App Router)' },
                { label: 'Language', value: 'TypeScript' },
                { label: 'Styling', value: 'Inline styles + CSS variables' },
                { label: 'Auth', value: 'NextAuth.js' },
                { label: 'Database', value: 'MongoDB' },
                { label: 'Deployment', value: 'Vercel' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'var(--sidebar-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '16px 20px',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, opacity: 0.4, marginBottom: 6 }}>{item.label.toUpperCase()}</p>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>The Team</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {team.map(member => (
                <div key={member.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: 'var(--sidebar-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '16px 20px',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(22,163,74,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: '#16a34a',
                    flexShrink: 0,
                  }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{member.name}</p>
                    <p style={{ fontSize: 13, opacity: 0.5, marginTop: 2 }}>{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
          <a href="https://github.com/KianNaderi10/SpenDrift" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>View on GitHub →</a>
          <Link href="/" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.5, textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
