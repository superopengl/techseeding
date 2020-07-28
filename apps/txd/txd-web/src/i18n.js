import i18n from "i18next";
// import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEn from './locales/en/translation.json';
import translationZh from './locales/zh/translation.json';

// the translations
// (tip move them in a JSON file and import them)
const resources = {
  en: {
    translation: translationEn
  },
  zh: {
    translation: translationZh
  }
};

i18n
  // .use(initReactI18next)
  .use(LanguageDetector) // passes i18n down to react-i18next
  .init({
    resources,
    // lng: "en",
    fallbackLng: "en",
    debug: false,
    ns: ["translation"],
    defaultNS: "translation",
    keySeparator: false, // we use content as keys
    interpolation: {
      escapeValue: false, // not needed for react!!
      formatSeparator: ","
    },
    react: {
      wait: true
    },
    detection: {
      order: ['querystring'],
      lookupQuerystring: 'lng',
    }
  });
// .use(Backend)
// .init({
//   lng: 'en',
//   fallbackLng: 'en',
//   preload: ['en', 'zh'],
//   ns: ['translation'],
//   defaultNS: 'translation',
//   backend: {
//     loadPath: '/locales/{{lng}}/{{ns}}.json'
//   }
// });

export default i18n;