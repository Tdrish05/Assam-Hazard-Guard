'use client';

import { useState } from 'react';
import { resolveAlert, verifyAlert, logoutCoordinator } from './actions';

interface ButtonProps {
  id: number;
}

export function ResolveButton({ id }: ButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    if (!confirm('Mark this incident as resolved and remove from active maps?')) return;
    setLoading(true);
    const res = await resolveAlert(id);
    if (!res.success) {
      alert(res.error || 'Failed to resolve alert.');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleResolve}
      disabled={loading}
      className="btn-secondary"
      style={{
        padding: '2px 8px',
        fontSize: '0.675rem',
        borderColor: 'rgba(239, 68, 68, 0.4)',
        color: '#f87171',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        cursor: 'pointer'
      }}
    >
      {loading ? 'Resolving...' : '✔️ Resolve'}
    </button>
  );
}

export function VerifyButton({ id }: ButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    const res = await verifyAlert(id);
    if (!res.success) {
      alert(res.error || 'Failed to verify alert.');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="btn-primary"
      style={{
        padding: '2px 8px',
        fontSize: '0.675rem',
        backgroundColor: '#10b981',
        cursor: 'pointer'
      }}
    >
      {loading ? 'Verifying...' : '🛡️ Verify Trust'}
    </button>
  );
}

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await logoutCoordinator();
    setLoading(false);
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn-secondary"
      style={{
        fontSize: '0.75rem',
        padding: '4px 10px',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        cursor: 'pointer'
      }}
    >
      {loading ? 'Terminating Session...' : '🚪 Coordinator Logout'}
    </button>
  );
}
