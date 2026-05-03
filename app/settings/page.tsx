'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from '@/app/theme-context';

function Row({
  icon, label, sublabel, onClick, href, chevron = true, danger = false, muted: mutedColor,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  href?: string;
  chevron?: boolean;
  danger?: boolean;
  muted: string;
}) {
  const [hovered, setHovered] = useState(false);
  const labelColor = danger ? '#dc2626' : undefined;

  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 20px',
      background: hovered ? (danger ? 'rgba(220,38,38,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
      transition: 'background 0.15s',
    }}>
      <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: labelColor }}>{label}</p>
        {sublabel && <p style={{ margin: '2px 0 0', fontSize: 12, color: mutedColor }}>{sublabel}</p>}
      </div>
      {chevron && <span style={{ fontSize: 16, color: mutedColor, opacity: 0.6 }}>›</span>}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{ textDecoration: 'none', display: 'block' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
    >
      {inner}
    </button>
  );
}

function Section({ title, children, card, border }: { title: string; children: React.ReactNode; card: string; border: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#8a8a8a', padding: '0 4px', marginBottom: 8 }}>
        {title}
      </p>
      <div style={{
        background: card, border: `1px solid ${border}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {children}
      </div>
    </div>
  );
}

function Divider({ border }: { border: string }) {
  return <div style={{ height: 1, background: border, margin: '0 20px' }} />;
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const bg     = isDark ? '#0a0a0a' : '#fafafa';
  const card   = isDark ? '#1a1a1a' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5';
  const text   = isDark ? '#fafafa' : '#0a0a0a';
  const muted  = isDark ? '#8a8a8a' : '#6b6b6b';
  const accent = isDark ? '#22c55e' : '#16a34a';

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch('/api/user', { method: 'DELETE' });
    if (res.ok) {
      await signOut({ callbackUrl: '/' });
    } else {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: bg }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: card, borderBottom: `1px solid ${border}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ color: muted, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            ← Back
          </Link>
          <span style={{ color: border }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: text }}>Settings</span>
        </div>
        <button
          onClick={toggle}
          suppressHydrationWarning
          style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 15, color: muted }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px 64px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Account avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 4px' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: accent, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#ffffff',
          }}>
            {(session?.user?.name ?? session?.user?.email ?? '?')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>{session?.user?.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: muted }}>{session?.user?.email}</p>
          </div>
        </div>

        {/* Account section */}
        <Section title="ACCOUNT" card={card} border={border}>
          <Row
            icon="✏️"
            label="Edit Profile"
            sublabel="Change name or password"
            href="/profile/edit"
            muted={muted}
          />
        </Section>

        {/* Appearance */}
        <Section title="APPEARANCE" card={card} border={border}>
          <Row
            icon={isDark ? '☀️' : '🌙'}
            label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={toggle}
            chevron={false}
            muted={muted}
          />
        </Section>

        {/* Legal */}
        <Section title="LEGAL" card={card} border={border}>
          <Row icon="📄" label="Terms of Service" href="/terms" muted={muted} />
          <Divider border={border} />
          <Row icon="🔒" label="Privacy Policy" href="/privacy" muted={muted} />
        </Section>

        {/* Session */}
        <Section title="SESSION" card={card} border={border}>
          <Row
            icon="↩️"
            label="Sign Out"
            onClick={() => signOut({ callbackUrl: '/login' })}
            chevron={false}
            muted={muted}
          />
        </Section>

        {/* Danger zone */}
        <Section title="DANGER ZONE" card={card} border={border}>
          {!showDeleteConfirm ? (
            <Row
              icon="🗑️"
              label="Delete Account & Data"
              sublabel="Permanently deletes your account, transactions, and budgets"
              onClick={() => setShowDeleteConfirm(true)}
              chevron={false}
              danger
              muted={muted}
            />
          ) : (
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>
                Are you sure?
              </p>
              <p style={{ fontSize: 13, color: muted, marginBottom: 20, lineHeight: 1.5 }}>
                This will permanently delete your account, all transactions, and all budgets. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    flex: 1, background: 'none', border: `1px solid ${border}`,
                    borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 600,
                    color: text, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, background: deleting ? '#9ca3af' : '#dc2626',
                    border: 'none', borderRadius: 10, padding: '11px', fontSize: 14,
                    fontWeight: 700, color: '#ffffff',
                    cursor: deleting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete Everything'}
                </button>
              </div>
            </div>
          )}
        </Section>

        <p style={{ textAlign: 'center', fontSize: 12, color: muted }}>SpenDrift · Built for CS 4800</p>
      </div>
    </div>
  );
}
