'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey } from '@/lib/translations';

type Language = 'en' | 'as';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from sessionStorage on mount
  useEffect(() => {
    const savedLang = sessionStorage.getItem('assam_hazard_lang') as Language;
    if (savedLang === 'en' || savedLang === 'as') {
      setLanguageState(savedLang);
    } else {
      // First visit of the browser session: force default to English
      const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
      const cookieLang = match ? match[1] : '';
      
      sessionStorage.setItem('assam_hazard_lang', 'en');
      document.cookie = `lang=en; path=/; SameSite=Strict`;
      
      if (cookieLang === 'as') {
        // Old leftover persistent cookie detected. Reload once to sync server components to English
        window.location.reload();
      } else {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    sessionStorage.setItem('assam_hazard_lang', lang);
    
    // Set session cookie (removed max-age so it clears when browser is closed)
    document.cookie = `lang=${lang}; path=/; SameSite=Strict`;
    
    // Refresh the router to propagate server changes
    window.location.reload();
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language];
    return dict[key] || translations['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
