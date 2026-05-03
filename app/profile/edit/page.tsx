'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTheme } from '@/app/theme-context';

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  const bg      = isDark ? '#0a0a0a' : '#fafafa';
  const card    = isDark ? '#1a1a1a' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : '#e5e5e5';
  const text    = isDark ? '#fafafa' : '#0a0a0a';
  const muted   = isDark ? '#8a8a8a' : '#6b6b6b';
  const inputBg = isDark ? '#1f1f1f' : '#ffffff';
  const accent  = isDark ? '#22c55e' : '#16a34a';

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

  const [name, setName] = useState(session?.user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const body: Record<string, string> = {};
    if (name.trim() && name.trim() !== session?.user?.name) body.name = name.trim();
    if (newPassword) {
      if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
      if (!currentPassword) { setError('Current password is required to set a new one.'); return; }
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }
    if (Object.keys(body).length === 0) {
      router.push('/dashboard');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? 'Update failed. Please try again.'); return; }

    toast.success('Profile updated');
    if (body.name) await update({ name: body.name });
    router.push('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: card, borderBottom: `1px solid ${border}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: muted, textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>
            ← Back
          </Link>
          <span style={{ color: border }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: text }}>Edit Profile</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggle}
            suppressHydrationWarning
            style={{
              background: 'none', border: `1px solid ${border}`,
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              fontSize: 15, color: muted,
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Avatar / name preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#ffffff', flexShrink: 0,
            }}>
              {(name || session?.user?.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: text, margin: 0 }}>
                {name || session?.user?.name}
              </p>
              <p style={{ fontSize: 13, color: muted, margin: '2px 0 0' }}>
                {session?.user?.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                required
                style={inputStyle}
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>
                Email
              </label>
              <input
                type="email"
                value={session?.user?.email ?? ''}
                disabled
                style={{ ...inputStyle, color: muted, cursor: 'not-allowed', background: isDark ? '#141414' : '#f5f5f5' }}
              />
              <p style={{ fontSize: 11, color: muted, marginTop: 5 }}>Email cannot be changed.</p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: muted, marginBottom: 16, letterSpacing: '0.5px' }}>
                CHANGE PASSWORD
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => { setCurrentPassword(e.target.value); setError(''); }}
                      placeholder="Enter current password"
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 16, padding: 4, lineHeight: 1 }}
                      aria-label={showCurrent ? 'Hide' : 'Show'}
                    >
                      {showCurrent ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: text, marginBottom: 7 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Leave blank to keep current"
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted, fontSize: 16, padding: 4, lineHeight: 1 }}
                      aria-label={showNew ? 'Hide' : 'Show'}
                    >
                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{error}</p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <Link
                href="/dashboard"
                style={{
                  flex: 1, textAlign: 'center',
                  background: 'none', border: `1px solid ${border}`,
                  borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600,
                  color: text, textDecoration: 'none', display: 'block',
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving ? muted : accent,
                  color: '#ffffff', border: 'none', borderRadius: 10,
                  padding: '13px', fontSize: 15, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
