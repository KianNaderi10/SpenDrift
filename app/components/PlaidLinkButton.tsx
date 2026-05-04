'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOnSuccess } from 'react-plaid-link';
import { toast } from 'sonner';

interface Props {
  onSuccess: () => void;
  C: {
    card: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    stripeBg: string;
  };
}

function LinkButton({ linkToken, onSuccess, onExit, C }: Props & { linkToken: string; onExit: () => void }) {
  const handleSuccess: PlaidLinkOnSuccess = useCallback(async (public_token) => {
    try {
      const res = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Bank connected! ${data.synced} transactions synced.`);
      onSuccess();
    } catch {
      toast.error('Failed to connect bank. Please try again.');
    }
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess: handleSuccess, onExit });

  useEffect(() => {
    if (ready) open();
  }, [ready, open]);

  return null;
}

export default function PlaidLinkButton({ onSuccess, C }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLinkToken(data.link_token);
    } catch {
      toast.error('Could not start bank connection. Try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {linkToken && (
        <LinkButton
          linkToken={linkToken}
          onSuccess={() => { setLinkToken(null); setLoading(false); onSuccess(); }}
          onExit={() => { setLinkToken(null); setLoading(false); }}
          C={C}
        />
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: `1.5px solid #16a34a`,
          background: loading ? 'rgba(22,163,74,0.06)' : 'transparent',
          color: '#16a34a',
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 18 }}>🏦</span>
        {loading ? 'Opening bank login…' : 'Connect Bank Account'}
      </button>
    </>
  );
}
