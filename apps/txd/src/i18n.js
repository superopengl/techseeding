import i18n from "i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEn from './locales/en/translation.json';
import translationZh from './locales/zh/translation.json';

const resources = {
  en: {
    translation: translationEn
  },
  zh: {
    translation: translationZh
  }
};

i18n
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    ns: ["translation"],
    defaultNS: "translation",
    keySeparator: false,
    interpolation: {
      escapeValue: false,
      formatSeparator: ","
    },
    detection: {
      order: ['querystring'],
      lookupQuerystring: 'lng',
    }
  });

export default i18n;
