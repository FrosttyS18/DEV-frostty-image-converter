import { useState, useEffect } from 'react';
import { translate, getCurrentLanguage, setLanguage, Language } from '../i18n';

export function useTranslation() {
  const [currentLang, setCurrentLang] = useState<Language>(getCurrentLanguage());

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage());
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(key, params);
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setCurrentLang(lang);
  };

  return { t, currentLanguage: currentLang, changeLanguage };
}
