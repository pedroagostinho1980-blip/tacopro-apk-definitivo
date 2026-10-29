import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, LANGUAGES, LanguageOption, translations, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentLanguageOption: LanguageOption;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('tacopro_language') as Language | null;
      if (saved && (translations as any)[saved]) {
        return saved;
      }
      // Attempt browser language detection
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if ((translations as any)[browserLang]) {
        return browserLang as Language;
      }
    } catch {
      // ignore
    }
    return 'pt';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('tacopro_language', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentLanguageOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const t = (key: TranslationKey): string => {
    const langDict = (translations as any)[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to Portuguese then English
    return (translations.pt as any)[key] || (translations.en as any)[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguageOption,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
