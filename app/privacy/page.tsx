import Link from 'next/link';

export default function PrivacyPage() {
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
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#16a34a', marginBottom: 16 }}>LEGAL</p>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: 'var(--text)', opacity: 0.45, marginBottom: 56 }}>Last updated: April 28, 2025</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <Section title="Overview">
            SpenDrift ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our spending personality tracker. By using SpenDrift, you agree to the practices described in this policy.
          </Section>

          <Section title="Information We Collect">
            <p style={{ marginBottom: 12 }}>We collect the following types of information:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>Account information</strong> — your name and email address when you register.</li>
              <li><strong>Transaction data</strong> — purchases and spending entries you add manually or import via a connected bank account.</li>
              <li><strong>Usage data</strong> — how you interact with the app, including pages visited and features used.</li>
            </ul>
          </Section>

          <Section title="Bank Account Connection (Plaid)">
            If you choose to connect a bank account, SpenDrift uses <a href="https://plaid.com" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', textDecoration: 'none' }}>Plaid Inc.</a> as a trusted third-party service to facilitate the connection. Plaid retrieves your transaction history on our behalf using secure, read-only access. We do not store your bank login credentials — these are handled exclusively by Plaid and never seen by SpenDrift. By connecting a bank account, your data is also subject to <a href="https://plaid.com/legal/#end-user-privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', textDecoration: 'none' }}>Plaid's End User Privacy Policy</a>. We never initiate transactions, move funds, or share your financial data with third parties for advertising purposes. You can disconnect your bank account at any time from your account settings.
          </Section>

          <Section title="How We Use Your Information">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>To calculate and display your spending archetype.</li>
              <li>To track spending trends and drift over time.</li>
              <li>To improve the accuracy of our categorization engine.</li>
              <li>To send you account-related notifications (never marketing without consent).</li>
            </ul>
          </Section>

          <Section title="Data Sharing">
            We do not sell your personal data. We do not share your financial data with advertisers. We may share anonymized, aggregated data (e.g., "40% of users are The Foodie") that cannot be traced back to you.
          </Section>

          <Section title="Data Security">
            All data is encrypted in transit (TLS) and at rest. We follow industry-standard security practices to protect your information. In the event of a data breach, we will notify affected users within 72 hours.
          </Section>

          <Section title="Your Rights">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
              <li><strong>Deletion</strong> — request that we delete your account and all associated data.</li>
              <li><strong>Correction</strong> — request corrections to inaccurate personal data.</li>
              <li><strong>Portability</strong> — request an export of your transaction history.</li>
            </ul>
            <p style={{ marginTop: 12 }}>To exercise any of these rights, contact us at the email below.</p>
          </Section>

          <Section title="Cookies">
            We use session cookies strictly for authentication. We do not use tracking cookies or third-party advertising cookies.
          </Section>

          <Section title="Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of material changes via email or an in-app notice at least 14 days before they take effect.
          </Section>

          <Section title="Contact">
            Questions about this policy? Reach us at{' '}
            <a href="mailto:privacy@spendrift.app" style={{ color: '#16a34a', textDecoration: 'none' }}>privacy@spendrift.app</a>.
          </Section>
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
          <Link href="/terms" style={{ fontSize: 14, color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Terms of Service →</Link>
          <Link href="/" style={{ fontSize: 14, color: 'var(--text)', opacity: 0.5, textDecoration: 'none' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.3px' }}>{title}</h2>
      <div style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text)', opacity: 0.75 }}>
        {children}
      </div>
    </div>
  );
}
