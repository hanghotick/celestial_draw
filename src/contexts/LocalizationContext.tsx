"use client";
import type { ReactNode } from 'react';
import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { en, type LocaleMessages } from '@/locales/en';
import { hu } from '@/locales/hu';

export type Locale = 'en' | 'hu';

interface LocalizationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof LocaleMessages, ...args: (string | number)[]) => string;
}

const translations: Record<Locale, LocaleMessages> = { en, hu };

export const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Potentially load preferred locale from localStorage here
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Potentially save preferred locale to localStorage here
  }, []);

  const t = useCallback((key: keyof LocaleMessages, ...args: (string | number)[]) => {
    const messageSet = translations[locale] || translations['en'];
    let message = messageSet[key] || String(key);
    
    if (args.length > 0) {
      args.forEach((arg, index) => {
        message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
      });
    }
    return message;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  if (!isMounted) {
    // Avoid hydration mismatch by rendering nothing or a loader until mounted
    return null; 
  }

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};
