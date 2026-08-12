'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(language === 'en' ? 'Please input both username and password.' : 'অনুগ্ৰহ কৰি ব্যৱহাৰকাৰীৰ নাম আৰু পাছৱৰ্ড দুয়োটা লিখক।');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (language === 'en' ? 'Authentication failed.' : 'প্ৰমাণীকৰণ ব্যৰ্থ হৈছে।'));
      }

      // Success: redirect to history archive
      router.push('/history');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'en' ? 'An error occurred during authentication.' : 'প্ৰমাণীকৰণ প্ৰক্ৰিয়াত সমস্যা হৈছে।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subpage-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '3.5rem' }}>
      <div className="wizard-card-wrapper" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🔑</span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0.5rem 0 0.25rem 0' }}>
            {language === 'en' ? 'Emergency Coordinator Portal' : 'জৰুৰীকালীন সমন্বয়ক প্ৰৱেশদ্বাৰ'}
          </h2>
          <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
            {language === 'en' 
              ? 'Sign in with authorization keys to verify incident streams and resolve active hazard reports.'
              : 'সক্ৰিয় বিপদ সংকেত সত্যতা পৰীক্ষা আৰু সমাধান কৰিবলৈ কৰ্তৃত্বশীল পাছৱৰ্ড ব্যৱহাৰ কৰি প্ৰৱেশ কৰক।'}
          </p>
        </div>

        {error && <div className="wizard-error-banner" style={{ fontSize: '0.75rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="login-username" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
              {language === 'en' ? 'Username' : 'ব্যৱহাৰকাৰীৰ নাম (Username)'}
            </label>
            <input
              id="login-username"
              type="text"
              placeholder={language === 'en' ? 'Enter coordinator username...' : 'ব্যৱহাৰকাৰীৰ নাম লিখক...'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                color: '#f8fafc',
                padding: '0.65rem 0.85rem',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
              {language === 'en' ? 'Password' : 'পাছৱৰ্ড (Password)'}
            </label>
            <input
              id="login-password"
              type="password"
              placeholder={language === 'en' ? 'Enter security token...' : 'সুৰক্ষা টোকেন লিখক...'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                color: '#f8fafc',
                padding: '0.65rem 0.85rem',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Test Credentials Box */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.03)',
            border: '1px solid rgba(59, 130, 246, 0.12)',
            borderRadius: '8px',
            padding: '0.75rem',
            fontSize: '0.75rem',
            color: '#cbd5e1',
            lineHeight: 1.45,
            marginTop: '0.25rem'
          }}>
            <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '0.15rem' }}>
              {language === 'en' ? '💡 Tester Credentials:' : '💡 পৰীক্ষামূলক প্ৰমাণপত্ৰ:'}
            </strong>
            <div>
              {language === 'en' ? 'Username:' : 'ইউজাৰনেম:'}{' '}
              <code style={{ color: '#facc15', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '3px' }}>coordinator</code>
            </div>
            <div style={{ marginTop: '0.15rem' }}>
              {language === 'en' ? 'Password:' : 'পাছৱৰ্ড:'}{' '}
              <code style={{ color: '#facc15', background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '3px' }}>assam-safety-2026</code>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', fontSize: '0.825rem', marginTop: '0.5rem' }}
          >
            {loading 
              ? (language === 'en' ? 'Authenticating Officer Keys...' : 'প্ৰমাণীকৰণ চলি আছে...') 
              : `🔑 ${language === 'en' ? 'Authenticate Access' : 'প্ৰৱেশ ক্ষমতা পৰীক্ষা কৰক'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
