import { useState, useEffect } from 'react';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '../locales/en/translation.json';
import ar from '../locales/ar/translation.json';

const translations = { en, ar };
const i18n = new I18n(translations);

i18n.enableFallback = true;

export function useLocalization() {
  const deviceLocale = getLocales()[0].languageCode;

  const [language, setLanguage] = useState(deviceLocale ?? 'en');

  useEffect(() => {
    i18n.locale = language;
  }, [language]);

  return {
    language,
    setLanguage,
    t: i18n.t.bind(i18n),
  };
}
