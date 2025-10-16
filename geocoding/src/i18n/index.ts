import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import thTranslations from './locales/th.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  th: {
    translation: thTranslations,
  },
};

// Prevent multiple initializations with a flag
let isInitializing = false;

// Only initialize if not already initialized and not currently initializing
if (!i18n.isInitialized && !isInitializing) {
  isInitializing = true;
  
  try {
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',
        
        interpolation: {
          escapeValue: false, // React already does escaping
        },
        
        detection: {
          order: ['localStorage', 'navigator', 'htmlTag'],
          caches: ['localStorage'],
        },
      }).then(() => {
        isInitializing = false;
      }).catch((error) => {
        isInitializing = false;
        // Silently handle initialization errors to prevent console spam
        if (process.env.NODE_ENV === 'development') {
          console.warn('i18n initialization warning:', error);
        }
      });
  } catch (error) {
    isInitializing = false;
    // Handle any synchronous errors during initialization
    if (process.env.NODE_ENV === 'development') {
      console.warn('i18n initialization error:', error);
    }
  }
}

export default i18n;

