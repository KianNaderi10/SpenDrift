import Link from 'next/link';

export default function ContactPage() {
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
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#16a34a', marginBottom: 16 }}>CONTACT</p>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16 }}>Get in touch</h1>
        <p style={{ fontSize: 18, lineHeight: 1.8, opacity: 0.75, marginBottom: 64 }}>
          Have a question, found a bug, or want to give feedback? We'd love to hear from you.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'General', email: 'hello@spendrift.app', desc: 'Questions about the app or your account.' },
            { label: 'Privacy', email: 'privacy@spendrift.app', desc: 'Data requests, deletions, or privacy concerns.' },
            { label: 'Bug Reports', email: 'bugs@spendrift.app', desc: 'Found something broken? Let us know.' },
          ].map(item => (
            <a
              key={item.label}
              href={`mailto:${item.email}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--sidebar-bg)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '24px 28px',
                textDecoration: 'none',
                color: 'var(--text)',
                gap: 16,
              }}
            >
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 14, opacity: 0.5 }}>{item.desc}</p>
              </div>
              <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>{item.email}</span>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.5, textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
