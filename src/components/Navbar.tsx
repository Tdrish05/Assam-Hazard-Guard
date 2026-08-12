'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="global-navbar">
      <div className="nav-container">
        <Link href="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ color: '#3b82f6' }}
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="logo-text" style={{ letterSpacing: '0.02em', fontWeight: 800 }}>
            {language === 'en' ? 'Assam Hazard Guard' : 'অসম বিপদ ৰক্ষক'}
          </span>
        </Link>
        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link href="/" className="nav-item">{t('nav_map')}</Link>
          <Link href="/shelters" className="nav-item">{t('nav_shelters')}</Link>
          <Link href="/report" className="nav-item">{t('nav_report')}</Link>
          <Link href="/history" className="nav-item">{t('nav_history')}</Link>
          
          {/* Dual Language Selector Button */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'as' : 'en')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              color: '#f8fafc',
              padding: '5px 12px',
              fontSize: '0.725rem',
              fontWeight: '700',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            {language === 'en' ? 'অসমীয়া (AS)' : 'English (EN)'}
          </button>
        </nav>
      </div>
    </header>
  );
}
