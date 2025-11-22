import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import ja from './locales/ja.json';
import zhTW from './locales/zh-TW.json';

const resources = {
  en: {
    translation: en
  },
  'zh-CN': {
    translation: zhCN
  },
  ja: {
    translation: ja
  },
  'zh-TW': {
    translation: zhTW
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['navigator'],
      caches: [],
    }
  });

export default i18n;

