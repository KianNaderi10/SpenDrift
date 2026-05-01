import Link from 'next/link';

export default function TermsPage() {
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
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 12 }}>Terms of Service</h1>
        <p style={{ fontSize: 15, color: 'var(--text)', opacity: 0.45, marginBottom: 56 }}>Last updated: April 28, 2025</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          <Section title="Acceptance of Terms">
            By creating an account or using SpenDrift, you agree to these Terms of Service. If you do not agree, please do not use the service. We may update these terms from time to time; continued use after changes constitutes acceptance.
          </Section>

          <Section title="Description of Service">
            SpenDrift is a personal finance tool that tracks your spending transactions, categorizes them, and assigns you a spending archetype based on your habits. The service is provided for personal, non-commercial use.
          </Section>

          <Section title="Eligibility">
            You must be at least 13 years of age to use SpenDrift. By using the service, you represent that you meet this requirement. If you are under 18, you represent that a parent or guardian has reviewed and agreed to these terms on your behalf.
          </Section>

          <Section title="Your Account">
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
              <li>You may not share your account with or transfer it to another person.</li>
            </ul>
          </Section>

          <Section title="Bank Account Connection">
            If you connect a bank account, you authorize SpenDrift to retrieve your transaction history in read-only mode for the purpose of generating your spending profile. You may disconnect at any time. You acknowledge that the accuracy of your archetype depends on the completeness of your transaction data.
          </Section>

          <Section title="Acceptable Use">
            <p style={{ marginBottom: 12 }}>You agree not to:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Use SpenDrift for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to any part of the service or its infrastructure.</li>
              <li>Reverse engineer, decompile, or otherwise attempt to extract source code.</li>
              <li>Use the service to store or transmit malicious code.</li>
              <li>Interfere with or disrupt the integrity or performance of the service.</li>
            </ul>
          </Section>

          <Section title="Intellectual Property">
            All content, design, and code within SpenDrift — including archetypes, categorization logic, and visual assets — is the property of SpenDrift. You retain ownership of your personal transaction data.
          </Section>

          <Section title="Disclaimer of Warranties">
            SpenDrift is provided "as is" without warranties of any kind. We do not guarantee that spending archetypes constitute financial advice. The service is for informational and entertainment purposes only. Always consult a qualified financial professional for financial decisions.
          </Section>

          <Section title="Limitation of Liability">
            To the maximum extent permitted by law, SpenDrift shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including but not limited to loss of data or financial decisions made based on the service.
          </Section>

          <Section title="Termination">
            We reserve the right to suspend or terminate your account if you violate these terms. You may delete your account at any time from your account settings. Upon deletion, your data will be permanently removed within 30 days.
          </Section>

          <Section title="Governing Law">
            These terms are governed by the laws of the State of California, without regard to conflict of law principles. Any disputes shall be resolved in the courts located in Los Angeles County, California.
          </Section>

          <Section title="Contact">
            Questions about these terms? Reach us at{' '}
            <a href="mailto:legal@spendrift.app" style={{ color: '#16a34a', textDecoration: 'none' }}>legal@spendrift.app</a>.
          </Section>
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 24 }}>
          <Link href="/privacy" style={{ fontSize: 14, color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy →</Link>
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
